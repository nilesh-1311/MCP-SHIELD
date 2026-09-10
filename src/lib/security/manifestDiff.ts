import { formatFingerprint, calculateToolFingerprint } from './fingerprint';

export interface ManifestDiffResult {
  toolName: string;
  oldVersion: string;
  newVersion: string;
  oldFingerprint: string;
  newFingerprint: string;
  fingerprintMatch: boolean;
  changedFields: string[];
  descriptionDiff: {
    original: string;
    modified: string;
    injectedSegment?: string;
  };
  permissionDiff: {
    added: string[];
    removed: string[];
    unchanged: string[];
  };
  riskScore: number;
  securityDecision: 'ALLOW' | 'REVIEW' | 'BLOCK';
  summary: string;
}

/**
 * Computes a detailed GitHub-style manifest diff between trusted baseline and modified runtime tool
 */
export function computeManifestDiff(
  oldManifest: {
    name: string;
    version: string;
    description: string;
    permissions: string[];
    inputSchema?: any;
    trustedFingerprint?: string;
  },
  newManifest: {
    name: string;
    version: string;
    description: string;
    permissions: string[];
    inputSchema?: any;
  },
  riskScore = 0,
  decision: 'ALLOW' | 'REVIEW' | 'BLOCK' = 'BLOCK'
): ManifestDiffResult {
  const oldFingerprint = oldManifest.trustedFingerprint || calculateToolFingerprint(oldManifest as any);
  const newFingerprint = calculateToolFingerprint(newManifest as any);
  const fingerprintMatch = oldFingerprint.toLowerCase() === newFingerprint.toLowerCase();

  const changedFields: string[] = [];
  if (oldManifest.version !== newManifest.version) changedFields.push('version');
  if (oldManifest.description !== newManifest.description) changedFields.push('description');
  if (JSON.stringify(oldManifest.permissions) !== JSON.stringify(newManifest.permissions)) changedFields.push('permissions');
  if (JSON.stringify(oldManifest.inputSchema) !== JSON.stringify(newManifest.inputSchema)) changedFields.push('inputSchema');

  // Identify injected text segment in description
  let injectedSegment: string | undefined = undefined;
  if (newManifest.description.startsWith(oldManifest.description)) {
    injectedSegment = newManifest.description.slice(oldManifest.description.length).trim();
  } else if (newManifest.description !== oldManifest.description) {
    injectedSegment = newManifest.description;
  }

  // Permission diff
  const oldPermSet = new Set(oldManifest.permissions || []);
  const newPermSet = new Set(newManifest.permissions || []);

  const added = (newManifest.permissions || []).filter((p) => !oldPermSet.has(p));
  const removed = (oldManifest.permissions || []).filter((p) => !newPermSet.has(p));
  const unchanged = (oldManifest.permissions || []).filter((p) => newPermSet.has(p));

  return {
    toolName: newManifest.name,
    oldVersion: oldManifest.version,
    newVersion: newManifest.version,
    oldFingerprint: formatFingerprint(oldFingerprint),
    newFingerprint: formatFingerprint(newFingerprint),
    fingerprintMatch,
    changedFields,
    descriptionDiff: {
      original: oldManifest.description,
      modified: newManifest.description,
      injectedSegment,
    },
    permissionDiff: {
      added,
      removed,
      unchanged,
    },
    riskScore,
    securityDecision: decision,
    summary: fingerprintMatch
      ? 'Manifest verified: Exact SHA-256 match with trusted baseline.'
      : `Manifest modified: ${changedFields.join(', ')} altered. SHA-256 signature mismatch.`,
  };
}
