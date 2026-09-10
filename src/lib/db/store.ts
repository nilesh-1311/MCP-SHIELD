import {
  MCPToolDefinition,
  ToolVersion,
  SecurityEvent,
  ThreatRecord,
  AgentPolicy,
  ApprovalRequest,
  ShieldDecision,
  ThreatType,
} from '@/types';
import { INITIAL_MCP_TOOLS } from '../mcp/tools';
import { DEFAULT_POLICIES } from '../security/authorization';
import { calculateToolFingerprint } from '../security/fingerprint';

class DataStore {
  private tools: Map<string, MCPToolDefinition> = new Map();
  private toolVersions: Map<string, ToolVersion[]> = new Map();
  private securityEvents: SecurityEvent[] = [];
  private threats: ThreatRecord[] = [];
  private policies: Map<string, AgentPolicy> = new Map();
  private approvals: Map<string, ApprovalRequest> = new Map();

  constructor() {
    this.seed();
  }

  public seed() {
    this.tools.clear();
    this.toolVersions.clear();
    this.securityEvents = [];
    this.threats = [];
    this.policies.clear();
    this.approvals.clear();

    // 1. Seed Tools
    for (const tool of INITIAL_MCP_TOOLS) {
      const cloned = JSON.parse(JSON.stringify(tool)) as MCPToolDefinition;
      this.tools.set(cloned.name.toLowerCase(), cloned);

      // Seed Version v1.0.0
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

    // 3. Seed Initial Security Events (to make SOC dashboard & audit logs active and realistic)
    const now = new Date();
    const eventTimes = [
      new Date(now.getTime() - 1000 * 60 * 35).toISOString(),
      new Date(now.getTime() - 1000 * 60 * 25).toISOString(),
      new Date(now.getTime() - 1000 * 60 * 18).toISOString(),
      new Date(now.getTime() - 1000 * 60 * 12).toISOString(),
      new Date(now.getTime() - 1000 * 60 * 8).toISOString(),
      new Date(now.getTime() - 1000 * 60 * 3).toISOString(),
    ];

    this.recordSecurityEvent({
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
    });

    this.recordSecurityEvent({
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
    });

    this.recordSecurityEvent({
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
    });

    this.recordSecurityEvent({
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
    });

    this.recordSecurityEvent({
      id: 'evt_init_5',
      toolId: 'tool_report_generator',
      toolName: 'report_generator',
      agentId: 'AdminAgent',
      eventType: 'TOOL_EXECUTION',
      riskScore: 10,
      decision: 'ALLOW',
      reason: 'Analytical report generated safely under AdminAgent authorization.',
      details: { parameters: { title: 'Q3 Infrastructure Audit', format: 'summary' } },
      timestamp: eventTimes[4],
      executed: true,
    });

    this.recordSecurityEvent({
      id: 'evt_init_6',
      toolId: 'tool_file_reader',
      toolName: 'file_reader',
      agentId: 'ResearchAgent',
      eventType: 'INTEGRITY_VIOLATION',
      riskScore: 90,
      decision: 'BLOCK',
      reason: '[BLOCKED BEFORE EXECUTION] SHA-256 fingerprint mismatch vs registered baseline. Tool metadata modified.',
      details: { checks: { integrity: { passed: false, mismatch: true } } },
      timestamp: eventTimes[5],
      executed: false,
    });
  }

  // --- Tools CRUD ---
  public getTools(): MCPToolDefinition[] {
    return Array.from(this.tools.values());
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

    return canonicalTool;
  }

  public updateToolStatus(name: string, status: MCPToolDefinition['status']): boolean {
    const tool = this.tools.get(name.toLowerCase());
    if (tool) {
      tool.status = status;
      tool.updatedAt = new Date().toISOString();
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

    return tool;
  }

  public getToolVersions(toolId: string): ToolVersion[] {
    return this.toolVersions.get(toolId) || [];
  }

  // --- Security Events ---
  public recordSecurityEvent(event: SecurityEvent): SecurityEvent {
    this.securityEvents.unshift(event);
    if (this.securityEvents.length > 500) {
      this.securityEvents = this.securityEvents.slice(0, 500);
    }
    return event;
  }

  public getSecurityEvents(limit = 100): SecurityEvent[] {
    return this.securityEvents.slice(0, limit);
  }

  // --- Threats ---
  public recordThreat(threat: ThreatRecord): ThreatRecord {
    this.threats.unshift(threat);
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
    return updated;
  }

  // --- Approvals ---
  public createApprovalRequest(req: ApprovalRequest): ApprovalRequest {
    this.approvals.set(req.id, req);
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
    return req;
  }
}

// Global Singleton in Node / Next.js runtime
const globalForStore = globalThis as unknown as { __mcpShieldStore?: DataStore };
export const db = globalForStore.__mcpShieldStore ?? new DataStore();
if (process.env.NODE_ENV !== 'production') {
  globalForStore.__mcpShieldStore = db;
}

