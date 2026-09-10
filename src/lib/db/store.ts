import {
  MCPToolDefinition,
  ToolVersion,
  SecurityEvent,
  ThreatRecord,
  AgentPolicy,
  ApprovalRequest,
  AuditChainVerificationResult,
} from '@/types';
import { INITIAL_MCP_TOOLS } from '../mcp/tools';
import { DEFAULT_POLICIES } from '../security/authorization';
import { calculateToolFingerprint } from '../security/fingerprint';
import { getSupabaseServerClient, isSupabaseServerConfigured } from '../supabase/server';
import { seedSupabaseDatabase } from '../supabase/seed';
import { computeAuditEntryHash, verifyAuditChain, GENESIS_HASH } from '../security/auditChain';

export interface DetectorScanRecord {
  id: string;
  scanType: 'DESCRIPTION' | 'REQUEST_PARAM' | 'OUTPUT' | 'INTEGRITY' | 'CROSS_SERVER' | 'EXFILTRATION';
  target: string;
  passed: boolean;
  threatsDetected: any[];
  riskScoreImpact: number;
  createdAt: string;
}

class DataStore {
  private tools: Map<string, MCPToolDefinition> = new Map();
  private toolVersions: Map<string, ToolVersion[]> = new Map();
  private securityEvents: SecurityEvent[] = [];
  private threats: ThreatRecord[] = [];
  private policies: Map<string, AgentPolicy> = new Map();
  private approvals: Map<string, ApprovalRequest> = new Map();
  private scans: DetectorScanRecord[] = [];
  private isInitialized = false;

  constructor() {
    this.seedLocal();
    if (typeof window === 'undefined') {
      this.initSupabase().catch((err) => {
        console.warn('[DataStore] Supabase init deferred:', err?.message);
      });
    }
  }

