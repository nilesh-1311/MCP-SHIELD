import { MCPToolDefinition, AgentPolicy, SecurityCheckItem } from '@/types';
import { db } from '../db/store';

export interface AuthorizationResult {
  passed: boolean;
  status: 'ALLOWED' | 'REVIEW_REQUIRED' | 'BLOCKED';
  scoreImpact: number;
  message: string;
}

export const DEFAULT_POLICIES: Record<string, AgentPolicy> = {
  ResearchAgent: {
    agentId: 'ResearchAgent',
    agentName: 'Research & Intelligence Agent',
    role: 'ANALYST',
    allowedTools: ['file_reader', 'search_tool', 'report_generator'],
    reviewRequiredTools: ['email_sender'],
    blockedTools: ['destructive_tool', 'bash_executor', 'credential_dumper'],
    maxRiskThreshold: 60,
    allowDynamicUpdates: false,
  },
  AdminAgent: {
    agentId: 'AdminAgent',
    agentName: 'System Administrator Agent',
    role: 'ADMIN',
    allowedTools: ['file_reader', 'search_tool', 'report_generator', 'email_sender'],
    reviewRequiredTools: ['destructive_tool'],
    blockedTools: ['credential_dumper'],
    maxRiskThreshold: 85,
    allowDynamicUpdates: true,
  },
  CustomerSupportAgent: {
    agentId: 'CustomerSupportAgent',
    agentName: 'Customer Support Bot',
    role: 'SUPPORT',
    allowedTools: ['search_tool', 'report_generator'],
    reviewRequiredTools: ['email_sender'],
    blockedTools: ['file_reader', 'destructive_tool', 'bash_executor'],
    maxRiskThreshold: 40,
    allowDynamicUpdates: false,
  },
};

/**
 * Checks if a specific AI agent is authorized to invoke the specified tool
 */
export function checkAuthorization(
  agentId: string,
  tool: MCPToolDefinition,
  customPolicy?: AgentPolicy
): AuthorizationResult {
  const policy = customPolicy || db.getPolicy(agentId) || DEFAULT_POLICIES[agentId] || {
    agentId,
    agentName: agentId,
    role: 'UNRESTRICTED_DEFAULT',
    allowedTools: ['file_reader', 'search_tool', 'report_generator'],
    reviewRequiredTools: ['email_sender'],
    blockedTools: ['destructive_tool', 'bash_executor'],
    maxRiskThreshold: 60,
    allowDynamicUpdates: false,
  };

  const toolName = tool.name.toLowerCase();

  // 1. Explicitly Blocked
  if (policy.blockedTools.map((t) => t.toLowerCase()).includes(toolName)) {
    return {
      passed: false,
      status: 'BLOCKED',
      scoreImpact: 35,
      message: `Authorization Failed: Tool '${tool.name}' is explicitly BLOCKED by policy for agent '${policy.agentName}' (${policy.role}).`,
    };
  }

  // 2. Inherent Capability Exceeds Agent Threshold (Strict Lockdown)
  const isHighRiskTool =
    tool.capability === 'destructive' ||
    tool.capability === 'exfiltration-capable' ||
    tool.riskClassification === 'DANGEROUS';

  if (
    isHighRiskTool &&
    typeof policy.maxRiskThreshold === 'number' &&
    policy.maxRiskThreshold <= 30 &&
    !policy.allowedTools.map((t) => t.toLowerCase()).includes(toolName)
  ) {
    return {
      passed: false,
      status: 'BLOCKED',
      scoreImpact: 35,
      message: `Authorization Failed: Tool '${tool.name}' capability ('${tool.capability}') exceeds agent '${policy.agentName}' strict max risk threshold limit (${policy.maxRiskThreshold}/100 < 70).`,
    };
  }

  // 3. Requires Review / Approval
  if (policy.reviewRequiredTools.map((t) => t.toLowerCase()).includes(toolName)) {
    return {
      passed: true,
      status: 'REVIEW_REQUIRED',
      scoreImpact: 15,
      message: `Authorization Notice: Tool '${tool.name}' requires explicit developer/human approval for agent '${policy.agentName}'.`,
    };
  }

  // 4. Allowed
  if (policy.allowedTools.map((t) => t.toLowerCase()).includes(toolName) || policy.allowedTools.includes('*')) {
    return {
      passed: true,
      status: 'ALLOWED',
      scoreImpact: 0,
      message: `Authorization Passed: Agent '${policy.agentName}' has permission to execute '${tool.name}'.`,
    };
  }

  // 5. Default deny for unknown tools
  return {
    passed: false,
    status: 'BLOCKED',
    scoreImpact: 30,
    message: `Authorization Failed: Tool '${tool.name}' is not in the allowed tools list for agent '${policy.agentName}'.`,
  };
}

export function toAuthorizationCheckItem(result: AuthorizationResult): SecurityCheckItem {
  return {
    name: 'Agent Authorization & RBAC Check',
    passed: result.status !== 'BLOCKED',
    scoreImpact: result.scoreImpact,
    message: result.message,
    details: {
      status: result.status,
    },
  };
}
