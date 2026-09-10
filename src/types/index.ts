export type ToolStatus = 'TRUSTED' | 'SUSPICIOUS' | 'COMPROMISED' | 'BLOCKED' | 'PENDING_REVIEW';

export type TrustLevel = 'VERIFIED_OFFICIAL' | 'INTERNAL_DEVELOPER' | 'UNVERIFIED_COMMUNITY' | 'UNTRUSTED';

export type RiskClassification = 'SAFE' | 'SENSITIVE' | 'DANGEROUS';

export type ToolCapability = 'read-only' | 'write' | 'destructive' | 'exfiltration-capable';

export type ShieldDecision = 'ALLOW' | 'REVIEW' | 'BLOCK';

export type ThreatType = 
  | 'INTEGRITY_VIOLATION'
  | 'MALICIOUS_DESCRIPTION'
  | 'UNAUTHORIZED_TOOL'
  | 'PROMPT_INJECTION'
  | 'MALICIOUS_OUTPUT'
  | 'SUSPICIOUS_UPDATE'
  | 'CREDENTIAL_THEFT'
  | 'EXFILTRATION_ATTEMPT'
  | 'PATH_TRAVERSAL'
  | 'DESTRUCTIVE_ACTION';

export type ThreatSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ToolInputSchema {
  type: string;
  properties: Record<string, {
    type: string;
    description?: string;
    enum?: string[];
    default?: any;
  }>;
  required?: string[];
}

export interface MCPToolDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  inputSchema: ToolInputSchema;
  permissions: string[];
  riskClassification: RiskClassification;
  capability: ToolCapability;
  author?: string;
  status: ToolStatus;
  trustLevel: TrustLevel;
  trustedFingerprint: string;
  currentFingerprint?: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
}

export interface ToolVersion {
  id: string;
  toolId: string;
  version: string;
  fingerprint: string;
  metadata: {
    name: string;
    description: string;
    inputSchema: ToolInputSchema;
    permissions: string[];
    riskClassification: RiskClassification;
  };
  approved: boolean;
  approvedBy?: string;
  createdAt: string;
  changelog?: string;
}

export interface SecurityCheckItem {
  name: string;
  passed: boolean;
  scoreImpact: number;
  message: string;
  details?: Record<string, any>;
}

export interface ShieldEvaluationResult {
  decision: ShieldDecision;
  riskScore: number;
  riskLevel: ThreatSeverity;
  reasons: string[];
  checks: {
    toolExistence: SecurityCheckItem;
    integrity: SecurityCheckItem;
    authorization: SecurityCheckItem;
    descriptionScan: SecurityCheckItem;
    requestScan: SecurityCheckItem;
    outputScan?: SecurityCheckItem;
  };
  toolName: string;
  agentId: string;
  capability?: ToolCapability;
  policyFloor?: number;
  judgeResult?: any;
  timestamp: string;
  executionAllowed: boolean;
  requiresApproval: boolean;
  approvalId?: string;
}

export interface SecurityEvent {
  id: string;
  toolId: string;
  toolName: string;
  agentId: string;
  eventType: ThreatType | 'TOOL_EXECUTION' | 'TOOL_REGISTERED' | 'TOOL_UPDATED' | 'APPROVAL_GRANTED' | 'APPROVAL_REJECTED';
  riskScore: number;
  decision: ShieldDecision;
  reason: string;
  details?: Record<string, any>;
  timestamp: string;
  executed: boolean;
}

export interface ThreatRecord {
  id: string;
  toolId: string;
  toolName: string;
  agentId?: string;
  type: ThreatType;
  severity: ThreatSeverity;
  description: string;
  evidence: string;
  status: 'ACTIVE' | 'RESOLVED' | 'INVESTIGATING';
  timestamp: string;
  actionTaken: ShieldDecision;
}

export interface AgentPolicy {
  agentId: string;
  agentName: string;
  role: string;
  allowedTools: string[];
  reviewRequiredTools: string[];
  blockedTools: string[];
  maxRiskThreshold: number; // 0-100
  allowDynamicUpdates: boolean;
}

export interface ApprovalRequest {
  id: string;
  toolId: string;
  toolName: string;
  version: string;
  requestedBy: string;
  agentId?: string;
  proposedFingerprint: string;
  previousFingerprint?: string;
  changesSummary: string;
  riskScore: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
}

export interface MCPToolExecuteRequest {
  toolName: string;
  agentId: string;
  parameters: Record<string, any>;
  currentToolMetadata?: Partial<MCPToolDefinition>; // simulate modified runtime metadata from attacker
}

export interface MCPToolExecuteResponse {
  success: boolean;
  decision: ShieldDecision;
  riskScore: number;
  executed: boolean;
  result?: any;
  error?: string;
  evaluation: ShieldEvaluationResult;
  eventId: string;
}
