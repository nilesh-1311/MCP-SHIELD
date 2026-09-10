import { getSupabaseServerClient, isSupabaseServerConfigured } from './server';
import { INITIAL_MCP_TOOLS } from '../mcp/tools';
import { DEFAULT_POLICIES } from '../security/authorization';
import { calculateToolFingerprint } from '../security/fingerprint';
import { computeAuditEntryHash, GENESIS_HASH } from '../security/auditChain';

export async function seedSupabaseDatabase() {
  if (!isSupabaseServerConfigured) {
    console.log('[Supabase Seed] Supabase credentials not configured in .env.local, skipping remote seed.');
    return;
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  try {
    // 1. Check if tools table already has rows
    const { count, error: countErr } = await supabase.from('mcp_tools').select('*', { count: 'exact', head: true });
    if (countErr) {
      console.warn('[Supabase Seed] Could not query mcp_tools table (ensure schema.sql has been executed):', countErr.message);
      return;
    }

    if (count && count >= INITIAL_MCP_TOOLS.length) {
      console.log(`[Supabase Seed] Database already initialized with ${count} tools.`);
      return;
    }

    console.log('[Supabase Seed] Initializing baseline tools and policies in Supabase...');

    // 2. Seed Tools
    for (const tool of INITIAL_MCP_TOOLS) {
      const fingerprint = tool.trustedFingerprint || calculateToolFingerprint(tool);
      await supabase.from('mcp_tools').upsert({
        id: tool.id,
        name: tool.name,
        version: tool.version,
        description: tool.description,
        input_schema: tool.inputSchema,
        permissions: tool.permissions,
        risk_classification: tool.riskClassification,
        capability: tool.capability,
        author: tool.author || 'Security Core',
        status: tool.status,
        trust_level: tool.trustLevel,
        trusted_fingerprint: fingerprint,
        current_fingerprint: fingerprint,
        approved_by: tool.approvedBy || 'SecOps Admin',
        is_honeypot: Boolean(tool.isHoneypot),
        created_at: tool.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Seed Version v1.0.0
      await supabase.from('mcp_tool_versions').upsert({
        id: `ver_${tool.name}_1.0.0`,
        tool_id: tool.id,
        version: tool.version,
        fingerprint: fingerprint,
        metadata: {
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
          permissions: tool.permissions,
          riskClassification: tool.riskClassification,
        },
        approved: true,
        approved_by: tool.approvedBy || 'SecOps Admin',
        changelog: 'Initial baseline release',
        created_at: tool.createdAt || new Date().toISOString(),
      });
    }

    // 3. Seed Policies
    for (const [key, policy] of Object.entries(DEFAULT_POLICIES)) {
      await supabase.from('mcp_agent_policies').upsert({
        agent_id: policy.agentId,
        agent_name: policy.agentName,
        role: policy.role,
        allowed_tools: policy.allowedTools,
        review_required_tools: policy.reviewRequiredTools,
        blocked_tools: policy.blockedTools,
        max_risk_threshold: policy.maxRiskThreshold,
        allow_dynamic_updates: policy.allowDynamicUpdates,
        updated_at: new Date().toISOString(),
      });
    }

    // 4. Seed Initial Security Events with Deterministic Hash Chain
    const now = new Date();
    const rawEvents = [
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
        timestamp: new Date(now.getTime() - 1000 * 60 * 35).toISOString(),
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
        timestamp: new Date(now.getTime() - 1000 * 60 * 25).toISOString(),
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
        timestamp: new Date(now.getTime() - 1000 * 60 * 18).toISOString(),
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
        timestamp: new Date(now.getTime() - 1000 * 60 * 12).toISOString(),
        executed: false,
      },
    ];

    let prevHash = GENESIS_HASH;
    for (const raw of rawEvents) {
      const entryHash = computeAuditEntryHash(raw as any, prevHash);
      const dbRow = {
        id: raw.id,
        tool_id: raw.toolId,
        tool_name: raw.toolName,
        agent_id: raw.agentId,
        event_type: raw.eventType,
        risk_score: raw.riskScore,
        decision: raw.decision,
        reason: raw.reason,
        details: raw.details,
        executed: raw.executed,
        prev_hash: prevHash,
        entry_hash: entryHash,
        timestamp: raw.timestamp,
      };
      await supabase.from('mcp_security_events').upsert(dbRow);
      prevHash = entryHash;
    }

    console.log('✅ [Supabase Seed] Successfully seeded baseline records in Supabase.');
  } catch (err: any) {
    console.error('[Supabase Seed] Error seeding database:', err.message);
  }
}
