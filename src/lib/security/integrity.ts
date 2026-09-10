import { MCPToolDefinition, SecurityCheckItem } from '@/types';
import { calculateToolFingerprint, formatFingerprint } from './fingerprint';

export interface IntegrityCheckResult {
  passed: boolean;
  trustedFingerprint: string;
  currentFingerprint: string;
  mismatch: boolean;
  scoreImpact: number;
  message: string;
}

/**
 * Verifies that the runtime tool definition matches the cryptographically signed/trusted fingerprint
 */
export function verifyToolIntegrity(
  trustedTool: MCPToolDefinition,
  currentRuntimeMetadata?: Partial<MCPToolDefinition>
): IntegrityCheckResult {
  const trustedFingerprint = trustedTool.trustedFingerprint;
  
  // If runtime metadata is provided (e.g. intercepted from the MCP server or simulated attacker payload), compute its fingerprint
  const currentFingerprint = currentRuntimeMetadata
    ? calculateToolFingerprint({
        name: currentRuntimeMetadata.name ?? trustedTool.name,
        version: currentRuntimeMetadata.version ?? trustedTool.version,
        description: currentRuntimeMetadata.description ?? trustedTool.description,
        inputSchema: currentRuntimeMetadata.inputSchema ?? trustedTool.inputSchema,
        permissions: currentRuntimeMetadata.permissions ?? trustedTool.permissions,
        riskClassification: currentRuntimeMetadata.riskClassification ?? trustedTool.riskClassification,
      })
    : trustedTool.trustedFingerprint;

  const isMatch = trustedFingerprint.toLowerCase() === currentFingerprint.toLowerCase();

  if (!isMatch) {
    return {
      passed: false,
      trustedFingerprint,
      currentFingerprint,
      mismatch: true,
      scoreImpact: 40,
      message: `Integrity Violation: Runtime fingerprint (${formatFingerprint(currentFingerprint, true)}) differs from trusted baseline (${formatFingerprint(trustedFingerprint, true)}). Tool metadata has been modified!`,
    };
  }

  return {
    passed: true,
    trustedFingerprint,
    currentFingerprint,
    mismatch: false,
    scoreImpact: 0,
    message: `Integrity Verified: Runtime SHA-256 fingerprint matches registered baseline (${formatFingerprint(trustedFingerprint, true)}).`,
  };
}

export function toSecurityCheckItem(result: IntegrityCheckResult): SecurityCheckItem {
  return {
    name: 'Tool Integrity & Fingerprint Verification',
    passed: result.passed,
    scoreImpact: result.scoreImpact,
    message: result.message,
    details: {
      trustedFingerprint: result.trustedFingerprint,
      currentFingerprint: result.currentFingerprint,
      mismatch: result.mismatch,
    },
  };
}
