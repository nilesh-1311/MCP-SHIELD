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

    // 3. Seed Initial Security Events (to make SOC dashboard look active and realistic)
    const now = new Date();
    const eventTimes = [
      new Date(now.getTime() - 1000 * 60 * 15).toISOString(),
      new Date(now.getTime() - 1000 * 60 * 10).toISOString(),
      new Date(now.getTime() - 1000 * 60 * 5).toISOString(),
    ];

    this.recordSecurityEvent({
      id: 'evt_init_1',
      toolId: 'tool_file_reader',
      toolName: 'file_reader',
      agentId: 'ResearchAgent',
      eventType: 'TOOL_EXECUTION',
      riskScore: 0,
      decision: 'ALLOW',
      reason: 'Baseline verification successful. SHA-256 fingerprint verified.',
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
      reason: 'Integrity verified and policy allowed.',
      timestamp: eventTimes[1],
      executed: true,
    });

    this.recordSecurityEvent({
      id: 'evt_init_3',
      toolId: 'tool_email_sender',
      toolName: 'email_sender',
      agentId: 'ResearchAgent',
      eventType: 'UNAUTHORIZED_TOOL',
      riskScore: 35,
      decision: 'REVIEW',
      reason: 'Agent policy requires developer/human approval for sensitive email dispatch.',
      timestamp: eventTimes[2],
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
    return this.policies.get(agentId);
  }

  public updatePolicy(agentId: string, policy: Partial<AgentPolicy>): AgentPolicy | null {
    const existing = this.policies.get(agentId);
    if (!existing) return null;
    const updated = { ...existing, ...policy };
    this.policies.set(agentId, updated);
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

// Global Singleton in Node runtime
const globalForStore = global as unknown as { __mcpShieldStore: DataStore };
export const db = globalForStore.__mcpShieldStore || new DataStore();
if (process.env.NODE_ENV !== 'production') globalForStore.__mcpShieldStore = db;
