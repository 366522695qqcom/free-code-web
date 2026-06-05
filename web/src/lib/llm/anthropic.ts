/**
 * Anthropic API client with streaming support.
 *
 * Uses @anthropic-ai/sdk for the messages API.
 * Supports thinking (extended thinking) for capable models.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { Message, ContentBlock } from "@/types";
import { resolveModel } from "./providers";

const DEFAULT_MAX_TOKENS = 16384;
const THINKING_BUDGET = 10000;

interface AnthropicStreamOptions {
  model?: string;
  systemPrompt?: string;
  maxTokens?: number;
  apiKey?: string;
}

interface StreamEvent {
  type: "thinking" | "text" | "tool_use" | "tool_result" | "usage" | "done" | "error";
  data: unknown;
}

function contentBlockToAnthropic(block: ContentBlock): Anthropic.ContentBlockParam {
  switch (block.type) {
    case "text":
      return { type: "text", text: block.text };
    case "thinking":
      return { type: "thinking", thinking: block.text, signature: block.signature || "" };
    case "tool_use":
      return { type: "tool_use", id: block.id, name: block.name, input: block.input };
    case "tool_result":
      return {
        type: "tool_result",
        tool_use_id: block.tool_use_id,
        content: block.content,
        is_error: block.is_error,
      };
  }
}

function messageToAnthropic(message: Message): Anthropic.MessageParam {
  const content = message.content.map(contentBlockToAnthropic);

  // tool_result blocks must be in user messages
  const hasToolResult = message.content.some((b) => b.type === "tool_result");

  if (hasToolResult && message.role === "assistant") {
    return {
      role: "user",
      content: content as Anthropic.ContentBlockParam[],
    };
  }

  return {
    role: message.role,
    content: content as Anthropic.ContentBlockParam[],
  };
}

/**
 * Create a streaming Anthropic chat completion.
 *
 * Yields SSE-like events as they arrive from the API.
 * Handles the agentic loop: if the model returns tool_use,
 * yields tool_use events and waits for tool results to be injected.
 */
export async function* streamAnthropic(
  messages: Message[],
  options: AnthropicStreamOptions = {}
): AsyncGenerator<StreamEvent> {
  const apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY || "";
  const model = resolveModel(options.model, "anthropic");
  const maxTokens = options.maxTokens || DEFAULT_MAX_TOKENS;
  const client = new Anthropic({ apiKey });

  const anthropicMessages: Anthropic.MessageParam[] = messages.map(
    messageToAnthropic
  );

  const requestParams: Anthropic.MessageCreateParamsStreaming = {
    model,
    max_tokens: maxTokens,
    messages: anthropicMessages,
    stream: true,
  };

  if (options.systemPrompt) {
    requestParams.system = options.systemPrompt;
  }

  // Enable thinking for models that support it
  const supportsThinking =
    model.includes("claude-sonnet-4") || model.includes("claude-opus-4");
  if (supportsThinking) {
    requestParams.thinking = {
      type: "enabled",
      budget_tokens: THINKING_BUDGET,
    };
  }

  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  try {
    const stream = client.messages.stream(requestParams);

    let currentText = "";
    let currentThinking = "";
    let currentToolUse: {
      id: string;
      name: string;
      input: string;
    } | null = null;

    for await (const event of stream) {
      if (event.type === "message_start") {
        const usage = event.message.usage;
        totalInputTokens += usage.input_tokens;
      }

      if (event.type === "content_block_start") {
        if (event.content_block.type === "text") {
          currentText = "";
        } else if (event.content_block.type === "thinking") {
          currentThinking = "";
        } else if (event.content_block.type === "tool_use") {
          currentToolUse = {
            id: event.content_block.id,
            name: event.content_block.name,
            input: "",
          };
        }
      }

      if (event.type === "content_block_delta") {
        if (event.delta.type === "text_delta") {
          currentText += event.delta.text;
          yield {
            type: "text",
            data: { text: event.delta.text },
          };
        } else if (event.delta.type === "thinking_delta") {
          currentThinking += event.delta.thinking;
          yield {
            type: "thinking",
            data: { text: event.delta.thinking },
          };
        } else if (event.delta.type === "input_json_delta") {
          if (currentToolUse) {
            currentToolUse.input += event.delta.partial_json;
          }
        }
      }

      if (event.type === "content_block_stop") {
        if (currentText) {
          currentText = "";
        }
        if (currentThinking) {
          currentThinking = "";
        }
        if (currentToolUse) {
          let parsedInput: Record<string, unknown> = {};
          try {
            parsedInput = JSON.parse(currentToolUse.input || "{}");
          } catch {
            parsedInput = {};
          }
          yield {
            type: "tool_use",
            data: {
              id: currentToolUse.id,
              name: currentToolUse.name,
              input: parsedInput,
            },
          };
          currentToolUse = null;
        }
      }

      if (event.type === "message_delta") {
        totalOutputTokens += event.usage.output_tokens;
      }
    }

    const finalMessage = await stream.finalMessage();

    // If model wants to use tools, yield tool_result placeholders
    if (finalMessage.stop_reason === "tool_use") {
      for (const block of finalMessage.content) {
        if (block.type === "tool_use") {
          yield {
            type: "tool_result",
            data: {
              tool_use_id: block.id,
              content: `Tool "${block.name}" execution not yet implemented`,
              is_error: false,
            },
          };
        }
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    yield {
      type: "error",
      data: { error: message },
    };
  }

  // Emit usage event
  const cost = calculateCost(model, totalInputTokens, totalOutputTokens);
  yield {
    type: "usage",
    data: {
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      cost,
    },
  };

  yield { type: "done", data: null };
}

function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  // Pricing per million tokens (approximate)
  const pricing: Record<string, { input: number; output: number }> = {
    "claude-sonnet-4-20250514": { input: 3, output: 15 },
    "claude-opus-4-20250514": { input: 15, output: 75 },
    "claude-haiku-4-20250414": { input: 1, output: 5 },
  };

  const modelPricing = pricing[model] || pricing["claude-sonnet-4-20250514"]!;
  return (
    (inputTokens / 1_000_000) * modelPricing.input +
    (outputTokens / 1_000_000) * modelPricing.output
  );
}
