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
 * Tool use within a message.
 */
export interface ToolUse {
  id: string;
  name: string;
  input: Record<string, unknown>;
  status: "pending" | "confirmed" | "running" | "completed" | "failed";
  output?: string;
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
 * SSE event structure for streaming responses.
 */
export interface SSEEvent {
  event?: string;
  data: string;
  id?: string;
  retry?: number;
}

/**
 * Usage information for token tracking.
 */
export interface UsageInfo {
  inputTokens: number;
  outputTokens: number;
  cost: number;
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

/**
 * Chat response event types for client-side parsing.
 */
export type ChatResponseEvent =
  | { type: "text"; content: string }
  | { type: "thinking"; content: string }
  | { type: "tool_use"; toolUse: { id: string; name: string; input: Record<string, unknown> } }
  | { type: "tool_result"; toolUse: { id: string; name: string }; content: string }
  | { type: "usage"; usage: UsageInfo }
  | { type: "done" }
  | { type: "error"; content: string };

/**
 * Chat message type used by client hooks (simplified flat structure).
 */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

/**
 * Chat conversation type used by client hooks.
 */
export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  model?: string;
}

/**
 * Query engine event type for internal streaming.
 */
export interface QueryEngineEvent {
  event: string;
  data: string;
}
