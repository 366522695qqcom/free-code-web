// Constants from CC's autoCompact.ts
const AUTOCOMPACT_BUFFER_TOKENS = 13_000;
const WARNING_THRESHOLD_BUFFER_TOKENS = 20_000;
const ERROR_THRESHOLD_BUFFER_TOKENS = 20_000;
const MANUAL_COMPACT_BUFFER_TOKENS = 3_000;
const MAX_OUTPUT_TOKENS_FOR_SUMMARY = 20_000;

// Model context window sizes
const MODEL_CONTEXT_WINDOW: Record<string, number> = {
  "claude-sonnet-4-20250514": 200000,
  "claude-opus-4-20250514": 200000,
  "claude-haiku-3.5-20241022": 200000,
  "gpt-4o": 128000,
  "gpt-4o-mini": 128000,
  "o3-mini": 200000,
};

const DEFAULT_CONTEXT_WINDOW = 200000;

// Max output tokens per model (for effective context window calculation)
const MODEL_MAX_OUTPUT_TOKENS: Record<string, number> = {
  "claude-sonnet-4-20250514": 32000,
  "claude-opus-4-20250514": 32000,
  "claude-haiku-3.5-20241022": 8192,
  "gpt-4o": 16384,
  "gpt-4o-mini": 16384,
  "o3-mini": 100000,
};

const DEFAULT_MAX_OUTPUT_TOKENS = 32000;

export function getContextWindowSize(model: string): number {
  return MODEL_CONTEXT_WINDOW[model] ?? DEFAULT_CONTEXT_WINDOW;
}

export function getMaxOutputTokens(model: string): number {
  return MODEL_MAX_OUTPUT_TOKENS[model] ?? DEFAULT_MAX_OUTPUT_TOKENS;
}

// Returns context window size minus max output tokens (reserved for output)
// Reference: CC's getEffectiveContextWindowSize
export function getEffectiveContextWindowSize(model: string): number {
  const reservedTokensForSummary = Math.min(
    getMaxOutputTokens(model),
    MAX_OUTPUT_TOKENS_FOR_SUMMARY,
  );
  return getContextWindowSize(model) - reservedTokensForSummary;
}

// Returns the token count at which auto-compact should trigger
// Reference: CC's getAutoCompactThreshold
export function getAutoCompactThreshold(model: string): number {
  const effectiveContextWindow = getEffectiveContextWindowSize(model);
  return effectiveContextWindow - AUTOCOMPACT_BUFFER_TOKENS;
}

export interface TokenWarningState {
  percentLeft: number;
  isAboveWarningThreshold: boolean;
  isAboveErrorThreshold: boolean;
  isAboveAutoCompactThreshold: boolean;
  isAtBlockingLimit: boolean;
}

// Reference: CC's calculateTokenWarningState
export function calculateTokenWarningState(
  tokenUsage: number,
  model: string,
  autoCompactEnabled: boolean = true,
): TokenWarningState {
  const autoCompactThreshold = getAutoCompactThreshold(model);
  const threshold = autoCompactEnabled
    ? autoCompactThreshold
    : getEffectiveContextWindowSize(model);

  const percentLeft = Math.max(
    0,
    Math.round(((threshold - tokenUsage) / threshold) * 100),
  );

  const warningThreshold = threshold - WARNING_THRESHOLD_BUFFER_TOKENS;
  const errorThreshold = threshold - ERROR_THRESHOLD_BUFFER_TOKENS;

  const isAboveWarningThreshold = tokenUsage >= warningThreshold;
  const isAboveErrorThreshold = tokenUsage >= errorThreshold;

  const isAboveAutoCompactThreshold =
    autoCompactEnabled && tokenUsage >= autoCompactThreshold;

  const actualContextWindow = getEffectiveContextWindowSize(model);
  const defaultBlockingLimit =
    actualContextWindow - MANUAL_COMPACT_BUFFER_TOKENS;
  const isAtBlockingLimit = tokenUsage >= defaultBlockingLimit;

  return {
    percentLeft,
    isAboveWarningThreshold,
    isAboveErrorThreshold,
    isAboveAutoCompactThreshold,
    isAtBlockingLimit,
  };
}

// Calculate context usage percentage (only input tokens, not output)
// Reference: CC's calculateContextPercentages
export function calculateContextPercentages(
  inputTokens: number,
  cacheCreationInputTokens: number,
  cacheReadInputTokens: number,
  model: string,
): { used: number; remaining: number } {
  const totalInputTokens = inputTokens + cacheCreationInputTokens + cacheReadInputTokens;
  const contextWindowSize = getContextWindowSize(model);
  const usedPercentage = Math.round((totalInputTokens / contextWindowSize) * 100);
  const clampedUsed = Math.min(100, Math.max(0, usedPercentage));
  return {
    used: clampedUsed,
    remaining: 100 - clampedUsed,
  };
}