  /**
   * Initializes store with Supabase PostgreSQL if configured
   */
  public async initSupabase() {
    if (this.isInitialized) return;

    if (!isSupabaseServerConfigured) {
      console.log('[DataStore] Operating in local memory mode (Set SUPABASE_URL & SUPABASE_ANON_KEY in .env.local for Postgres mode).');
      this.isInitialized = true;
      return;
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) return;

    try {
      // Auto seed if remote database is empty
      await seedSupabaseDatabase();

      // 1. Fetch Tools
      const { data: dbTools, error: toolsErr } = await supabase.from('mcp_tools').select('*');
      if (!toolsErr && dbTools && dbTools.length > 0) {
        this.tools.clear();
        for (const row of dbTools) {
          const tool: MCPToolDefinition = {
            id: row.id,
            name: row.name,
            version: row.version,
            description: row.description,
            inputSchema: row.input_schema || {},
            permissions: row.permissions || [],
            riskClassification: row.risk_classification,
            capability: row.capability,
            author: row.author,
            status: row.status,
            trustLevel: row.trust_level,
            trustedFingerprint: row.trusted_fingerprint,
            currentFingerprint: row.current_fingerprint || row.trusted_fingerprint,
            approvedBy: row.approved_by,
            isHoneypot: Boolean(row.is_honeypot),
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          };
          this.tools.set(tool.name.toLowerCase(), tool);
        }
      }

      // 2. Fetch Policies
      const { data: dbPolicies, error: polErr } = await supabase.from('mcp_agent_policies').select('*');
      if (!polErr && dbPolicies && dbPolicies.length > 0) {
        this.policies.clear();
        for (const row of dbPolicies) {
          const policy: AgentPolicy = {
            agentId: row.agent_id,
            agentName: row.agent_name,
            role: row.role,
            allowedTools: row.allowed_tools || [],
            reviewRequiredTools: row.review_required_tools || [],
            blockedTools: row.blocked_tools || [],
            maxRiskThreshold: row.max_risk_threshold,
            allowDynamicUpdates: row.allow_dynamic_updates,
          };
          this.policies.set(policy.agentId, policy);
        }
      }

      // 3. Fetch Security Events (Preserve Hash Chain)
      const { data: dbEvents, error: evtsErr } = await supabase
        .from('mcp_security_events')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(200);

      if (!evtsErr && dbEvents && dbEvents.length > 0) {
        const chronological = [...dbEvents].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        let runningPrevHash = GENESIS_HASH;
        const processedEvents: SecurityEvent[] = [];

        for (const row of chronological) {
          const evt: SecurityEvent = {
            id: row.id,
            toolId: row.tool_id,
            toolName: row.tool_name,
            agentId: row.agent_id,
            eventType: row.event_type,
            riskScore: row.risk_score,
            decision: row.decision,
            reason: row.reason,
            details: row.details,
            executed: row.executed,
            prevHash: row.prev_hash || runningPrevHash,
            entryHash: row.entry_hash || '',
            timestamp: row.timestamp,
          };

          if (!evt.entryHash || evt.prevHash !== runningPrevHash) {
            evt.prevHash = runningPrevHash;
            evt.entryHash = computeAuditEntryHash(evt, evt.prevHash);
          }

          runningPrevHash = evt.entryHash;
          processedEvents.push(evt);
        }

        this.securityEvents = processedEvents.reverse();
      }

      // 4. Fetch Threats
      const { data: dbThreats, error: thrErr } = await supabase
        .from('mcp_threats')
        .select('*')
        .order('timestamp', { ascending: false });

      if (!thrErr && dbThreats && dbThreats.length > 0) {
        this.threats = dbThreats.map((row) => ({
          id: row.id,
          toolId: row.tool_id,
          toolName: row.tool_name,
          agentId: row.agent_id,
          type: row.type,
          severity: row.severity,
          description: row.description,
          evidence: row.evidence,
          status: row.status,
          timestamp: row.timestamp,
          actionTaken: row.action_taken,
        }));
      }

      // 5. Fetch Approvals
      const { data: dbApprovals, error: appErr } = await supabase
        .from('mcp_approvals')
        .select('*')
        .order('created_at', { ascending: false });

      if (!appErr && dbApprovals && dbApprovals.length > 0) {
        this.approvals.clear();
        for (const row of dbApprovals) {
          const app: ApprovalRequest = {
            id: row.id,
            toolId: row.tool_id,
            toolName: row.tool_name,
            version: row.version,
            requestedBy: row.requested_by,
            agentId: row.agent_id,
            proposedFingerprint: row.proposed_fingerprint,
            previousFingerprint: row.previous_fingerprint,
            changesSummary: row.changes_summary,
            riskScore: row.risk_score,
            status: row.status,
            createdAt: row.created_at,
            decidedAt: row.decided_at,
            decidedBy: row.decided_by,
          };
          this.approvals.set(app.id, app);
        }
      }

      this.isInitialized = true;
      console.log('✅ [DataStore] Successfully synchronized in-memory mirror from Supabase PostgreSQL.');
    } catch (err: any) {
      console.warn('[DataStore] Supabase synchronization failed, using local baseline:', err.message);
    }
  }

