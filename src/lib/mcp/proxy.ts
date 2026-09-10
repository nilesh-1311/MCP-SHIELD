import { MCPToolExecuteRequest, MCPToolExecuteResponse } from '@/types';
import { shieldEngine } from '../security/shieldEngine';
import { localMcpServer } from './server';
import { db } from '../db/store';

export interface ExecutionTelemetry {
  totalExecutionAttempts: number;
  totalForwardedToMcpServer: number;
  totalBlockedRequests: number;
  totalActuallyExecuted: number;
  lastExecutionAudit: {
    toolName: string;
    agentId: string;
    executionAttemptId: string;
    forwardedToMcpServer: boolean;
    actuallyExecuted: boolean;
    decision: 'ALLOW' | 'REVIEW' | 'BLOCK';
    riskScore: number;
    timestamp: string;
  } | null;
}

class RealMCPProxy {
  private telemetry: ExecutionTelemetry = {
    totalExecutionAttempts: 0,
    totalForwardedToMcpServer: 0,
    totalBlockedRequests: 0,
    totalActuallyExecuted: 0,
    lastExecutionAudit: null,
  };

  public getTelemetry(): ExecutionTelemetry {
    return { ...this.telemetry };
  }

  public resetTelemetry() {
    this.telemetry = {
      totalExecutionAttempts: 0,
      totalForwardedToMcpServer: 0,
      totalBlockedRequests: 0,
      totalActuallyExecuted: 0,
      lastExecutionAudit: null,
    };
  }

  /**
   * Main Intercepted Execution Endpoint of the Real MCP Proxy
   * Guarantees that if decision === 'BLOCK', the request is NEVER forwarded to the MCP server.
   */
  async handleProxyToolCall(
    request: MCPToolExecuteRequest,
    isPreApproved = false
  ): Promise<MCPToolExecuteResponse & { telemetry: ExecutionTelemetry['lastExecutionAudit'] }> {
    this.telemetry.totalExecutionAttempts++;
    const attemptId = `exec_att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Dispatch through MCP Shield Security Engine
    const shieldResult = await shieldEngine.interceptAndExecute(request, isPreApproved);

    const isBlocked = shieldResult.decision === 'BLOCK' || (shieldResult.decision === 'REVIEW' && !isPreApproved);
    const wasForwarded = shieldResult.decision === 'ALLOW' && shieldResult.executed;
    const wasActuallyExecuted = wasForwarded && shieldResult.success;

    if (isBlocked) {
      this.telemetry.totalBlockedRequests++;
    } else {
      this.telemetry.totalForwardedToMcpServer++;
      if (wasActuallyExecuted) {
        this.telemetry.totalActuallyExecuted++;
      }
    }

    const auditEntry = {
      toolName: request.toolName,
      agentId: request.agentId,
      executionAttemptId: attemptId,
      forwardedToMcpServer: wasForwarded,
      actuallyExecuted: wasActuallyExecuted,
      decision: shieldResult.decision,
      riskScore: shieldResult.riskScore,
      timestamp: new Date().toISOString(),
    };

    this.telemetry.lastExecutionAudit = auditEntry;

    return {
      ...shieldResult,
      telemetry: auditEntry,
    };
  }
}

export const mcpProxy = new RealMCPProxy();
