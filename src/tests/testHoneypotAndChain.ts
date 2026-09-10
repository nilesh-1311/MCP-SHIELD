import { db } from '../lib/db/store';
import { attackLab } from '../lib/security/attackLab';
import { evaluateToolCall } from '../lib/security/evaluator';
import { GENESIS_HASH } from '../lib/security/auditChain';

export async function runHoneypotAndChainTests() {
  console.log('========================================================================');
  console.log('🍯 & 🔗  FEATURE 1 (HONEYPOT) & FEATURE 2 (HASH-CHAIN) ACCEPTANCE TESTS');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(name: string, condition: boolean, details?: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name}`);
      if (details) console.error(`     Details: ${details}`);
    }
  }

  // FEATURE 1: Honeypot / Decoy Tools
  const allTools = await db.getTools();
  const honeypots = allTools.filter((t) => t.isHoneypot === true);
  const honeypotNames = honeypots.map((t) => t.name);

  assert(
    'Honeypots registered: credential_vault_reader, admin_backdoor_tool, bypass_rbac_debug, internal_secrets_dump',
    honeypots.length === 4 &&
      honeypotNames.includes('credential_vault_reader') &&
      honeypotNames.includes('admin_backdoor_tool') &&
      honeypotNames.includes('bypass_rbac_debug') &&
      honeypotNames.includes('internal_secrets_dump'),
    `Found ${honeypots.length} honeypots: ${honeypotNames.join(', ')}`
  );

  const honeypotEval = await evaluateToolCall(
    'CompromisedAgent_007',
    'credential_vault_reader',
    { target_service: 'aws_production_keys' }
  );

  assert(
    'Honeypot Invocation -> Intercepted with Fake Containment Payload and fakeDecoy=true',
    honeypotEval.executed === false &&
      honeypotEval.decision === 'BLOCK' &&
      honeypotEval.fakeDecoy === true &&
      honeypotEval.result?.status === 'CONTAINED',
    `Decision: ${honeypotEval.decision}, fakeDecoy: ${honeypotEval.fakeDecoy}`
  );

  const threats = await db.getThreats();
  const honeypotThreat = threats.find(
    (t) => t.type === 'HONEYPOT_TRIGGERED' && t.toolName === 'credential_vault_reader'
  );

  assert(
    'Threat Center receives immediate CRITICAL alert for Honeypot trigger',
    honeypotThreat !== undefined && honeypotThreat.severity === 'CRITICAL',
    `Threat found: ${JSON.stringify(honeypotThreat)}`
  );

  const attackLabHoneypot = await attackLab.runScenario('honeypot_canary');
  assert(
    'Attack Lab Honeypot Canary scenario -> Triggers CRITICAL block & contained payload',
    attackLabHoneypot.decision === 'BLOCK' &&
      attackLabHoneypot.riskScore === 100 &&
      attackLabHoneypot.blockedBeforeExecution === true,
    `Attack Lab result: decision=${attackLabHoneypot.decision}, score=${attackLabHoneypot.riskScore}`
  );

  // FEATURE 2: Tamper-Evident Hash-Chained Audit Log
  const initialVerification = await db.verifyAuditChain();
  assert(
    'Audit Log Hash Chain -> Fully verified cryptographically (Genesis to Head)',
    initialVerification.valid === true &&
      initialVerification.totalEntries > 0 &&
      initialVerification.brokenIndex === undefined,
    `valid=${initialVerification.valid}, entries=${initialVerification.totalEntries}`
  );

  const events = await db.getSecurityEvents(100);
  const oldestEvent = events[events.length - 1];
  assert(
    'Genesis Entry links to 64-character zero-block Genesis Hash',
    oldestEvent.prevHash === GENESIS_HASH && typeof oldestEvent.entryHash === 'string',
    `Oldest prevHash: ${oldestEvent.prevHash}`
  );

  const headBefore = events[0];
  const newRecordedEvent = await db.recordSecurityEvent({
    toolId: 'file_reader',
    toolName: 'file_reader',
    agentId: 'TestAgent',
    eventType: 'TOOL_EXECUTION',
    riskScore: 10,
    decision: 'ALLOW',
    reason: 'Cryptographic chain continuity verification test',
    executed: true,
  });

  assert(
    'New Security Event inherits head entryHash as its prevHash',
    newRecordedEvent.prevHash === headBefore.entryHash &&
      typeof newRecordedEvent.entryHash === 'string' &&
      newRecordedEvent.entryHash.length === 64,
    `New prevHash=${newRecordedEvent.prevHash}, Expected=${headBefore.entryHash}`
  );

  const tamperResult = await db.tamperAuditLogForDemo();
  assert(
    'Tamper Simulation -> Injects stealth payload into Audit Log',
    tamperResult.success === true && tamperResult.tamperedEventId.length > 0,
    `Tamper success: ${tamperResult.success}, eventId: ${tamperResult.tamperedEventId}`
  );

  const verificationAfterTamper = await db.verifyAuditChain();
  console.log('    [DEBUG] verificationAfterTamper:', JSON.stringify(verificationAfterTamper, null, 2));
  console.log('    [DEBUG] tamperResult:', JSON.stringify(tamperResult, null, 2));

  assert(
    'Audit Log Verification catches tampering and pinpoints exact broken event',
    verificationAfterTamper.valid === false &&
      (verificationAfterTamper.brokenEventId === tamperResult.tamperedEventId ||
        verificationAfterTamper.brokenIndex !== undefined),
    `Broken index=${verificationAfterTamper.brokenIndex}, eventId=${verificationAfterTamper.brokenEventId}, Valid=${verificationAfterTamper.valid}`
  );

  await db.restoreAuditLogBaseline();
  const verificationAfterRestore = await db.verifyAuditChain();
  assert(
    'Restore Baseline -> Recomputes and seals unbroken hash chain',
    verificationAfterRestore.valid === true && verificationAfterRestore.brokenIndex === undefined,
    `valid=${verificationAfterRestore.valid}`
  );

  console.log('\n========================================================================');
  console.log(`HONEYPOT & HASH CHAIN SUMMARY: ${passed}/${total} Tests Passed (${Math.round((passed / total) * 100)}%)`);
  console.log('========================================================================\n');

  if (passed !== total) {
    throw new Error(`Honeypot & Hash Chain tests failed: ${passed}/${total} passed`);
  }
}
