import { MCPToolDefinition } from '@/types';
import { calculateToolFingerprint } from '../security/fingerprint';

const now = new Date().toISOString();

export const INITIAL_MCP_TOOLS: MCPToolDefinition[] = [
  {
    id: 'tool_file_reader',
    name: 'file_reader',
    version: '1.0.0',
    description: 'Reads files from an approved project directory.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'Relative path to the approved file to read',
        },
      },
      required: ['filePath'],
    },
    permissions: ['filesystem:read_approved'],
    riskClassification: 'SAFE',
    capability: 'read-only',
    author: 'DevSecOps Team <security@enterprise.internal>',
    status: 'TRUSTED',
    trustLevel: 'VERIFIED_OFFICIAL',
    trustedFingerprint: '', // calculated below
    createdAt: now,
    updatedAt: now,
    approvedBy: 'SecOps Automated CI/CD',
  },
  {
    id: 'tool_report_generator',
    name: 'report_generator',
    version: '1.0.0',
    description: 'Generates analytical security and business summaries for authorized agents.',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Title of the report',
        },
        format: {
          type: 'string',
          description: 'Output format',
          enum: ['summary', 'detailed', 'json'],
        },
      },
      required: ['title'],
    },
    permissions: ['analytics:read', 'reports:generate'],
    riskClassification: 'SAFE',
    capability: 'write',
    author: 'Analytics Core <analytics@enterprise.internal>',
    status: 'TRUSTED',
    trustLevel: 'VERIFIED_OFFICIAL',
    trustedFingerprint: '',
    createdAt: now,
    updatedAt: now,
    approvedBy: 'SecOps Automated CI/CD',
  },
  {
    id: 'tool_search_tool',
    name: 'search_tool',
    version: '1.0.0',
    description: 'Searches local vector indexed knowledge base and project documents.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search keyword or semantic query',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of items to return',
        },
      },
      required: ['query'],
    },
    permissions: ['knowledge_base:read'],
    riskClassification: 'SAFE',
    capability: 'read-only',
    author: 'Search Core <search@enterprise.internal>',
    status: 'TRUSTED',
    trustLevel: 'VERIFIED_OFFICIAL',
    trustedFingerprint: '',
    createdAt: now,
    updatedAt: now,
    approvedBy: 'SecOps Automated CI/CD',
  },
  {
    id: 'tool_email_sender',
    name: 'email_sender',
    version: '1.0.0',
    description: 'Simulates dispatching notification summaries to approved team email distribution lists.',
    inputSchema: {
      type: 'object',
      properties: {
        recipient: {
          type: 'string',
          description: 'Approved recipient email address',
        },
        subject: {
          type: 'string',
          description: 'Subject line of email',
        },
        body: {
          type: 'string',
          description: 'Body content of email',
        },
      },
      required: ['recipient', 'subject', 'body'],
    },
    permissions: ['network:email_dispatch_sim'],
    riskClassification: 'SENSITIVE',
    capability: 'exfiltration-capable',
    author: 'Communication Service <comms@enterprise.internal>',
    status: 'TRUSTED',
    trustLevel: 'INTERNAL_DEVELOPER',
    trustedFingerprint: '',
    createdAt: now,
    updatedAt: now,
    approvedBy: 'Security Lead (Alice)',
  },
  // ============================================================================
  // HONEYPOT / DECOY CANARY TOOLS (Near-100% Compromise Signal Traps)
  // ============================================================================
  {
    id: 'tool_credential_vault_reader',
    name: 'credential_vault_reader',
    version: '1.0.0',
    description: 'Direct read interface to enterprise credential vault and service passwords.',
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: {
          type: 'string',
          description: 'Target vault secret path (e.g. /vault/production/db_credentials)',
        },
      },
      required: ['vaultPath'],
    },
    permissions: ['vault:master_read'],
    riskClassification: 'DANGEROUS',
    capability: 'destructive',
    author: 'Enterprise Vault Team <vault-admin@enterprise.internal>',
    status: 'TRUSTED',
    trustLevel: 'VERIFIED_OFFICIAL',
    trustedFingerprint: '',
    createdAt: now,
    updatedAt: now,
    approvedBy: 'SecOps Automated CI/CD',
    isHoneypot: true,
  },
  {
    id: 'tool_admin_backdoor_tool',
    name: 'admin_backdoor_tool',
    version: '1.0.0',
    description: 'Emergency system recovery console for unauthenticated elevated diagnostic execution.',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'Raw administrative shell command to execute directly on host',
        },
      },
      required: ['command'],
    },
    permissions: ['system:root_shell_exec'],
    riskClassification: 'DANGEROUS',
    capability: 'destructive',
    author: 'Emergency SecOps <emergency-admin@enterprise.internal>',
    status: 'TRUSTED',
    trustLevel: 'INTERNAL_DEVELOPER',
    trustedFingerprint: '',
    createdAt: now,
    updatedAt: now,
    approvedBy: 'SecOps Automated CI/CD',
    isHoneypot: true,
  },
  {
    id: 'tool_bypass_rbac_debug',
    name: 'bypass_rbac_debug',
    version: '1.0.0',
    description: 'Testing utility to temporarily override role-based guardrail enforcement.',
    inputSchema: {
      type: 'object',
      properties: {
        targetAgentId: {
          type: 'string',
          description: 'Agent identifier to exempt from guardrail policies',
        },
      },
      required: ['targetAgentId'],
    },
    permissions: ['security:rbac_override'],
    riskClassification: 'DANGEROUS',
    capability: 'destructive',
    author: 'Security Testing Lab <qa-security@enterprise.internal>',
    status: 'TRUSTED',
    trustLevel: 'INTERNAL_DEVELOPER',
    trustedFingerprint: '',
    createdAt: now,
    updatedAt: now,
    approvedBy: 'SecOps Automated CI/CD',
    isHoneypot: true,
  },
  {
    id: 'tool_internal_secrets_dump',
    name: 'internal_secrets_dump',
    version: '1.0.0',
    description: 'Dumps all environment keys, cloud IAM session tokens, and database connection strings.',
    inputSchema: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          enum: ['json', 'env', 'raw'],
          description: 'Output format for dumped environment credentials',
        },
      },
      required: ['format'],
    },
    permissions: ['iam:extract_tokens', 'env:dump_all'],
    riskClassification: 'DANGEROUS',
    capability: 'exfiltration-capable',
    author: 'Diagnostic Utilities <diagnostics@enterprise.internal>',
    status: 'TRUSTED',
    trustLevel: 'INTERNAL_DEVELOPER',
    trustedFingerprint: '',
    createdAt: now,
    updatedAt: now,
    approvedBy: 'SecOps Automated CI/CD',
    isHoneypot: true,
  },
];

// Initialize SHA-256 fingerprints deterministically
INITIAL_MCP_TOOLS.forEach((tool) => {
  tool.trustedFingerprint = calculateToolFingerprint(tool);
});
