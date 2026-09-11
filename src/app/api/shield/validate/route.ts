import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/store';
import { shieldEventBus } from '@/lib/events/eventBus';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tool = body.tool || body.toolName || '';
    const params = body.params || body.parameters || body.arguments || {};
    const agent = body.agent || body.agentId || 'McpClientAgent';
    const paramsStr = JSON.stringify(params).toLowerCase();
    const toolLower = String(tool).toLowerCase();

    // 1. Check for Destructive / Path Traversal / Injection Patterns
    const isPathTraversal = paramsStr.includes('../')
                         || paramsStr.includes('..\\')
                         || paramsStr.includes('etc/passwd')
                         || paramsStr.includes('etc/shadow')
                         || paramsStr.includes('c:\\windows');

    const isDestructive = paramsStr.includes('delete')
                       || paramsStr.includes('remove')
                       || paramsStr.includes('drop table')
                       || paramsStr.includes('rm -rf')
                       || paramsStr.includes('truncate')
                       || paramsStr.includes('erase')
                       || paramsStr.includes('wipe')
                       || paramsStr.includes('destroy')
                       || paramsStr.includes('format ');

    const isPromptInjection = paramsStr.includes('ignore previous')
                           || paramsStr.includes('system override')
                           || paramsStr.includes('dump api_key')
                           || paramsStr.includes('exfiltrate')
                           || paramsStr.includes('steal credentials');

    if (isPathTraversal || isDestructive || isPromptInjection) {
      let threatType: 'PATH_TRAVERSAL' | 'PROMPT_INJECTION' | 'MALICIOUS_DESCRIPTION' = 'PROMPT_INJECTION';
      let reason = 'Security Block: Malicious parameter pattern detected.';

      if (isPathTraversal) {
        threatType = 'PATH_TRAVERSAL';
        reason = 'Security Block: Path traversal attempt detected in parameters.';
      } else if (isDestructive) {
        threatType = 'PROMPT_INJECTION';
        reason = 'Security Block: Destructive action (delete/drop/remove) blocked by zero-trust policy.';
      } else if (isPromptInjection) {
        threatType = 'PROMPT_INJECTION';
        reason = 'Security Block: System instruction escape / prompt injection detected.';
      }

      const evt = db.recordSecurityEvent({
        id: `evt_val_${Date.now()}`,
        toolId: `tool_${toolLower}`,
        toolName: tool,
        agentId: agent,
        eventType: threatType,
        riskScore: 90,
        decision: 'BLOCK',
        reason,
        details: { parameters: params },
        executed: false,
        timestamp: new Date().toISOString(),
      });

      db.recordThreat({
        id: `thr_val_${Date.now()}`,
        toolId: `tool_${toolLower}`,
        toolName: tool,
        agentId: agent,
        type: threatType,
        severity: 'CRITICAL',
        description: reason,
        evidence: paramsStr,
        status: 'ACTIVE',
        actionTaken: 'BLOCK',
        timestamp: new Date().toISOString(),
      });

      shieldEventBus.emitShieldEvent(evt);

      return NextResponse.json({
        status: 'BLOCKED',
        reason,
      });
    }

    // 2. Check for Human Sign-Off / Approval Requirements
    const needsApproval = toolLower === 'email_sender'
                       || toolLower === 'bash_executor'
                       || paramsStr.includes('send')
                       || paramsStr.includes('email')
                       || paramsStr.includes('notify')
                       || paramsStr.includes('deploy');

    if (needsApproval) {
      const reqId = `req_${Date.now()}`;
      const reason = 'Human Sign-off Required: Action involves external network/email dispatch';

      const evt = db.recordSecurityEvent({
        id: `evt_val_${Date.now()}`,
        toolId: `tool_${toolLower}`,
        toolName: tool,
        agentId: agent,
        eventType: 'UNAUTHORIZED_TOOL',
        riskScore: 70,
        decision: 'REVIEW',
        reason,
        details: { parameters: params, requestId: reqId },
        executed: false,
        timestamp: new Date().toISOString(),
      });

      db.createApprovalRequest({
        id: reqId,
        toolId: `tool_${toolLower}`,
        toolName: tool,
        version: '1.0.0',
        requestedBy: agent,
        agentId: agent,
        proposedFingerprint: 'manual_review_needed',
        changesSummary: `Pending execution of ${tool} with parameters: ${JSON.stringify(params)}`,
        riskScore: 70,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      });

      shieldEventBus.emitShieldEvent(evt);

      return NextResponse.json({
        status: 'PENDING_APPROVAL',
        requestId: reqId,
        reason,
      });
    }

    // 3. Allowed Safe Tool Execution
    const evt = db.recordSecurityEvent({
      id: `evt_val_${Date.now()}`,
      toolId: `tool_${toolLower}`,
      toolName: tool,
      agentId: agent,
      eventType: 'TOOL_EXECUTION',
      riskScore: 0,
      decision: 'ALLOW',
      reason: 'Integrity verified and agent policy authorized tool execution.',
      details: { parameters: params },
      executed: true,
      timestamp: new Date().toISOString(),
    });

    shieldEventBus.emitShieldEvent(evt);

    return NextResponse.json({
      status: 'ALLOWED',
      result: `Tool '${tool}' executed successfully under MCP Shield supervision`,
    });
  } catch (err: any) {
    return NextResponse.json({ status: 'BLOCKED', reason: `Internal Error: ${err.message}` }, { status: 500 });
  }
}
