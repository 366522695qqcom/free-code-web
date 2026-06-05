/**
 * Main LLM interface — unified entry point for all providers.
 *
 * Provides `createChatStream()` which returns a ReadableStream of SSE events,
 * dispatching to the correct provider based on MODEL_PROVIDER env var.
 */

import type { Message } from "@/types";
import { getActiveProvider } from "./providers";
import { streamAnthropic } from "./anthropic";
import { streamOpenAI } from "./openai";

export interface ChatStreamOptions {
  model?: string;
  systemPrompt?: string;
  maxTokens?: number;
  /** Override the provider (ignores MODEL_PROVIDER env var) */
  provider?: string;
  /** Override API key (ignores env var) */
  apiKey?: string;
  /** Custom base URL for OpenAI-compatible providers */
  baseUrl?: string;
}

/**
 * Create a streaming chat completion as a ReadableStream of SSE events.
 *
 * SSE event types:
 * - "thinking" — extended thinking content (Anthropic only)
 * - "text" — text content delta
 * - "tool_use" — tool call from the model
 * - "tool_result" — tool execution result placeholder
 * - "usage" — token usage and cost
 * - "done" — stream complete
 * - "error" — error occurred
 */
export function createChatStream(
  messages: Message[],
  options: ChatStreamOptions = {}
): ReadableStream<Uint8Array> {
  const provider = (options.provider as ReturnType<typeof getActiveProvider>) || getActiveProvider();
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const generator = getGenerator(provider, messages, options);

        for await (const event of generator) {
          const line = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
          controller.enqueue(encoder.encode(line));
        }

        controller.close();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        controller.enqueue(
          encoder.encode(
            `event: error\ndata: ${JSON.stringify({ error: message })}\n\n`
          )
        );
        controller.close();
      }
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StreamGenerator = AsyncGenerator<{ type: string; data: any }>;

function getGenerator(
  provider: string,
  messages: Message[],
  options: ChatStreamOptions
): StreamGenerator {
  // If baseUrl is set, always use OpenAI-compatible streaming
  if (options.baseUrl) {
    return streamOpenAI(messages, {
      model: options.model,
      systemPrompt: options.systemPrompt,
      maxTokens: options.maxTokens,
      apiKey: options.apiKey,
      baseUrl: options.baseUrl,
    });
  }

  switch (provider) {
    case "anthropic":
      return streamAnthropic(messages, {
        model: options.model,
        systemPrompt: options.systemPrompt,
        maxTokens: options.maxTokens,
        apiKey: options.apiKey,
      });
    case "openai":
      return streamOpenAI(messages, {
        model: options.model,
        systemPrompt: options.systemPrompt,
        maxTokens: options.maxTokens,
        apiKey: options.apiKey,
      });
    case "bedrock":
    case "vertex":
      // Not yet implemented — fall through to error
      break;
  }

  // Return a generator that yields an error
  return (async function* () {
    yield {
      type: "error",
      data: {
        error: `Provider "${provider}" is not yet implemented. Supported: anthropic, openai.`,
      },
    };
    yield { type: "done", data: null };
  })();
}

/**
 * Re-export provider utilities for convenience.
 */
export { getActiveProvider, resolveModel, getProviderConfig, listProviders } from "./providers";
