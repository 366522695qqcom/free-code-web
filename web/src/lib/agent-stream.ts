/**
 * Agentic stream — handles the full agentic loop with tool execution.
 *
 * The loop: user message → LLM → tool_use → execute → tool_result → LLM → ... → final text
 *
 * Supports Anthropic and OpenAI providers with streaming.
 */

import Anthropic from "@anthropic-ai/sdk";
import { v4 as uuidv4 } from "uuid";
import { getActiveProvider, resolveModel } from "@/lib/llm/providers";
import {
  getTool,
  getToolDefinitions,
  initializeTools,
  type ToolResult,
} from "@/lib/tools";
import {
  setPendingConfirmation,
  waitForConfirmation,
} from "@/lib/tools/confirmations";
import { assessToolExecution, executeToolWithSandbox } from "@/lib/sandbox/tool-adapter";
import type { ToolExecutionDecision } from "@/lib/sandbox/tool-adapter";
import type { Message, ContentBlock } from "@/types";

const DEFAULT_MAX_TOKENS = 16384;
const THINKING_BUDGET = 10000;
const MAX_ITERATIONS = 20;

interface AgenticStreamOptions {
  model?: string;
  systemPrompt?: string;
  maxTokens?: number;
  sessionId?: string;
  permissionMode?: "default" | "plan" | "acceptEdits" | "bypassPermissions";
}

type EmitFn = (event: string, data: unknown) => void;

// ─── Anthropic helpers ───────────────────────────────────────────────────────

function contentBlockToAnthropic(
  block: ContentBlock
): Anthropic.ContentBlockParam {
  switch (block.type) {
    case "text":
      return { type: "text", text: block.text };
    case "thinking":
      return {
        type: "thinking",
        thinking: block.text,
        signature: block.signature || "",
      };
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

function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
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

// ─── Anthropic agentic loop ──────────────────────────────────────────────────

async function runAnthropicLoop(
  messages: Message[],
  tools: ReturnType<typeof getToolDefinitions>,
  options: AgenticStreamOptions,
  emit: EmitFn
): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY || "";
  const model = resolveModel(options.model, "anthropic");
  const maxTokens = options.maxTokens || DEFAULT_MAX_TOKENS;
  const client = new Anthropic({ apiKey });

  const currentMessages: Message[] = [...messages];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCacheCreationInputTokens = 0;
  let totalCacheReadInputTokens = 0;

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const anthropicMessages = currentMessages.map(messageToAnthropic);

    const requestParams: Anthropic.MessageCreateParamsStreaming = {
      model,
      max_tokens: maxTokens,
      messages: anthropicMessages,
      stream: true,
    };

    if (options.systemPrompt) {
      requestParams.system = options.systemPrompt;
    }

    if (tools.length > 0) {
      requestParams.tools = tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.input_schema as Anthropic.Tool.InputSchema,
      }));
    }

    const supportsThinking =
      model.includes("claude-sonnet-4") || model.includes("claude-opus-4");
    if (supportsThinking) {
      requestParams.thinking = {
        type: "enabled",
        budget_tokens: THINKING_BUDGET,
      };
    }

    const stream = client.messages.stream(requestParams);

    let currentText = "";
    let currentThinking = "";
    let currentToolUse: { id: string; name: string; input: string } | null = null;
    const toolUseBlocks: { id: string; name: string; input: Record<string, unknown> }[] = [];
    const assistantContent: ContentBlock[] = [];
    let stopReason: string | null = null;

    for await (const event of stream) {
      if (event.type === "message_start") {
        totalInputTokens += event.message.usage.input_tokens;
        const usageObj = event.message.usage as unknown as Record<string, unknown>;
        totalCacheCreationInputTokens += (usageObj.cache_creation_input_tokens as number) || 0;
        totalCacheReadInputTokens += (usageObj.cache_read_input_tokens as number) || 0;
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
          emit("text", { text: event.delta.text });
        } else if (event.delta.type === "thinking_delta") {
          currentThinking += event.delta.thinking;
          emit("thinking", { text: event.delta.thinking });
        } else if (event.delta.type === "input_json_delta") {
          if (currentToolUse) {
            currentToolUse.input += event.delta.partial_json;
          }
        }
      }

      if (event.type === "content_block_stop") {
        if (currentText) {
          assistantContent.push({ type: "text", text: currentText });
          currentText = "";
        }
        if (currentThinking) {
          assistantContent.push({
            type: "thinking",
            text: currentThinking,
            signature: "",
          });
          currentThinking = "";
        }
        if (currentToolUse) {
          let parsedInput: Record<string, unknown> = {};
          try {
            parsedInput = JSON.parse(currentToolUse.input || "{}");
          } catch {
            parsedInput = {};
          }

          toolUseBlocks.push({
            id: currentToolUse.id,
            name: currentToolUse.name,
            input: parsedInput,
          });

          assistantContent.push({
            type: "tool_use",
            id: currentToolUse.id,
            name: currentToolUse.name,
            input: parsedInput,
          });

          currentToolUse = null;
        }
      }

      if (event.type === "message_delta") {
        totalOutputTokens += event.usage.output_tokens;
        stopReason = event.delta.stop_reason;
      }
    }

    // If no tool use, we're done
    if (stopReason !== "tool_use" || toolUseBlocks.length === 0) {
      break;
    }

    // Add assistant message to conversation
    currentMessages.push({
      id: uuidv4(),
      role: "assistant",
      content: assistantContent,
      timestamp: new Date().toISOString(),
    });

    // Execute tools and collect results
    const toolResultBlocks: ContentBlock[] = await executeTools(
      toolUseBlocks,
      emit,
      options.sessionId,
      options.permissionMode
    );

    // Add tool results as user message
    currentMessages.push({
      id: uuidv4(),
      role: "user",
      content: toolResultBlocks,
      timestamp: new Date().toISOString(),
    });
  }

  // Emit usage
  const cost = calculateCost(model, totalInputTokens, totalOutputTokens);
  emit("usage", {
    inputTokens: totalInputTokens,
    outputTokens: totalOutputTokens,
    cacheCreationInputTokens: totalCacheCreationInputTokens,
    cacheReadInputTokens: totalCacheReadInputTokens,
    cost,
  });
}

