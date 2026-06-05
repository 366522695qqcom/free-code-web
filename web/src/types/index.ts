/**
 * Model provider types supported by the application.
 */
export type ModelProvider = "anthropic" | "openai" | "bedrock" | "vertex";

/**
 * Authentication configuration.
 */
export interface AuthConfig {
  username: string;
  password: string;
  secret: string;
}

/**
 * Application configuration derived from environment variables.
 */
export interface AppConfig {
  anthropicApiKey: string;
  auth: AuthConfig;
  modelProvider: ModelProvider;
  openaiApiKey?: string;
  awsRegion?: string;
  googleCloudProject?: string;
  featureFlags: string[];
}

/**
 * Chat message types.
 */
export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

/**
 * API request/response types.
 */
export interface ChatRequestBody {
  message: string;
  conversationId?: string;
  model?: string;
}

export interface ChatResponseEvent {
  type: "text" | "tool_use" | "tool_result" | "error" | "done";
  content: string;
  toolUse?: {
    id: string;
    name: string;
    input: Record<string, unknown>;
  };
}

/**
 * Login request/response types.
 */
export interface LoginRequestBody {
  username: string;
  password: string;
}

export interface LoginResponseBody {
  success: boolean;
  error?: string;
}
