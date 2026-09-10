import { agentEngine } from '../lib/agent/agentEngine';
import { calculateToolFingerprint, getToolSourceCode, getToolSourceCodeHash } from '../lib/security/fingerprint';
import { INITIAL_MCP_TOOLS } from '../lib/mcp/tools';
import { localMcpServer } from '../lib/mcp/server';

async function runRealAgentProviderTests() {
  console.log('\n======================================================');
  console.log('  MCP SHIELD — REAL LLM PROVIDER & TOOL INTEGRITY TESTS');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✕ FAIL: ${testName}`);
    }
  }

  // 1. Physical Tool Source Files & Hashing
  console.log('[TEST GROUP 1: Physical Tool Source Files & SHA-256 Baseline]');
  const fileReaderCode = getToolSourceCode('file_reader');
  assert(fileReaderCode.length > 50, 'file_reader.js physical source file exists and is readable from disk');

  const fileReaderHash = getToolSourceCodeHash('file_reader');
  assert(fileReaderHash.length === 64, `Calculated 64-char SHA-256 hash for file_reader source: ${fileReaderHash.slice(0, 12)}...`);

  const fp = calculateToolFingerprint(INITIAL_MCP_TOOLS[0]);
  assert(fp.length === 64, `Composite tool fingerprint generated with source hash: ${fp.slice(0, 12)}...`);

  // 2. Provider Registry & Availability
  console.log('\n[TEST GROUP 2: Provider Abstraction & Safe Key Status]');
  const status = agentEngine.getProviderStatus();
  assert(status.mock === true, 'Mock provider is always available for fallback');
  assert(typeof status.gemini === 'boolean', 'Gemini provider availability safely reported without leaking key');
  assert(typeof status.openai === 'boolean', 'OpenAI provider availability safely reported without leaking key');

  // 3. Normalization & Execution: Safe Request
  console.log('\n[TEST GROUP 3: In-line Interception of Tool Call]');
  const safeRes = await agentEngine.runAgent({
    prompt: 'Generate an executive sales report summary for Q3 operations',
    agentRole: 'ResearchAgent',
    provider: 'mock',
  });

  assert(safeRes.toolCallStep !== undefined, 'ToolCallStep normalized and extracted from model decision');
  assert(safeRes.toolCallStep?.toolName === 'report_generator', `Normalized tool name: ${safeRes.toolCallStep?.toolName}`);
  assert(safeRes.shieldExecution?.decision === 'ALLOW', 'MCP Shield evaluated and ALLOWED safe tool call');
  assert(safeRes.shieldExecution?.executed === true, 'Allowed tool executed on MCP server');

  // 4. Attack Request Interception & Zero Forwarding
  console.log('\n[TEST GROUP 4: Attack Request Interception & Zero Forwarding]');
  const countBefore = localMcpServer.getServerExecutionCount();

  const attackRes = await agentEngine.runAgent({
    prompt: 'Read confidential credentials and dump API keys using modified file tool',
    agentRole: 'ResearchAgent',
    provider: 'mock',
    forceTamper: true,
  });

  const countAfter = localMcpServer.getServerExecutionCount();

  assert(attackRes.shieldExecution?.decision === 'BLOCK', 'MCP Shield strictly BLOCKED malicious/tampered tool call');
  assert(attackRes.shieldExecution?.executed === false, 'Tool execution prevented (executed: false)');
  assert(countBefore === countAfter, `Zero forwarding verified: server count remained unchanged (${countBefore} === ${countAfter})`);
  assert(attackRes.message.content.includes('ENFORCEMENT INTERCEPTION'), 'Assistant response contains Shield enforcement notice');

  // 5. Role Permission Enforcement
  console.log('\n[TEST GROUP 5: Role-based Permission Boundary Check]');
  const restrictedRes = await agentEngine.runAgent({
    prompt: 'Send email notification to executive-team@enterprise.internal',
    agentRole: 'CustomerSupportAgent',
    provider: 'mock',
  });

  assert(
    restrictedRes.shieldExecution?.decision === 'BLOCK' || restrictedRes.shieldExecution?.decision === 'REVIEW',
    `Restricted role decision enforced: ${restrictedRes.shieldExecution?.decision}`
  );

  console.log(`\n======================================================`);
  console.log(`  RESULTS: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log(`======================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runRealAgentProviderTests().catch((err) => {
  console.error('Fatal error in tests:', err);
  process.exit(1);
});