  public seedLocal() {
    this.tools.clear();
    this.toolVersions.clear();
    this.securityEvents = [];
    this.threats = [];
    this.policies.clear();
    this.approvals.clear();
    this.scans = [];

    // 1. Seed Tools
    for (const tool of INITIAL_MCP_TOOLS) {
      const cloned = JSON.parse(JSON.stringify(tool)) as MCPToolDefinition;
      this.tools.set(cloned.name.toLowerCase(), cloned);

      const versionRecord: ToolVersion = {
        id: `ver_${cloned.name}_1.0.0`,
        toolId: cloned.id,
        version: cloned.version,
        fingerprint: cloned.trustedFingerprint,
        metadata: {
          name: cloned.name,
          description: cloned.description,
          inputSchema: cloned.inputSchema,
          permissions: cloned.permissions,
          riskClassification: cloned.riskClassification,
        },
        approved: true,
        approvedBy: cloned.approvedBy,
        createdAt: cloned.createdAt,
        changelog: 'Initial baseline release',
      };
      this.toolVersions.set(cloned.id, [versionRecord]);
    }

    // 2. Seed Policies
    for (const [key, policy] of Object.entries(DEFAULT_POLICIES)) {
      this.policies.set(key, JSON.parse(JSON.stringify(policy)));
    }

    // 3. Seed Initial Security Events with Deterministic Hash Chain
    const now = new Date();
    const eventTimes = [
      new Date(now.getTime() - 1000 * 60 * 35).toISOString(),
      new Date(now.getTime() - 1000 * 60 * 25).toISOString(),
      new Date(now.getTime() - 1000 * 60 * 18).toISOString(),
      new Date(now.getTime() - 1000 * 60 * 12).toISOString(),
    ];

    const rawInitialEvents: Array<Partial<SecurityEvent>> = [
      {
        id: 'evt_init_1',
        toolId: 'tool_file_reader',
        toolName: 'file_reader',
        agentId: 'ResearchAgent',
        eventType: 'TOOL_EXECUTION',
        riskScore: 0,
        decision: 'ALLOW',
        reason: 'Baseline verification successful. SHA-256 fingerprint verified (read-only scope).',
        details: { parameters: { filePath: '/reports/sales.txt' } },
        timestamp: eventTimes[0],
        executed: true,
      },
      {
        id: 'evt_init_2',
        toolId: 'tool_search_tool',
        toolName: 'search_tool',
        agentId: 'ResearchAgent',
        eventType: 'TOOL_EXECUTION',
        riskScore: 0,
        decision: 'ALLOW',
        reason: 'Integrity verified and agent role authorized for vector search.',
        details: { parameters: { query: 'security policies' } },
        timestamp: eventTimes[1],
        executed: true,
      },
      {
        id: 'evt_init_3',
        toolId: 'tool_email_sender',
        toolName: 'email_sender',
        agentId: 'ResearchAgent',
        eventType: 'UNAUTHORIZED_TOOL',
        riskScore: 70,
        decision: 'REVIEW',
        reason: 'Tool capability "exfiltration-capable" enforces policy floor (70). Human approval required.',
        details: { parameters: { recipient: 'team@enterprise.internal', subject: 'Digest' } },
        timestamp: eventTimes[2],
        executed: false,
      },
      {
        id: 'evt_init_4',
        toolId: 'tool_file_reader',
        toolName: 'file_reader',
        agentId: 'CustomerSupportAgent',
        eventType: 'PROMPT_INJECTION',
        riskScore: 85,
        decision: 'BLOCK',
        reason: '[BLOCKED BEFORE EXECUTION] Parameter injection detected: path traversal and secret harvesting.',
        details: { parameters: { filePath: '../../../../etc/shadow' } },
        timestamp: eventTimes[3],
        executed: false,
      },
    ];

    // Build chain chronologically
    let prev = GENESIS_HASH;
    for (const raw of rawInitialEvents) {
      const entryHash = computeAuditEntryHash(raw, prev);
      const fullEvt: SecurityEvent = {
        ...(raw as SecurityEvent),
        prevHash: prev,
        entryHash: entryHash,
      };
      this.securityEvents.unshift(fullEvt); // unshift so most recent is first
      prev = entryHash;
    }
  }

  public seed() {
    this.seedLocal();
    if (isSupabaseServerConfigured) {
      seedSupabaseDatabase().catch(() => {});
    }
  }

  // --- Tools CRUD ---
  public getTools(): MCPToolDefinition[] {
    return Array.from(this.tools.values());
  }

