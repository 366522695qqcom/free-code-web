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
 * Chat message with structured content blocks (API format).
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
  status: "pending" | "running" | "completed" | "error";
  output?: string;
  error?: string;
}

/**
 * Token usage and cost tracking.
 */
export interface Usage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
  cost: number;
}

/**
 * Session stored in memory (server-side / API format).
 */
export interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  model: string;
  tokenUsage: Usage;
}

/**
 * SSE event structure for LLM streaming.
 */
export interface SSEEvent {
  type: "thinking" | "text" | "tool_use" | "tool_result" | "tool_confirmation_needed" | "usage" | "done" | "error";
  data: unknown;
}

/**
 * Chat API request body.
 */
export interface ChatRequest {
  messages: Message[];
  model?: string;
  sessionId?: string;
  permissionMode?: "default" | "plan" | "acceptEdits" | "bypassPermissions";
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
 * Query engine event (server-side internal streaming).
 */
export interface QueryEngineEvent {
  event: string;
  data: string;
}

/**
 * Chat response SSE event types (client-side).
 */
export type ChatResponseEvent =
  | { type: "text"; content: string }
  | { type: "thinking"; content: string }
  | { type: "tool_use"; toolUse: { id: string; name: string; input: Record<string, unknown> } }
  | { type: "tool_result"; toolUse: { id: string }; content: string; isError?: boolean }
  | { type: "tool_confirmation_needed"; tool_use_id: string; name: string; input: Record<string, unknown>; riskLevel: RiskLevel; sandboxEnabled: boolean; reason?: string }
  | { type: "usage"; usage: Usage }
  | { type: "error"; content: string }
  | { type: "done" };

/**
 * Risk level for tool execution permission.
 */
export type RiskLevel = "low" | "high" | "outside-sandbox";

/**
 * Tool confirmation request from the server.
 */
export interface ToolConfirmation {
  toolCallId: string;
  toolName: string;
  toolInput: Record<string, unknown>;
  riskLevel: RiskLevel;
  sandboxEnabled: boolean;
  reason: string;
}

/**
 * Chat message type used by client hooks (simplified flat content).
 */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  thinking?: string;
  toolUses?: ToolUse[];
}

/**
 * Chat conversation type used by client hooks.
 * Maps to the Session type from the API but with numeric timestamps.
 */
export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  model: string;
  tokenUsage: Usage;
}

/**
 * Available model options.
 */
export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  capabilities?: string[] | Record<string, boolean>;
}
