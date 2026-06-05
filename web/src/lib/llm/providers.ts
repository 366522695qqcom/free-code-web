/**
 * LLM provider configuration and selection logic.
 *
 * Reads MODEL_PROVIDER from environment to select the active provider.
 * Each provider has: apiClient function, model mapping, auth method.
 */

import type { ModelProvider } from "@/types";

export interface ProviderConfig {
  name: ModelProvider;
  /** Map short model names to provider-specific model IDs */
  modelMap: Record<string, string>;
  /** Default model ID for this provider */
  defaultModel: string;
  /** Check if this provider is properly configured (API key set) */
  isConfigured: () => boolean;
}

const ANTHROPIC_PROVIDER: ProviderConfig = {
  name: "anthropic",
  modelMap: {
    "claude-sonnet-4-6": "claude-sonnet-4-20250514",
    "claude-opus-4-6": "claude-opus-4-20250514",
    "claude-haiku-4-5": "claude-haiku-4-20250414",
  },
  defaultModel: "claude-sonnet-4-20250514",
  isConfigured: () => !!process.env.ANTHROPIC_API_KEY,
};

const OPENAI_PROVIDER: ProviderConfig = {
  name: "openai",
  modelMap: {
    "gpt-4o": "gpt-4o",
    "gpt-4o-mini": "gpt-4o-mini",
    "o1": "o1",
    "o3-mini": "o3-mini",
  },
  defaultModel: "gpt-4o",
  isConfigured: () => !!process.env.OPENAI_API_KEY,
};

const BEDROCK_PROVIDER: ProviderConfig = {
  name: "bedrock",
  modelMap: {
    "claude-sonnet-4-6": "anthropic.claude-sonnet-4-20250514-v1:0",
    "claude-opus-4-6": "anthropic.claude-opus-4-20250514-v1:0",
    "claude-haiku-4-5": "anthropic.claude-haiku-4-20250414-v1:0",
  },
  defaultModel: "anthropic.claude-sonnet-4-20250514-v1:0",
  isConfigured: () => !!(process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID),
};

const VERTEX_PROVIDER: ProviderConfig = {
  name: "vertex",
  modelMap: {
    "claude-sonnet-4-6": "claude-sonnet-4@20250514",
    "claude-opus-4-6": "claude-opus-4@20250514",
    "claude-haiku-4-5": "claude-haiku-4@20250414",
  },
  defaultModel: "claude-sonnet-4@20250514",
  isConfigured: () => !!(process.env.GOOGLE_CLOUD_PROJECT && process.env.GOOGLE_CLOUD_REGION),
};

const PROVIDERS: Record<ModelProvider, ProviderConfig> = {
  anthropic: ANTHROPIC_PROVIDER,
  openai: OPENAI_PROVIDER,
  bedrock: BEDROCK_PROVIDER,
  vertex: VERTEX_PROVIDER,
};

/**
 * Get the active provider based on MODEL_PROVIDER env var.
 * Defaults to "anthropic".
 */
export function getActiveProvider(): ModelProvider {
  const provider = process.env.MODEL_PROVIDER as ModelProvider | undefined;
  if (provider && provider in PROVIDERS) {
    return provider;
  }
  return "anthropic";
}

/**
 * Get the provider configuration for the active provider.
 */
export function getProviderConfig(provider?: ModelProvider): ProviderConfig {
  const name = provider || getActiveProvider();
  return PROVIDERS[name];
}

/**
 * Resolve a short model name to the provider-specific model ID.
 * If the model name is not in the map, returns it as-is (might already be a full ID).
 */
export function resolveModel(model: string | undefined, provider?: ModelProvider): string {
  const config = getProviderConfig(provider);
  if (!model) return config.defaultModel;
  return config.modelMap[model] || model;
}

/**
 * List all available providers and their configuration status.
 */
export function listProviders(): Array<ProviderConfig & { configured: boolean }> {
  return Object.values(PROVIDERS).map((p) => ({
    ...p,
    configured: p.isConfigured(),
  }));
}
