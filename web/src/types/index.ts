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
 * Content block types for rich message content.
 */
export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "thinking"; text: string; signature?: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean };

/**
 * Chat message with structured content blocks.
 */
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: ContentBlock[];
  model?: string;
  timestamp: string;
}

/**
 * Chat API request body.
 */
export interface ChatRequest {
  messages: Message[];
  model?: string;
  sessionId?: string;
}

/**
 * SSE event structure.
 */
export interface SSEEvent {
  event?: string;
  data: string;
}

/**
 * Session stored in memory.
 */
export interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  model: string;
  tokenUsage: { inputTokens: number; outputTokens: number; cost: number };
}

/**
 * Login request body.
 */
export interface LoginRequestBody {
  username: string;
  password: string;
}

/**
 * Login response body.
 */
export interface LoginResponseBody {
  success: boolean;
  error?: string;
}
