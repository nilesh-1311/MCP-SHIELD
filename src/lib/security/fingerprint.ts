import crypto from 'crypto';
import { MCPToolDefinition, ToolInputSchema } from '@/types';

/**
 * Deterministically sort and canonicalize any JSON structure.
 * Ensures that key order differences or whitespace do not create false fingerprint mismatches.
 */
export function canonicalizeJson(obj: any): string {
  if (obj === null || obj === undefined) {
    return 'null';
  }

  if (typeof obj === 'string') {
    return JSON.stringify(obj.trim());
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    // Recursively canonicalize array elements
    const elements = obj.map((item) => canonicalizeJson(item));
    return `[${elements.join(',')}]`;
  }

  if (typeof obj === 'object') {
    // Sort keys alphabetically
    const keys = Object.keys(obj).sort();
    const keyValues = keys.map((key) => {
      const canonicalVal = canonicalizeJson(obj[key]);
      return `${JSON.stringify(key)}:${canonicalVal}`;
    });
    return `{${keyValues.join(',')}}`;
  }

  return JSON.stringify(obj);
}

/**
 * Extracts the security-critical canonical metadata subset of a tool
 */
export function extractCanonicalToolMetadata(tool: {
  name: string;
  version: string;
  description: string;
  inputSchema: ToolInputSchema;
  permissions: string[];
  riskClassification?: string;
}): Record<string, any> {
  return {
    name: tool.name.trim().toLowerCase(),
    version: tool.version.trim(),
    description: tool.description.trim(),
    inputSchema: tool.inputSchema || { type: 'object', properties: {} },
    permissions: Array.from(new Set(tool.permissions || [])).sort(),
    riskClassification: tool.riskClassification || 'SAFE',
  };
}

/**
 * Computes the deterministic SHA-256 fingerprint for tool metadata
 */
export function calculateToolFingerprint(tool: {
  name: string;
  version: string;
  description: string;
  inputSchema: ToolInputSchema;
  permissions: string[];
  riskClassification?: string;
}): string {
  const canonicalMetadata = extractCanonicalToolMetadata(tool);
  const canonicalString = canonicalizeJson(canonicalMetadata);
  
  return crypto
    .createHash('sha256')
    .update(canonicalString, 'utf8')
    .digest('hex');
}

/**
 * Format a fingerprint for SOC UI display (e.g. A72F-91C8-... or short hash)
 */
export function formatFingerprint(fingerprint: string, short = false): string {
  if (!fingerprint) return 'UNKNOWN';
  const upper = fingerprint.toUpperCase();
  if (short) {
    return `${upper.slice(0, 8)}...${upper.slice(-4)}`;
  }
  return upper;
}