// ─── OpenAI agentic loop ─────────────────────────────────────────────────────

interface OpenAIToolCall {
  id: string;
  name: string;
  arguments: string;
}

interface OpenAIMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
}

function contentBlockToOpenAIText(block: ContentBlock): string {
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
  const text = message.content.map(contentBlockToOpenAIText).join("\n");
  return {
    role: message.role === "assistant" ? "assistant" : "user",
    content: text,
  };
}

function calculateOpenAICost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing: Record<string, { input: number; output: number }> = {
    "gpt-4o": { input: 2.5, output: 10 },
    "gpt-4o-mini": { input: 0.15, output: 0.6 },
    o1: { input: 15, output: 60 },
    "o3-mini": { input: 1.1, output: 4.4 },
  };
  const modelPricing = pricing[model] || pricing["gpt-4o"]!;
  return (
    (inputTokens / 1_000_000) * modelPricing.input +
    (outputTokens / 1_000_000) * modelPricing.output
  );
}

async function runOpenAILoop(
  messages: Message[],
  tools: ReturnType<typeof getToolDefinitions>,
  options: AgenticStreamOptions,
  emit: EmitFn
): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY || "";
  const model = resolveModel(options.model, "openai");

  if (!apiKey) {
    emit("error", { error: "OPENAI_API_KEY is not configured" });
    return;
  }

  const currentMessages: OpenAIMessage[] = messages.map(messageToOpenAI);

  if (options.systemPrompt) {
    currentMessages.unshift({ role: "system", content: options.systemPrompt });
  }

  const openaiTools =
    tools.length > 0
      ? tools.map((t) => ({
          type: "function" as const,
          function: {
            name: t.name,
            description: t.description,
            parameters: t.input_schema,
          },
        }))
      : undefined;

  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: currentMessages,
          max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
          stream: true,
          tools: openaiTools,
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      emit("error", { error: `OpenAI API error: ${response.status} ${errorBody}` });
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      emit("error", { error: "Response body is not readable" });
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let fullContent = "";
    const toolCalls: Map<number, OpenAIToolCall> = new Map();
    let finishReason: string | null = null;

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
              delta?: {
                content?: string;
                tool_calls?: Array<{
                  index: number;
                  id?: string;
                  type?: string;
                  function?: { name?: string; arguments?: string };
                }>;
              };
              finish_reason?: string | null;
            }>;
            usage?: { prompt_tokens?: number; completion_tokens?: number };
          };

          if (chunk.usage) {
            totalInputTokens = chunk.usage.prompt_tokens || 0;
            totalOutputTokens = chunk.usage.completion_tokens || 0;
          }

          const delta = chunk.choices?.[0]?.delta;
          if (delta?.content) {
            fullContent += delta.content;
            emit("text", { text: delta.content });
          }

          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const existing = toolCalls.get(tc.index);
              if (!existing) {
                toolCalls.set(tc.index, {
                  id: tc.id || "",
                  name: tc.function?.name || "",
                  arguments: tc.function?.arguments || "",
                });
              } else {
                if (tc.id) existing.id = tc.id;
                if (tc.function?.name) existing.name = tc.function.name;
                if (tc.function?.arguments)
                  existing.arguments += tc.function.arguments;
              }
            }
          }

          const reason = chunk.choices?.[0]?.finish_reason;
          if (reason) finishReason = reason;
        } catch {
          // Skip malformed JSON chunks
        }
      }
    }

    // If no tool calls, we're done
    if (finishReason !== "tool_calls" || toolCalls.size === 0) {
      break;
    }

    // Add assistant message with tool calls
    const assistantToolCalls = Array.from(toolCalls.entries()).map(
      ([, tc]) => ({
        id: tc.id,
        type: "function" as const,
        function: { name: tc.name, arguments: tc.arguments },
      })
    );

    currentMessages.push({
      role: "assistant",
      content: fullContent || null,
      tool_calls: assistantToolCalls,
    });

    // Execute tools and add results
    const toolUseBlocks = Array.from(toolCalls.values()).map((tc) => ({
      id: tc.id,
      name: tc.name,
      input: JSON.parse(tc.arguments || "{}"),
    }));

    const toolResultBlocks = await executeTools(toolUseBlocks, emit, options.sessionId, options.permissionMode);

    // Add tool results as separate messages
    for (const result of toolResultBlocks) {
      if (result.type === "tool_result") {
        currentMessages.push({
          role: "tool",
          content: result.content,
          tool_call_id: result.tool_use_id,
        });
      }
    }
  }

  // Emit usage
  const cost = calculateOpenAICost(model, totalInputTokens, totalOutputTokens);
  emit("usage", {
    inputTokens: totalInputTokens,
    outputTokens: totalOutputTokens,
    cacheCreationInputTokens: 0,
    cacheReadInputTokens: 0,
    cost,
  });
}

