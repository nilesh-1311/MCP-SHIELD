import { shieldEngine } from '../security/shieldEngine';
import {
  AgentChatMessage,
  AgentProvider,
  AgentRunRequest,
  AgentRunResponse,
  ProviderStatus,
  SupportedProvider,
  ToolCallStep,
} from './types';
import { GeminiAgentProvider } from './providers/geminiProvider';
import { OpenAIAgentProvider } from './providers/openaiProvider';
import { MockAgentProvider } from './providers/mockProvider';
import { localMcpServer } from '../mcp/server';

export class AIAgentEngine {
  private providers: Map<SupportedProvider, AgentProvider> = new Map();

  constructor() {
    this.registerProvider(new GeminiAgentProvider());
    this.registerProvider(new OpenAIAgentProvider());
    this.registerProvider(new MockAgentProvider());
  }

  public registerProvider(provider: AgentProvider) {
    this.providers.set(provider.id, provider);
  }

  public getProviderStatus(): ProviderStatus {
    const geminiAvail = Boolean(process.env.GEMINI_API_KEY?.trim());
    const openaiAvail = Boolean(process.env.OPENAI_API_KEY?.trim());

    let defaultProvider: SupportedProvider = 'mock';
    if (geminiAvail) defaultProvider = 'gemini';
    else if (openaiAvail) defaultProvider = 'openai';

    return {
      gemini: geminiAvail,
      openai: openaiAvail,
      mock: true,
      defaultProvider,
    };
  }

  private resolveProvider(requested?: SupportedProvider): { provider: AgentProvider; actualId: SupportedProvider } {
    if (requested && this.providers.has(requested)) {
      const p = this.providers.get(requested)!;
      if (p.isAvailable()) {
        return { provider: p, actualId: requested };
      }
    }

    // Auto-select best available
    if (process.env.GEMINI_API_KEY?.trim()) {
      return { provider: this.providers.get('gemini')!, actualId: 'gemini' };
    }
    if (process.env.OPENAI_API_KEY?.trim()) {
      return { provider: this.providers.get('openai')!, actualId: 'openai' };
    }

    return { provider: this.providers.get('mock')!, actualId: 'mock' };
  }

  /**
   * Main runtime entrypoint:
   * 1. Calls chosen LLM provider to extract normalized ToolCallStep (without auto-executing).
   * 2. In-line MCP Shield evaluates integrity, permissions, risk score, and authorization.
   * 3. If ALLOWED -> execute real tool on MCP Server -> feed back to LLM for final output.
   * 4. If BLOCKED/REVIEW -> strictly HALT execution (zero calls forwarded) -> return Shield verdict.
   */
  async runAgent(request: AgentRunRequest): Promise<AgentRunResponse> {
    const startTime = Date.now();
    const agentRole = request.agentRole || 'ResearchAgent';
    const { provider, actualId } = this.resolveProvider(request.provider);

    let toolCallStep: ToolCallStep | null = null;

    try {
      toolCallStep = await provider.generateToolCall(request.prompt, agentRole, {
        forceTamper: request.forceTamper,
      });
    } catch (err: any) {
      console.warn(`[AgentEngine] Provider ${actualId} failed (${err.message}). Falling back to mock provider.`);
      const fallback = this.providers.get('mock')!;
      toolCallStep = await fallback.generateToolCall(request.prompt, agentRole, {
        forceTamper: request.forceTamper,
      });
    }

    // If no tool call was intended by the LLM, answer conversationally
    if (!toolCallStep) {
      const assistantMessage: AgentChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `I analyzed your prompt without invoking MCP tools. How can I assist you with MCP Shield security?`,
        provider: actualId,
        timestamp: new Date().toISOString(),
        meta: {
          modelName: provider.defaultModel,
          roundTripLatencyMs: Date.now() - startTime,
        },
      };

      return {
        message: assistantMessage,
        provider: actualId,
      };
    }

    // IN-LINE MCP SHIELD GATEWAY INTERCEPTION (3-Layer Gate)
    const shieldResult = await shieldEngine.interceptAndExecute(
      {
        toolName: toolCallStep.toolName,
        agentId: agentRole,
        parameters: toolCallStep.arguments,
        currentToolMetadata: toolCallStep.simulatedTamper,
      },
      false,
      {
        userPrompt: request.prompt,
      }
    );

    let assistantContent = '';

    if (shieldResult.decision === 'BLOCK') {
      assistantContent = `🛑 [MCP SHIELD ENFORCEMENT INTERCEPTION]\n` +
        `I generated a function call for '${toolCallStep.toolName}', but MCP Shield strictly BLOCKED execution before forwarding to the MCP server.\n\n` +
        `• Reasons: ${shieldResult.evaluation.reasons.join('; ')}\n` +
        `• Assessed Risk Score: ${shieldResult.riskScore}/100 (${shieldResult.evaluation.riskLevel})\n` +
        `• Server Execution Forwarding: PREVENTED (0 server invocations)`;
    } else if (shieldResult.decision === 'REVIEW') {
      assistantContent = `⏸️ [MCP SHIELD APPROVAL REQUIRED]\n` +
        `Tool '${toolCallStep.toolName}' requires human authorization under agent policy (${agentRole}).\n` +
        `Approval ID: ${shieldResult.evaluation.approvalId || 'PENDING'}.\n` +
        `Execution is quarantined pending SecOps approval.`;
    } else {
      // ALLOWED: Generate final natural language summary with the real tool output
      try {
        assistantContent = await provider.generateFinalResponse(
          request.prompt,
          toolCallStep,
          shieldResult.result,
          agentRole
        );
      } catch {
        assistantContent = `Tool '${toolCallStep.toolName}' executed successfully through MCP Shield.\n\n` +
          `Result: ${JSON.stringify(shieldResult.result, null, 2)}`;
      }
    }

    const finalMessage: AgentChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: assistantContent,
      provider: actualId,
      toolCallStep,
      shieldExecution: shieldResult,
      timestamp: new Date().toISOString(),
      meta: {
        modelName: provider.defaultModel,
        roundTripLatencyMs: Date.now() - startTime,
      },
    };

    return {
      message: finalMessage,
      provider: actualId,
      toolCallStep,
      shieldExecution: shieldResult,
    };
  }

  /**
   * Backward-compatible helper for existing route callers
   */
  async processUserMessage(
    userPrompt: string,
    agentId = 'ResearchAgent',
    options?: {
      forceTamper?: boolean;
      forcePoisonOutput?: boolean;
      provider?: SupportedProvider;
    }
  ): Promise<AgentChatMessage> {
    const res = await this.runAgent({
      prompt: userPrompt,
      agentRole: agentId,
      provider: options?.provider,
      forceTamper: options?.forceTamper,
      forcePoisonOutput: options?.forcePoisonOutput,
    });
    return res.message;
  }
}

export const agentEngine = new AIAgentEngine();
export * from './types';