  public async getToolsAsync(): Promise<MCPToolDefinition[]> {
    const supabase = getSupabaseServerClient();
    if (!supabase) return this.getTools();

    try {
      const { data, error } = await supabase.from('mcp_tools').select('*');
      if (!error && data) {
        return data.map((row) => ({
          id: row.id,
          name: row.name,
          version: row.version,
          description: row.description,
          inputSchema: row.input_schema || {},
          permissions: row.permissions || [],
          riskClassification: row.risk_classification,
          capability: row.capability,
          author: row.author,
          status: row.status,
          trustLevel: row.trust_level,
          trustedFingerprint: row.trusted_fingerprint,
          currentFingerprint: row.current_fingerprint || row.trusted_fingerprint,
          approvedBy: row.approved_by,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
      }
    } catch {
      // fallback
    }
    return this.getTools();
  }

  public getToolByName(name: string): MCPToolDefinition | undefined {
    return this.tools.get(name.toLowerCase());
  }

  public getToolById(id: string): MCPToolDefinition | undefined {
    return Array.from(this.tools.values()).find((t) => t.id === id);
  }

  public registerTool(tool: MCPToolDefinition): MCPToolDefinition {
    const canonicalTool = { ...tool };
    canonicalTool.trustedFingerprint = calculateToolFingerprint(canonicalTool);
    this.tools.set(canonicalTool.name.toLowerCase(), canonicalTool);

    const versionRecord: ToolVersion = {
      id: `ver_${canonicalTool.name}_${canonicalTool.version}`,
      toolId: canonicalTool.id,
      version: canonicalTool.version,
      fingerprint: canonicalTool.trustedFingerprint,
      metadata: {
        name: canonicalTool.name,
        description: canonicalTool.description,
        inputSchema: canonicalTool.inputSchema,
        permissions: canonicalTool.permissions,
        riskClassification: canonicalTool.riskClassification,
      },
      approved: canonicalTool.status === 'TRUSTED',
      approvedBy: canonicalTool.approvedBy,
      createdAt: new Date().toISOString(),
      changelog: 'Tool registered',
    };

    const existingVersions = this.toolVersions.get(canonicalTool.id) || [];
    existingVersions.push(versionRecord);
    this.toolVersions.set(canonicalTool.id, existingVersions);

    // Asynchronously persist to Supabase
    const supabase = getSupabaseServerClient();
    if (supabase) {
      supabase.from('mcp_tools').upsert({
        id: canonicalTool.id,
        name: canonicalTool.name,
        version: canonicalTool.version,
        description: canonicalTool.description,
        input_schema: canonicalTool.inputSchema,
        permissions: canonicalTool.permissions,
        risk_classification: canonicalTool.riskClassification,
        capability: canonicalTool.capability,
        author: canonicalTool.author,
        status: canonicalTool.status,
        trust_level: canonicalTool.trustLevel,
        trusted_fingerprint: canonicalTool.trustedFingerprint,
        current_fingerprint: canonicalTool.currentFingerprint || canonicalTool.trustedFingerprint,
        approved_by: canonicalTool.approvedBy,
        created_at: canonicalTool.createdAt,
        updated_at: new Date().toISOString(),
      }).then(() => {});

      supabase.from('mcp_tool_versions').upsert({
        id: versionRecord.id,
        tool_id: canonicalTool.id,
        version: versionRecord.version,
        fingerprint: versionRecord.fingerprint,
        metadata: versionRecord.metadata,
        approved: versionRecord.approved,
        approved_by: versionRecord.approvedBy,
        changelog: versionRecord.changelog,
        created_at: versionRecord.createdAt,
      }).then(() => {});
    }

    return canonicalTool;
  }

  public updateToolStatus(name: string, status: MCPToolDefinition['status']): boolean {
    const tool = this.tools.get(name.toLowerCase());
    if (tool) {
      tool.status = status;
      tool.updatedAt = new Date().toISOString();

      const supabase = getSupabaseServerClient();
      if (supabase) {
        supabase.from('mcp_tools').update({ status, updated_at: tool.updatedAt }).eq('id', tool.id).then(() => {});
      }
      return true;
    }
    return false;
  }

  public updateToolTrustedBaseline(name: string, updatedMetadata: Partial<MCPToolDefinition>, approvedBy: string): MCPToolDefinition | null {
    const tool = this.tools.get(name.toLowerCase());
    if (!tool) return null;

    tool.version = updatedMetadata.version || tool.version;
    tool.description = updatedMetadata.description || tool.description;
    tool.inputSchema = updatedMetadata.inputSchema || tool.inputSchema;
    tool.permissions = updatedMetadata.permissions || tool.permissions;
    tool.riskClassification = updatedMetadata.riskClassification || tool.riskClassification;
    tool.status = 'TRUSTED';
    tool.approvedBy = approvedBy;
    tool.updatedAt = new Date().toISOString();
    tool.trustedFingerprint = calculateToolFingerprint(tool);

    const versionRecord: ToolVersion = {
      id: `ver_${tool.name}_${tool.version}_${Date.now()}`,
      toolId: tool.id,
      version: tool.version,
      fingerprint: tool.trustedFingerprint,
      metadata: {
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        permissions: tool.permissions,
        riskClassification: tool.riskClassification,
      },
      approved: true,
      approvedBy,
      createdAt: new Date().toISOString(),
      changelog: `Legitimate Developer Update to ${tool.version}`,
    };

    const versions = this.toolVersions.get(tool.id) || [];
    versions.unshift(versionRecord);
    this.toolVersions.set(tool.id, versions);

    // Asynchronously persist to Supabase
    const supabase = getSupabaseServerClient();
    if (supabase) {
      supabase.from('mcp_tools').update({
        version: tool.version,
        description: tool.description,
        input_schema: tool.inputSchema,
        permissions: tool.permissions,
        risk_classification: tool.riskClassification,
        status: tool.status,
        approved_by: approvedBy,
        trusted_fingerprint: tool.trustedFingerprint,
        current_fingerprint: tool.trustedFingerprint,
        updated_at: tool.updatedAt,
      }).eq('id', tool.id).then(() => {});

      supabase.from('mcp_tool_versions').insert({
        id: versionRecord.id,
        tool_id: tool.id,
        version: versionRecord.version,
        fingerprint: versionRecord.fingerprint,
        metadata: versionRecord.metadata,
        approved: true,
        approved_by: approvedBy,
        changelog: versionRecord.changelog,
        created_at: versionRecord.createdAt,
      }).then(() => {});
    }

    return tool;
  }

  public getToolVersions(toolId: string): ToolVersion[] {
    return this.toolVersions.get(toolId) || [];
  }

  // --- Security Events (Hash-Chained & Tamper-Evident) ---
  public recordSecurityEvent(event: Partial<SecurityEvent> & { toolId: string; toolName: string; agentId: string; eventType: any; riskScore: number; decision: any; reason: string }): SecurityEvent {
    const fullEvent: SecurityEvent = {
      id: event.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      toolId: event.toolId,
      toolName: event.toolName,
      agentId: event.agentId,
      eventType: event.eventType,
      riskScore: event.riskScore,
      decision: event.decision,
      reason: event.reason,
      details: event.details || {},
      timestamp: event.timestamp || new Date().toISOString(),
      executed: event.executed ?? false,
      prevHash: event.prevHash,
      entryHash: event.entryHash,
    };

    // 1. Establish cryptographic hash chain link
    if (!fullEvent.entryHash) {
      // Find the most recent stored event hash
      const prevHash =
        this.securityEvents.length > 0 && this.securityEvents[0].entryHash
          ? this.securityEvents[0].entryHash
          : GENESIS_HASH;

      fullEvent.prevHash = fullEvent.prevHash || prevHash;
      fullEvent.entryHash = computeAuditEntryHash(fullEvent, fullEvent.prevHash);
    }

    this.securityEvents.unshift(fullEvent);
    if (this.securityEvents.length > 500) {
      this.securityEvents = this.securityEvents.slice(0, 500);
    }

    // Persist to Supabase
    const supabase = getSupabaseServerClient();
    if (supabase) {
      supabase.from('mcp_security_events').insert({
        id: fullEvent.id,
        tool_id: fullEvent.toolId,
        tool_name: fullEvent.toolName,
        agent_id: fullEvent.agentId,
        event_type: fullEvent.eventType,
        risk_score: fullEvent.riskScore,
        decision: fullEvent.decision,
        reason: fullEvent.reason,
        details: fullEvent.details || {},
        executed: fullEvent.executed,
        prev_hash: fullEvent.prevHash || GENESIS_HASH,
        entry_hash: fullEvent.entryHash || '',
        timestamp: fullEvent.timestamp,
      }).then(() => {});
    }

    return fullEvent;
  }

  public getSecurityEvents(limit = 100): SecurityEvent[] {
    return this.securityEvents.slice(0, limit);
  }

  /**
   * Cryptographically verifies the entire audit log hash chain.
   */
  public verifyAuditChain(): AuditChainVerificationResult {
    return verifyAuditChain(this.securityEvents);
  }

  /**
   * Simulates unauthorized row tampering/corruption for live SOC proof of immutability.
   */
  public tamperAuditLogForDemo(targetId?: string): {
    success: boolean;
    tamperedEventId: string;
    originalReason: string;
    tamperedReason: string;
  } {
    if (this.securityEvents.length === 0) {
      return {
        success: false,
        tamperedEventId: '',
        originalReason: '',
        tamperedReason: 'No events to tamper with.',
      };
    }

    // Pick target (or middle record)
    const index = targetId
      ? this.securityEvents.findIndex((e) => e.id === targetId)
      : Math.min(1, this.securityEvents.length - 1);

    if (index === -1) {
      return {
        success: false,
        tamperedEventId: targetId || '',
        originalReason: '',
        tamperedReason: 'Target event not found.',
      };
    }

    const original = this.securityEvents[index];
    const originalReason = original.reason;
    const tamperedReason = `[UNAUTHORIZED MODIFICATION] Database record altered by unauthorized direct SQL update!`;

    // Mutate content without re-computing the cryptographic hash
    this.securityEvents[index] = {
      ...original,
      reason: tamperedReason,
      riskScore: original.riskScore === 0 ? 99 : 0,
    };

    return {
      success: true,
      tamperedEventId: original.id,
      originalReason,
      tamperedReason,
    };
  }

  /**
   * Restores the cryptographic baseline log if tampered during simulation.
   */
  public restoreAuditLogBaseline(): { restoredCount: number } {
    this.seedLocal();
    return { restoredCount: this.securityEvents.length };
  }

  // --- Threats ---
  public recordThreat(threat: ThreatRecord): ThreatRecord {
    this.threats.unshift(threat);

    // Persist to Supabase
    const supabase = getSupabaseServerClient();
    if (supabase) {
      supabase.from('mcp_threats').insert({
        id: threat.id,
        tool_id: threat.toolId,
        tool_name: threat.toolName,
        agent_id: threat.agentId,
        type: threat.type,
        severity: threat.severity,
        description: threat.description,
        evidence: threat.evidence,
        status: threat.status,
        action_taken: threat.actionTaken,
        timestamp: threat.timestamp || new Date().toISOString(),
      }).then(() => {});
    }

    return threat;
  }

  public getThreats(): ThreatRecord[] {
    return this.threats;
  }

  // --- Policies ---
  public getPolicies(): AgentPolicy[] {
    return Array.from(this.policies.values());
  }

  public getPolicy(agentId: string): AgentPolicy | undefined {
    if (!agentId) return undefined;
    const direct = this.policies.get(agentId);
    if (direct) return direct;
    return Array.from(this.policies.values()).find(
      (p) => p.agentId.toLowerCase() === agentId.toLowerCase()
    );
  }

  public updatePolicy(agentId: string, policy: Partial<AgentPolicy>): AgentPolicy {
    const existingKey =
      Array.from(this.policies.keys()).find(
        (k) => k.toLowerCase() === agentId.toLowerCase()
      ) || agentId;

    const existing = this.policies.get(existingKey) || {
      agentId,
      agentName: policy.agentName || agentId,
      role: policy.role || 'ANALYST',
      allowedTools: ['file_reader', 'search_tool', 'report_generator'],
      reviewRequiredTools: ['email_sender'],
      blockedTools: ['destructive_tool', 'bash_executor', 'credential_dumper'],
      maxRiskThreshold: 60,
      allowDynamicUpdates: true,
    };

    const updated: AgentPolicy = {
      ...existing,
      ...policy,
      agentId: existing.agentId || agentId,
      agentName: policy.agentName || existing.agentName || agentId,
      role: policy.role || existing.role || 'ANALYST',
    };

    this.policies.set(existingKey, updated);

    // Persist to Supabase
    const supabase = getSupabaseServerClient();
    if (supabase) {
      supabase.from('mcp_agent_policies').upsert({
        agent_id: updated.agentId,
        agent_name: updated.agentName,
        role: updated.role,
        allowed_tools: updated.allowedTools,
        review_required_tools: updated.reviewRequiredTools,
        blocked_tools: updated.blockedTools,
        max_risk_threshold: updated.maxRiskThreshold,
        allow_dynamic_updates: updated.allowDynamicUpdates,
        updated_at: new Date().toISOString(),
      }).then(() => {});
    }

    return updated;
  }

  // --- Approvals ---
  public createApprovalRequest(req: ApprovalRequest): ApprovalRequest {
    this.approvals.set(req.id, req);

    const supabase = getSupabaseServerClient();
    if (supabase) {
      supabase.from('mcp_approvals').insert({
        id: req.id,
        tool_id: req.toolId,
        tool_name: req.toolName,
        version: req.version,
        requested_by: req.requestedBy,
        agent_id: req.agentId,
        proposed_fingerprint: req.proposedFingerprint,
        previous_fingerprint: req.previousFingerprint,
        changes_summary: req.changesSummary,
        risk_score: req.riskScore,
        status: req.status,
        created_at: req.createdAt || new Date().toISOString(),
      }).then(() => {});
    }

    return req;
  }

  public getApprovals(): ApprovalRequest[] {
    return Array.from(this.approvals.values()).filter((a) => a.status === 'PENDING');
  }

  public getApprovalById(id: string): ApprovalRequest | undefined {
    return this.approvals.get(id);
  }

  public decideApproval(id: string, status: 'APPROVED' | 'REJECTED', decidedBy: string): ApprovalRequest | null {
    const req = this.approvals.get(id);
    if (!req) return null;
    req.status = status;
    req.decidedAt = new Date().toISOString();
    req.decidedBy = decidedBy;

    const supabase = getSupabaseServerClient();
    if (supabase) {
      supabase.from('mcp_approvals').update({
        status,
        decided_at: req.decidedAt,
        decided_by: decidedBy,
      }).eq('id', id).then(() => {});
    }

    return req;
  }

  // --- Scans Logging ---
  public recordScan(scan: DetectorScanRecord): DetectorScanRecord {
    this.scans.unshift(scan);
    if (this.scans.length > 500) {
      this.scans = this.scans.slice(0, 500);
    }

    const supabase = getSupabaseServerClient();
    if (supabase) {
      supabase.from('mcp_scans').insert({
        id: scan.id,
        scan_type: scan.scanType,
        target: scan.target,
        passed: scan.passed,
        threats_detected: scan.threatsDetected,
        risk_score_impact: scan.riskScoreImpact,
        created_at: scan.createdAt,
      }).then(() => {});
    }

    return scan;
  }

  public getScans(limit = 100): DetectorScanRecord[] {
    return this.scans.slice(0, limit);
  }
}

// Global Singleton in Node / Next.js runtime
const globalForStore = globalThis as unknown as { __mcpShieldStore?: DataStore };
export const db = globalForStore.__mcpShieldStore ?? new DataStore();
globalForStore.__mcpShieldStore = db;

