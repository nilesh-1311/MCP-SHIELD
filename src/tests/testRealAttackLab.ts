import { evaluateToolCall } from '../lib/security/evaluator';
import { attackLab } from '../lib/security/attackLab';
import { redTeamAgent } from '../lib/security/redTeamAgent';
import { readSandboxFile } from '../lib/tools/realFileReader';
import { generateRealReport } from '../lib/tools/realReportGenerator';
import { sendRealEmail } from '../lib/tools/realEmailSender';
import { shieldEventBus } from '../lib/events/eventBus';
import fs from 'fs';
import path from 'path';

async function runLiveAttackLabTests() {
  console.log('\n======================================================');
  console.log('  MCP SHIELD — LIVE ATTACK MONITOR & EVALUATOR TESTS');
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

  // 1. Central Evaluator & Event Bus
  console.log('[TEST GROUP 1: Central evaluateToolCall & Event Bus]');
  let eventCaptured: boolean = false;
  const unsubscribe = shieldEventBus.onShieldEvent((data) => {
    if (data.event.toolName === 'search_tool') {
      eventCaptured = true;
    }
  });

  const safeEval = await evaluateToolCall('ResearchAgent', 'search_tool', { query: 'security' });
  assert(safeEval.decision === 'ALLOW', 'Central evaluateToolCall allowed safe search_tool call');
  assert(safeEval.executed === true, 'Safe tool marked as executed: true');
  assert(Boolean(eventCaptured), 'mcp-shield:events event bus broadcasted live event to listeners');
  unsubscribe();

  // 2. Real Scoped File Reader & Path Traversal Rejection
  console.log('\n[TEST GROUP 2: Real Scoped File Reader]');
  const goodFile = readSandboxFile('sales_q3.txt');
  assert(goodFile.success === true, 'Successfully read real file from ./sandbox-files/sales_q3.txt');
  assert((goodFile.bytesRead || 0) > 50, `Read ${goodFile.bytesRead} bytes from real disk file`);

  const traversalFile = readSandboxFile('../../../../etc/shadow');
  assert(traversalFile.success === false, 'Path traversal outside sandbox was strictly rejected');
  assert(Boolean(traversalFile.error?.includes('traversal')), 'Error message explicitly reports path traversal denial');

  // 3. Real Report Generator Disk Writes
  console.log('\n[TEST GROUP 3: Real Report Generator Disk Writes]');
  const reportGen = generateRealReport({ title: 'Autonomous Fleet Audit Report', format: 'detailed' });
  assert(reportGen.success === true, 'Real report generated successfully');
  assert(reportGen.downloadUrl.includes('/api/reports/download?file='), `Download URL generated: ${reportGen.downloadUrl}`);

  const reportDiskPath = path.join(process.cwd(), 'sandbox-files', 'generated-reports', reportGen.fileName);
  assert(fs.existsSync(reportDiskPath), `Real report file physically exists on disk at ${reportGen.fileName}`);

  // 4. Real Email Sender Safeguards
  console.log('\n[TEST GROUP 4: Real Email Sender Safeguards]');
  const emailRes = await sendRealEmail({
    recipient: 'hacker@darkweb.io',
    subject: 'Security Alert',
    body: 'Audit completed',
  });
  assert(emailRes.status === 'success', 'Email function completed with dry-run status');
  assert(emailRes.dryRun === true, 'DRY_RUN protection is enabled by default');
  assert(emailRes.recipient === 'test-inbox@mcpshield.internal', 'Recipient safely contained to test inbox');

  // 5. Attack Lab Scenarios via evaluateToolCall
  console.log('\n[TEST GROUP 5: Attack Lab Scenarios (evaluateToolCall)]');
  const rugPullRes = await attackLab.runScenario('manifest_tampering');
  assert(rugPullRes.decision === 'BLOCK', 'Manifest tampering blocked by central evaluator');
  assert(rugPullRes.actualServerExecutions === 0, 'Zero server executions verified on rug pull attack');
  assert(rugPullRes.manifestDiff !== undefined, 'Manifest diff computed between baseline and mutated tool');

  const crossServerRes = await attackLab.runScenario('cross_server_hijack');
  assert(crossServerRes.decision === 'BLOCK', 'Cross-server hijack attack blocked');

  const exfilRes = await attackLab.runScenario('data_exfiltration');
  assert(exfilRes.decision === 'BLOCK', 'Data exfiltration sink blocked');

  // 6. Autonomous Red-Team Simulation
  console.log('\n[TEST GROUP 6: Autonomous Red-Team Adversary]');
  const redTeamSim = await redTeamAgent.runSimulation(3);
  assert(redTeamSim.totalTurns === 3, `Red-Team completed ${redTeamSim.totalTurns} adversarial turns`);
  assert(redTeamSim.attacksBlocked >= 2, `${redTeamSim.attacksBlocked} attacks blocked before execution`);
  assert(redTeamSim.turns[0].blockedBeforeExecution === true, 'Turn #1 blocked before execution');

  console.log(`\n======================================================`);
  console.log(`  RESULTS: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log(`======================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runLiveAttackLabTests().catch((err) => {
  console.error('Fatal error in Live Attack Lab tests:', err);
  process.exit(1);
});
