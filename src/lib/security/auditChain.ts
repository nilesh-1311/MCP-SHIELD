import crypto from 'crypto';
import { SecurityEvent, AuditChainVerificationResult } from '@/types';

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

export function canonicalizeEvent(event: Partial<SecurityEvent>): string {
  let detailsString = '{}';
  if (event.details && typeof event.details === 'object') {
    try {
      const sortedKeys = Object.keys(event.details).sort();
      const sortedObj: Record<string, any> = {};
      for (const k of sortedKeys) {
        sortedObj[k] = (event.details as any)[k];
      }
      detailsString = JSON.stringify(sortedObj);
    } catch {
      detailsString = '{}';
    }
  }

  const canonicalTuple = [
    event.id || '',
    event.toolId || '',
    event.toolName || '',
    event.agentId || '',
    event.eventType || '',
    typeof event.riskScore === 'number' ? event.riskScore.toString() : '0',
    event.decision || '',
    event.reason || '',
    detailsString,
    event.timestamp || '',
    event.executed ? 'true' : 'false',
  ];

  return canonicalTuple.join('|');
}

export function computeAuditEntryHash(
  event: Partial<SecurityEvent>,
  prevHash: string = GENESIS_HASH
): string {
  const canonicalData = canonicalizeEvent(event);
  const payload = `${prevHash}::${canonicalData}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

export function verifyAuditChain(
  events: SecurityEvent[]
): AuditChainVerificationResult {
  const now = new Date().toISOString();

  if (!events || events.length === 0) {
    return {
      valid: true,
      totalEntries: 0,
      genesisHash: GENESIS_HASH,
      latestHash: GENESIS_HASH,
      verifiedAt: now,
    };
  }

  const chronologicalEvents = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  let expectedPrev = GENESIS_HASH;

  for (let i = 0; i < chronologicalEvents.length; i++) {
    const entry = chronologicalEvents[i];
    const actualPrev = entry.prevHash || GENESIS_HASH;

    if (actualPrev !== expectedPrev) {
      return {
        valid: false,
        totalEntries: chronologicalEvents.length,
        genesisHash: GENESIS_HASH,
        latestHash: chronologicalEvents[chronologicalEvents.length - 1].entryHash || 'UNKNOWN',
        brokenIndex: i,
        brokenEventId: entry.id,
        expectedPrevHash: expectedPrev,
        actualPrevHash: actualPrev,
        reason: `Previous hash pointer mismatch at entry index #${i} (ID: ${entry.id}). Expected '${expectedPrev.substring(0, 16)}...', but found '${actualPrev.substring(0, 16)}...'. Row insertion, deletion, or reordering detected!`,
        verifiedAt: now,
      };
    }

    const expectedHash = computeAuditEntryHash(entry, actualPrev);
    const actualHash = entry.entryHash;

    if (!actualHash || actualHash !== expectedHash) {
      return {
        valid: false,
        totalEntries: chronologicalEvents.length,
        genesisHash: GENESIS_HASH,
        latestHash: chronologicalEvents[chronologicalEvents.length - 1].entryHash || 'UNKNOWN',
        brokenIndex: i,
        brokenEventId: entry.id,
        expectedHash,
        actualHash: actualHash || 'MISSING',
        reason: `Cryptographic payload hash mismatch at entry index #${i} (ID: ${entry.id}). Expected '${expectedHash.substring(0, 16)}...', but found '${(actualHash || '').substring(0, 16)}...'. Row field modification detected!`,
        verifiedAt: now,
      };
    }

    expectedPrev = actualHash;
  }

  return {
    valid: true,
    totalEntries: chronologicalEvents.length,
    genesisHash: GENESIS_HASH,
    latestHash: chronologicalEvents[chronologicalEvents.length - 1].entryHash || GENESIS_HASH,
    verifiedAt: now,
  };
}
