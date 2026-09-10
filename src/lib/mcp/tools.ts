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
];

// Initialize SHA-256 fingerprints deterministically
INITIAL_MCP_TOOLS.forEach((tool) => {
  tool.trustedFingerprint = calculateToolFingerprint(tool);
});
