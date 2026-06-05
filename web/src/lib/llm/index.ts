import type { Message, QueryEngineEvent, ModelProvider } from "@/types";
import { getProviderConfig, validateProviderConfig } from "./providers";
import { createAnthropicProvider } from "./anthropic";
import { createOpenAIProvider } from "./openai";

export type { ProviderConfig } from "./providers";

export interface LLMProvider {
  run(messages: Message[]): AsyncGenerator<QueryEngineEvent>;
}

/**
 * Create the appropriate LLM provider based on environment configuration.
 */
export function createLLMProvider(overrides?: {
  provider?: ModelProvider;
  model?: string;
  apiKey?: string;
}): LLMProvider {
  const config = getProviderConfig();

  // Apply overrides
  const provider = overrides?.provider || config.provider;
  const model = overrides?.model || config.model;
  const apiKey = overrides?.apiKey || config.apiKey;

  const error = validateProviderConfig({ ...config, apiKey });
  if (error) {
    return createErrorProvider(error);
  }

  switch (provider) {
    case "anthropic":
      return createAnthropicProvider({ apiKey, model });

    case "openai":
      return createOpenAIProvider({ apiKey, model, baseURL: config.baseURL });

    case "bedrock":
      return createStubProvider("bedrock");

    case "vertex":
      return createStubProvider("vertex");

    default:
      return createErrorProvider(`Unknown provider: ${provider}`);
  }
}

/**
 * Stub provider for not-yet-implemented providers (Bedrock, Vertex).
 */
function createStubProvider(name: string): LLMProvider {
  return {
    async *run(): AsyncGenerator<QueryEngineEvent> {
      yield {
        event: "error",
        data: JSON.stringify({
          error: `Provider "${name}" is not yet implemented. Use "anthropic" or "openai".`,
        }),
      };
    },
  };
}

/**
 * Error provider that immediately yields an error event.
 */
function createErrorProvider(message: string): LLMProvider {
  return {
    async *run(): AsyncGenerator<QueryEngineEvent> {
      yield {
        event: "error",
        data: JSON.stringify({ error: message }),
      };
    },
  };
}
