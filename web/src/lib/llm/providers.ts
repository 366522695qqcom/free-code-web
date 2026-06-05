import type { ModelProvider } from "@/types";

export interface ProviderConfig {
  provider: ModelProvider;
  apiKey: string;
  model: string;
  /** Optional base URL override (for OpenAI-compatible APIs) */
  baseURL?: string;
  /** AWS region (for Bedrock) */
  awsRegion?: string;
  /** Google Cloud project (for Vertex) */
  googleCloudProject?: string;
}

/**
 * Get the active provider configuration from environment variables.
 */
export function getProviderConfig(): ProviderConfig {
  const provider = (process.env.MODEL_PROVIDER || "anthropic") as ModelProvider;

  const config: ProviderConfig = {
    provider,
    apiKey: "",
    model: process.env.MODEL || "claude-sonnet-4-20250514",
  };

  switch (provider) {
    case "anthropic":
      config.apiKey = process.env.ANTHROPIC_API_KEY || "";
      break;
    case "openai":
      config.apiKey = process.env.OPENAI_API_KEY || "";
      config.baseURL = process.env.OPENAI_BASE_URL;
      config.model = process.env.MODEL || "gpt-4o";
      break;
    case "bedrock":
      config.awsRegion = process.env.AWS_REGION || "us-east-1";
      config.model = process.env.MODEL || "anthropic.claude-sonnet-4-20250514-v1:0";
      break;
    case "vertex":
      config.googleCloudProject = process.env.GOOGLE_CLOUD_PROJECT || "";
      config.model = process.env.MODEL || "claude-sonnet-4@20250514";
      break;
  }

  return config;
}

/**
 * Validate that the provider has the required configuration.
 */
export function validateProviderConfig(config: ProviderConfig): string | null {
  if (!config.apiKey && config.provider !== "bedrock" && config.provider !== "vertex") {
    return `API key not configured for provider: ${config.provider}`;
  }
  return null;
}
