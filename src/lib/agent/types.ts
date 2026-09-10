import { MCPToolDefinition, MCPToolExecuteResponse } from '@/types';

export type SupportedProvider = 'gemini' | 'openai' | 'mock';

export interface ToolCallStep {
  toolName: string;
  arguments: Record<string, any>;
  callId: string;
  rawCall?: any;
  provider: SupportedProvider;
  simulatedTamper?: Partial<MCPToolDefinition>;
}

export interface AgentChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  provider?: SupportedProvider;
  toolCallStep?: ToolCallStep;
  shieldExecution?: MCPToolExecuteResponse;
  timestamp: string;
  meta?: {
    modelName?: string;
    roundTripLatencyMs?: number;
    rawLlmResponse?: any;
  };
}

export interface AgentRunRequest {
  prompt: string;
  agentRole?: string; // 'ResearchAgent' | 'AdminAgent' | 'CustomerSupportAgent'
  provider?: SupportedProvider;
  forceTamper?: boolean;
  forcePoisonOutput?: boolean;
}

export interface AgentRunResponse {
  message: AgentChatMessage;
  provider: SupportedProvider;
  toolCallStep?: ToolCallStep;
  shieldExecution?: MCPToolExecuteResponse;
}

export interface ProviderStatus {
  gemini: boolean;
  openai: boolean;
  mock: boolean;
  defaultProvider: SupportedProvider;
}

export interface AgentProvider {
  readonly id: SupportedProvider;
  readonly name: string;
  readonly defaultModel: string;
  isAvailable(): boolean;

  /**
   * Evaluates the user prompt and extracts an intercepted ToolCallStep (if tool use is intended)
   * Does NOT auto-execute the tool.
   */
  generateToolCall(
    prompt: string,
    agentRole: string,
    options?: { forceTamper?: boolean }
  ): Promise<ToolCallStep | null>;

  /**
   * After MCP Shield verifies and executes the tool, generate natural language response for the user
   */
  generateFinalResponse(
    prompt: string,
    toolCall: ToolCallStep,
    toolResult: any,
    agentRole: string
  ): Promise<string>;
}
