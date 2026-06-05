/**
 * OpenAI API client with streaming support.
 *
 * Optional provider — reads OPENAI_API_KEY from env.
 * Uses the OpenAI chat completions API via fetch.
 */

import type { Message, ContentBlock } from "@/types";
import { resolveModel } from "./providers";

interface OpenAIStreamOptions {
  model?: string;
  systemPrompt?: string;
  maxTokens?: number;
  apiKey?: string;
}

interface StreamEvent {
  type: "thinking" | "text" | "tool_use" | "tool_result" | "usage" | "done" | "error";
  data: unknown;
}

interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

function contentBlockToText(block: ContentBlock): string {
  switch (block.type) {
    case "text":
      return block.text;
    case "thinking":
      return `[Thinking]\n${block.text}\n[/Thinking]`;
    case "tool_use":
      return `[Tool Use: ${block.name}]\n${JSON.stringify(block.input, null, 2)}`;
    case "tool_result":
      return `[Tool Result for ${block.tool_use_id}]\n${block.content}`;
  }
}

function messageToOpenAI(message: Message): OpenAIMessage {
  const text = message.content.map(contentBlockToText).join("\n");
  return {
    role: message.role === "assistant" ? "assistant" : "user",
    content: text,
  };
}

/**
 * Create a streaming OpenAI chat completion.
 *
 * Yields SSE-like events as they arrive from the API.
 * Note: OpenAI does not support thinking/extended thinking natively,
 * so thinking events will not be emitted.
 */
export async function* streamOpenAI(
  messages: Message[],
  options: OpenAIStreamOptions = {}
): AsyncGenerator<StreamEvent> {
  const apiKey = options.apiKey || process.env.OPENAI_API_KEY || "";
  const model = resolveModel(options.model, "openai");

  if (!apiKey) {
    yield {
      type: "error",
      data: { error: "OPENAI_API_KEY is not configured" },
    };
    yield { type: "done", data: null };
    return;
  }

  const openaiMessages: OpenAIMessage[] = messages.map(messageToOpenAI);

  if (options.systemPrompt) {
    openaiMessages.unshift({
      role: "system",
      content: options.systemPrompt,
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: openaiMessages,
        max_tokens: options.maxTokens || 16384,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      yield {
        type: "error",
        data: {
          error: `OpenAI API error: ${response.status} ${errorBody}`,
        },
      };
      yield { type: "done", data: null };
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      yield {
        type: "error",
        data: { error: "Response body is not readable" },
      };
      yield { type: "done", data: null };
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (!trimmed.startsWith("data: ")) continue;

        const jsonStr = trimmed.slice(6);
        try {
          const chunk = JSON.parse(jsonStr) as {
            choices?: Array<{
              delta?: { content?: string };
              finish_reason?: string | null;
            }>;
            usage?: { prompt_tokens?: number; completion_tokens?: number };
          };

          // Extract usage if present (usually in the last chunk)
          if (chunk.usage) {
            totalInputTokens = chunk.usage.prompt_tokens || 0;
            totalOutputTokens = chunk.usage.completion_tokens || 0;
          }

          const content = chunk.choices?.[0]?.delta?.content;
          if (content) {
            yield {
              type: "text",
              data: { text: content },
            };
          }
        } catch {
          // Skip malformed JSON chunks
        }
      }
    }

    // Emit usage
    const cost = calculateOpenAICost(model, totalInputTokens, totalOutputTokens);
    yield {
      type: "usage",
      data: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        cost,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    yield {
      type: "error",
      data: { error: message },
    };
  }

  yield { type: "done", data: null };
}

function calculateOpenAICost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  // Pricing per million tokens (approximate)
  const pricing: Record<string, { input: number; output: number }> = {
    "gpt-4o": { input: 2.5, output: 10 },
    "gpt-4o-mini": { input: 0.15, output: 0.6 },
    "o1": { input: 15, output: 60 },
    "o3-mini": { input: 1.1, output: 4.4 },
  };

  const modelPricing = pricing[model] || pricing["gpt-4o"]!;
  return (
    (inputTokens / 1_000_000) * modelPricing.input +
    (outputTokens / 1_000_000) * modelPricing.output
  );
}
