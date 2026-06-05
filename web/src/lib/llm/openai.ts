import OpenAI from "openai";
import type { Message, ContentBlock, QueryEngineEvent } from "@/types";

interface OpenAIProviderOptions {
  apiKey: string;
  model?: string;
  baseURL?: string;
  systemPrompt?: string;
}

function messageToOpenAI(message: Message): OpenAI.ChatCompletionMessageParam {
  const textParts = message.content
    .filter((b): b is Extract<ContentBlock, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  if (message.role === "user") {
    return { role: "user", content: textParts };
  }

  return { role: "assistant", content: textParts };
}

export function createOpenAIProvider(options: OpenAIProviderOptions) {
  const model = options.model || "gpt-4o";
  const client = new OpenAI({
    apiKey: options.apiKey,
    baseURL: options.baseURL,
  });

  return {
    async *run(messages: Message[]): AsyncGenerator<QueryEngineEvent> {
      const openaiMessages: OpenAI.ChatCompletionMessageParam[] = [];

      if (options.systemPrompt) {
        openaiMessages.push({ role: "system", content: options.systemPrompt });
      }

      openaiMessages.push(...messages.map(messageToOpenAI));

      yield { event: "message_start", data: JSON.stringify({ model }) };

      try {
        const stream = await client.chat.completions.create({
          model,
          messages: openaiMessages,
          stream: true,
        });

        let totalContent = "";
        let totalInputTokens = 0;
        let totalOutputTokens = 0;

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta;
          if (delta?.content) {
            totalContent += delta.content;
            yield {
              event: "content_block",
              data: JSON.stringify({ type: "text", text: delta.content }),
            };
          }

          // OpenAI streaming doesn't provide per-chunk token counts,
          // but we can estimate from usage if available
          if (chunk.usage) {
            totalInputTokens = chunk.usage.prompt_tokens;
            totalOutputTokens = chunk.usage.completion_tokens;
          }
        }

        // Estimate tokens if not provided in stream
        if (totalInputTokens === 0) {
          totalInputTokens = Math.ceil(
            openaiMessages.reduce((sum, m) => sum + (typeof m.content === "string" ? m.content.length : 0), 0) / 4
          );
        }
        if (totalOutputTokens === 0) {
          totalOutputTokens = Math.ceil(totalContent.length / 4);
        }

        const cost = calculateOpenAICost(model, totalInputTokens, totalOutputTokens);
        yield {
          event: "cost",
          data: JSON.stringify({ inputTokens: totalInputTokens, outputTokens: totalOutputTokens, cost }),
        };

        yield {
          event: "message_end",
          data: JSON.stringify({
            stopReason: "end_turn",
            content: [{ type: "text", text: totalContent }],
          }),
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        yield { event: "error", data: JSON.stringify({ error: message }) };
      }
    },
  };
}

function calculateOpenAICost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing: Record<string, { input: number; output: number }> = {
    "gpt-4o": { input: 2.5, output: 10 },
    "gpt-4o-mini": { input: 0.15, output: 0.6 },
    "gpt-4-turbo": { input: 10, output: 30 },
    "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
  };
  const modelPricing = pricing[model] || pricing["gpt-4o"]!;
  return (
    (inputTokens / 1_000_000) * modelPricing.input +
    (outputTokens / 1_000_000) * modelPricing.output
  );
}