// ─── Shared tool execution ───────────────────────────────────────────────────

async function executeTools(
  toolUseBlocks: { id: string; name: string; input: Record<string, unknown> }[],
  emit: EmitFn,
  sessionId?: string,
  permissionMode?: "default" | "plan" | "acceptEdits" | "bypassPermissions"
): Promise<ContentBlock[]> {
  const toolResultBlocks: ContentBlock[] = [];

  for (const toolUse of toolUseBlocks) {
    const tool = getTool(toolUse.name);

    if (!tool) {
      const errorMsg = `Unknown tool: ${toolUse.name}`;
      toolResultBlocks.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: errorMsg,
        is_error: true,
      });
      emit("tool_result", {
        tool_use_id: toolUse.id,
        content: errorMsg,
        is_error: true,
      });
      continue;
    }

    // Bypass permissions mode: skip all confirmations
    if (permissionMode === "bypassPermissions") {
      emit("tool_use", {
        id: toolUse.id,
        name: toolUse.name,
        input: toolUse.input,
        riskLevel: "low",
      });

      try {
        const result = await executeToolWithSandbox({
          toolName: toolUse.name,
          params: toolUse.input,
          sessionId,
        });

        toolResultBlocks.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: result.output || result.error || "",
          is_error: !!result.error,
        });
        emit("tool_result", {
          tool_use_id: toolUse.id,
          content: result.output || result.error || "",
          is_error: !!result.error,
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Tool execution failed";
        toolResultBlocks.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: errorMsg,
          is_error: true,
        });
        emit("tool_result", {
          tool_use_id: toolUse.id,
          content: errorMsg,
          is_error: true,
        });
      }
      continue;
    }

    // Assess tool execution using permission grading
    const decision: ToolExecutionDecision = assessToolExecution({
      toolName: toolUse.name,
      params: toolUse.input,
      sessionId,
    });

    // In acceptEdits mode: auto-approve file edit tools
    const effectiveRiskLevel =
      permissionMode === "acceptEdits" &&
      (toolUse.name === "file_edit" || toolUse.name === "file_write" || toolUse.name === "multiEdit")
        ? "low"
        : decision.riskLevel;

    // Emit tool_use event with risk level
    emit("tool_use", {
      id: toolUse.id,
      name: toolUse.name,
      input: toolUse.input,
      riskLevel: effectiveRiskLevel,
    });

    // Handle confirmation based on risk level
    if (effectiveRiskLevel === "low") {
      // Auto-approve: no confirmation needed
    } else if (effectiveRiskLevel === "high") {
      // Needs confirmation before execution
      emit("tool_confirmation_needed", {
        tool_use_id: toolUse.id,
        name: toolUse.name,
        input: toolUse.input,
        riskLevel: "high",
        sandboxEnabled: decision.sandboxEnabled,
        reason: decision.reason,
      });

      setPendingConfirmation(toolUse.id);
      const approved = await waitForConfirmation(toolUse.id);

      if (!approved) {
        const denialMsg = `Tool execution denied by user: ${toolUse.name}`;
        toolResultBlocks.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: denialMsg,
          is_error: true,
        });
        emit("tool_result", {
          tool_use_id: toolUse.id,
          content: denialMsg,
          is_error: true,
        });
        continue;
      }
    } else if (effectiveRiskLevel === "outside-sandbox") {
      // Needs special confirmation — runs on host, not sandbox
      emit("tool_confirmation_needed", {
        tool_use_id: toolUse.id,
        name: toolUse.name,
        input: toolUse.input,
        riskLevel: "outside-sandbox",
        sandboxEnabled: decision.sandboxEnabled,
        reason: decision.reason,
      });

      setPendingConfirmation(toolUse.id);
      const approved = await waitForConfirmation(toolUse.id);

      if (!approved) {
        const denialMsg = `Tool execution denied by user: ${toolUse.name} (host execution)`;
        toolResultBlocks.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: denialMsg,
          is_error: true,
        });
        emit("tool_result", {
          tool_use_id: toolUse.id,
          content: denialMsg,
          is_error: true,
        });
        continue;
      }
    }

    // Execute the tool (with sandbox routing)
    try {
      let result: ToolResult;

      if (decision.riskLevel === "outside-sandbox") {
        // Outside-sandbox: always execute on host
        result = await tool.execute(toolUse.input);
      } else {
        // Use the sandbox adapter for routing
        result = await executeToolWithSandbox(
          {
            toolName: toolUse.name,
            params: toolUse.input,
            sessionId,
          }
        );
      }

      const resultContent = result.error
        ? `${result.output}\n[Error] ${result.error}`
        : result.output;

      toolResultBlocks.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: resultContent,
        is_error: !!result.error,
      });
      emit("tool_result", {
        tool_use_id: toolUse.id,
        content: resultContent,
        is_error: !!result.error,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      toolResultBlocks.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: errorMessage,
        is_error: true,
      });
      emit("tool_result", {
        tool_use_id: toolUse.id,
        content: errorMessage,
        is_error: true,
      });
    }
  }

  return toolResultBlocks;
}

// ─── Main entry point ────────────────────────────────────────────────────────

/**
 * Create an agentic streaming chat completion.
 *
 * Handles the full agentic loop: LLM → tool_use → execute → tool_result → LLM → ...
 * Returns a ReadableStream of SSE events.
 */
export function createAgenticStream(
  messages: Message[],
  options: AgenticStreamOptions = {}
): ReadableStream<Uint8Array> {
  initializeTools();

  const provider = getActiveProvider();
  const encoder = new TextEncoder();
  const tools = getToolDefinitions();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        if (provider === "anthropic") {
          await runAnthropicLoop(messages, tools, options, emit);
        } else if (provider === "openai") {
          await runOpenAILoop(messages, tools, options, emit);
        } else {
          emit("error", {
            error: `Provider "${provider}" is not yet supported for agentic mode. Supported: anthropic, openai.`,
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        emit("error", { error: message });
      }

      emit("done", null);
      controller.close();
    },
  });
}
