import Anthropic from "@anthropic-ai/sdk";
import type { Message, ContentBlock, QueryEngineEvent } from "@/types";

const DEFAULT_MAX_TURNS = 50;

interface AnthropicProviderOptions {
  apiKey: string;
  model?: string;
  maxTurns?: number;
  systemPrompt?: string;
  tools?: Anthropic.Tool[];
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
  const hasToolResult = message.content.some((b) => b.type === "tool_result");

  if (hasToolResult && message.role === "assistant") {
    return { role: "user", content: content as Anthropic.ContentBlockParam[] };
  }

  return { role: message.role, content: content as Anthropic.ContentBlockParam[] };
}

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing: Record<string, { input: number; output: number }> = {
    "claude-sonnet-4-20250514": { input: 3, output: 15 },
    "claude-opus-4-20250514": { input: 15, output: 75 },
    "claude-haiku-3.5-20241022": { input: 0.8, output: 4 },
  };
  const modelPricing = pricing[model] || pricing["claude-sonnet-4-20250514"]!;
  return (
    (inputTokens / 1_000_000) * modelPricing.input +
    (outputTokens / 1_000_000) * modelPricing.output
  );
}

export function createAnthropicProvider(options: AnthropicProviderOptions) {
  const model = options.model || "claude-sonnet-4-20250514";
  const maxTurns = options.maxTurns || DEFAULT_MAX_TURNS;
  const client = new Anthropic({ apiKey: options.apiKey });

  return {
    async *run(messages: Message[]): AsyncGenerator<QueryEngineEvent> {
      const anthropicMessages: Anthropic.MessageParam[] = messages.map(messageToAnthropic);

      const requestParams: Anthropic.MessageCreateParamsStreaming = {
        model,
        max_tokens: 16384,
        messages: anthropicMessages,
        stream: true,
      };

      if (options.systemPrompt) {
        requestParams.system = options.systemPrompt;
      }

      if (options.tools && options.tools.length > 0) {
        requestParams.tools = options.tools;
      }

      const supportsThinking = model.includes("claude-sonnet-4") || model.includes("claude-opus-4");
      if (supportsThinking) {
        requestParams.thinking = { type: "enabled", budget_tokens: 10000 };
      }

      let turnCount = 0;
      let currentContent: ContentBlock[] = [];
      let totalInputTokens = 0;
      let totalOutputTokens = 0;

      yield { event: "message_start", data: JSON.stringify({ model }) };

      while (turnCount < maxTurns) {
        turnCount++;

        try {
          const stream = client.messages.stream(requestParams);
          let currentText = "";
          let currentThinking = "";
          let currentToolUse: { id: string; name: string; input: string } | null = null;

          for await (const event of stream) {
            if (event.type === "message_start") {
              totalInputTokens += event.message.usage.input_tokens;
            }

            if (event.type === "content_block_start") {
              if (event.content_block.type === "text") {
                currentText = "";
              } else if (event.content_block.type === "thinking") {
                currentThinking = "";
              } else if (event.content_block.type === "tool_use") {
                currentToolUse = { id: event.content_block.id, name: event.content_block.name, input: "" };
              }
            }

            if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                currentText += event.delta.text;
                yield {
                  event: "content_block",
                  data: JSON.stringify({ type: "text", text: event.delta.text }),
                };
              } else if (event.delta.type === "thinking_delta") {
                currentThinking += event.delta.thinking;
                yield {
                  event: "content_block",
                  data: JSON.stringify({ type: "thinking", text: event.delta.thinking }),
                };
              } else if (event.delta.type === "input_json_delta") {
                if (currentToolUse) {
                  currentToolUse.input += event.delta.partial_json;
                }
              }
            }

            if (event.type === "content_block_stop") {
              if (currentText) {
                currentContent.push({ type: "text", text: currentText });
                currentText = "";
              }
              if (currentThinking) {
                currentContent.push({ type: "thinking", text: currentThinking });
                currentThinking = "";
              }
              if (currentToolUse) {
                let parsedInput: Record<string, unknown> = {};
                try {
                  parsedInput = JSON.parse(currentToolUse.input || "{}");
                } catch {
                  parsedInput = {};
                }
                currentContent.push({
                  type: "tool_use",
                  id: currentToolUse.id,
                  name: currentToolUse.name,
                  input: parsedInput,
                });
                yield {
                  event: "tool_use",
                  data: JSON.stringify({
                    id: currentToolUse.id,
                    name: currentToolUse.name,
                    input: parsedInput,
                  }),
                };
                currentToolUse = null;
              }
            }

            if (event.type === "message_delta") {
              totalOutputTokens += event.usage.output_tokens;
            }
          }

          const finalMessage = await stream.finalMessage();

          if (finalMessage.stop_reason === "end_turn" || finalMessage.stop_reason === "stop") {
            break;
          }

          if (finalMessage.stop_reason === "tool_use") {
            const assistantContent: Anthropic.ContentBlockParam[] = [];
            for (const block of currentContent) {
              if (block.type === "text") {
                assistantContent.push({ type: "text", text: block.text });
              } else if (block.type === "tool_use") {
                assistantContent.push({ type: "tool_use", id: block.id, name: block.name, input: block.input });
              }
            }

            requestParams.messages.push({ role: "assistant", content: assistantContent });

            const toolResultContent: Anthropic.ToolResultBlockParam[] = [];
            for (const block of currentContent) {
              if (block.type === "tool_use") {
                toolResultContent.push({
                  type: "tool_result",
                  tool_use_id: block.id,
                  content: `Tool "${block.name}" execution not yet implemented`,
                });
                yield {
                  event: "tool_result",
                  data: JSON.stringify({
                    tool_use_id: block.id,
                    content: `Tool "${block.name}" execution not yet implemented`,
                  }),
                };
              }
            }

            requestParams.messages.push({ role: "user", content: toolResultContent });
            currentContent = [];
          } else {
            break;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          yield { event: "error", data: JSON.stringify({ error: message }) };
          break;
        }
      }

      const cost = calculateCost(model, totalInputTokens, totalOutputTokens);
      yield {
        event: "cost",
        data: JSON.stringify({ inputTokens: totalInputTokens, outputTokens: totalOutputTokens, cost }),
      };

      yield {
        event: "message_end",
        data: JSON.stringify({ stopReason: "end_turn", content: currentContent }),
      };
    },
  };
}
