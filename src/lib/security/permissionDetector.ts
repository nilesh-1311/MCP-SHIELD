export interface PermissionEscalationResult {
  detected: boolean;
  baselinePermissions: string[];
  requestedPermissions: string[];
  escalatedPermissions: string[];
  scoreImpact: number;
  message: string;
}

const PRIVILEGED_PERMISSIONS = [
  'network:external_access',
  'network:all',
  'filesystem:write_root',
  'email:send_unrestricted',
  'shell:exec',
  'credentials:read',
];

/**
 * Detects unauthorized permission escalation between a tool's trusted baseline and new runtime request
 */
export function detectPermissionEscalation(
  baselinePermissions: string[] = [],
  newPermissions: string[] = []
): PermissionEscalationResult {
  const baselineSet = new Set(baselinePermissions.map((p) => p.toLowerCase().trim()));
  const escalated: string[] = [];

  for (const perm of newPermissions) {
    const normalized = perm.toLowerCase().trim();
    if (!baselineSet.has(normalized)) {
      escalated.push(perm);
    }
  }

  if (escalated.length > 0) {
    const isHighPrivilege = escalated.some((p) =>
      PRIVILEGED_PERMISSIONS.includes(p.toLowerCase()) ||
      p.includes('network') ||
      p.includes('external') ||
      p.includes('write') ||
      p.includes('exec')
    );

    const scoreImpact = isHighPrivilege ? 35 : 20;

    return {
      detected: true,
      baselinePermissions,
      requestedPermissions: newPermissions,
      escalatedPermissions: escalated,
      scoreImpact,
      message: `🚨 PERMISSION ESCALATION DETECTED: Tool requested ${escalated.length} new unapproved permission(s): [${escalated.join(', ')}]. Re-authorization required.`,
    };
  }

  return {
    detected: false,
    baselinePermissions,
    requestedPermissions: newPermissions,
    escalatedPermissions: [],
    scoreImpact: 0,
    message: 'Permission boundaries verified: No unapproved escalation.',
  };
}
