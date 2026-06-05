"use client";

import { useState, useCallback, useRef } from "react";
import { connectSSE } from "@/lib/sse";
import type { ChatMessage, ChatResponseEvent, ToolConfirmation, Usage } from "@/types";

export interface ContentBlock {
  type: "text" | "thinking" | "tool_use" | "tool_result";
  text?: string;
  toolUse?: {
    id: string;
    name: string;
    input: Record<string, unknown>;
  };
  toolResult?: {
    toolUseId: string;
    output: string;
    isError?: boolean;
    toolName?: string;
    toolInput?: Record<string, unknown>;
    exitCode?: number;
  };
  status?: "running" | "done" | "error";
}

export interface EnhancedMessage extends ChatMessage {
  contentBlocks?: ContentBlock[];
}

interface UseChatReturn {
  messages: EnhancedMessage[];
  isStreaming: boolean;
  error: string | null;
  sendMessage: (content: string, model?: string) => Promise<void>;
  stopStreaming: () => void;
  clearMessages: () => void;
  setMessages: (messages: EnhancedMessage[]) => void;
  pendingConfirmation: ToolConfirmation | null;
  autoApprovedTools: Set<string>;
  confirmTool: (toolUseId: string, approved: boolean, alwaysAllow?: boolean) => void;
  usage: Usage;
}

export function useChat(sessionId: string | null): UseChatReturn {
  const [messages, setMessages] = useState<EnhancedMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<ToolConfirmation | null>(null);
  const [autoApprovedTools, setAutoApprovedTools] = useState<Set<string>>(new Set());
  const [usage, setUsage] = useState<Usage>({ inputTokens: 0, outputTokens: 0, cost: 0 });
  const abortControllerRef = useRef<AbortController | null>(null);
  const confirmationResolverRef = useRef<((approved: boolean) => void) | null>(null);

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsStreaming(false);
    setPendingConfirmation(null);
    confirmationResolverRef.current = null;
  }, []);

  const confirmTool = useCallback(
    async (toolUseId: string, approved: boolean, alwaysAllow?: boolean) => {
      if (alwaysAllow && approved && pendingConfirmation) {
        setAutoApprovedTools((prev) => {
          const next = new Set(prev);
          next.add(pendingConfirmation.toolName);
          return next;
        });
      }

      // Send confirmation to server
      try {
        await fetch("/api/tools/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toolUseId, approved }),
        });
      } catch {
        // Confirmation endpoint may not exist yet; resolve locally
      }

      // Resolve the pending promise so streaming can continue
      if (confirmationResolverRef.current) {
        confirmationResolverRef.current(approved);
        confirmationResolverRef.current = null;
      }
      setPendingConfirmation(null);
    },
    [pendingConfirmation]
  );

  const sendMessage = useCallback(
    async (content: string, model?: string) => {
      if (!sessionId || !content.trim()) return;

      setError(null);
      setIsStreaming(true);

      const userMessage: EnhancedMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        timestamp: Date.now(),
      };

      const assistantMessage: EnhancedMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        contentBlocks: [],
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const stream = connectSSE("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              ...messages.map((m) => ({
                role: m.role,
                content: m.contentBlocks
                  ? m.contentBlocks
                      .filter((b) => b.type === "text" || b.type === "tool_use" || b.type === "tool_result")
                      .map((b) => {
                        if (b.type === "text") return { type: "text", text: b.text || "" };
                        if (b.type === "tool_use" && b.toolUse)
                          return { type: "tool_use", id: b.toolUse.id, name: b.toolUse.name, input: b.toolUse.input };
                        if (b.type === "tool_result" && b.toolResult)
                          return { type: "tool_result", tool_use_id: b.toolResult.toolUseId, content: b.toolResult.output, is_error: b.toolResult.isError };
                        return { type: "text", text: "" };
                      })
                  : [{ type: "text", text: m.content }],
                timestamp: new Date(m.timestamp).toISOString(),
              })),
              {
                role: "user",
                content: [{ type: "text", text: content }],
                timestamp: new Date().toISOString(),
              },
            ],
            model,
            sessionId,
          }),
          signal: abortController.signal,
        });

        for await (const event of stream) {
          if (abortController.signal.aborted) break;

          try {
            const data = JSON.parse(event.data) as ChatResponseEvent;

            // Handle tool confirmation needed
            if (data.type === "tool_confirmation_needed" && "confirmation" in data) {
              const confirmation = data.confirmation;

              // Check if tool is auto-approved
              if (autoApprovedTools.has(confirmation.toolName)) {
                // Auto-approve: send confirmation immediately
                try {
                  await fetch("/api/tools/confirm", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ toolUseId: confirmation.toolUseId, approved: true }),
                  });
                } catch {
                  // Confirmation endpoint may not exist yet
                }
                continue;
              }

              // Show confirmation dialog and wait for user response
              setPendingConfirmation(confirmation);
              const approved = await new Promise<boolean>((resolve) => {
                confirmationResolverRef.current = resolve;
              });

              if (!approved) {
                // User denied — stop streaming
                break;
              }
              continue;
            }

            // Handle usage events
            if (data.type === "usage" && "usage" in data) {
              const usageData = data.usage as Usage;
              setUsage((prev) => ({
                inputTokens: prev.inputTokens + usageData.inputTokens,
                outputTokens: prev.outputTokens + usageData.outputTokens,
                cost: prev.cost + usageData.cost,
              }));
              continue;
            }

            setMessages((prev) => {
              const updated = [...prev];
              const lastMsg = updated[updated.length - 1];
              if (lastMsg.role !== "assistant") return prev;

              const blocks = [...(lastMsg.contentBlocks || [])];

              switch (data.type) {
                case "text":
                  if (
                    blocks.length > 0 &&
                    blocks[blocks.length - 1].type === "text"
                  ) {
                    blocks[blocks.length - 1] = {
                      ...blocks[blocks.length - 1],
                      text: (blocks[blocks.length - 1].text || "") + data.content,
                    };
                  } else {
                    blocks.push({ type: "text", text: data.content });
                  }
                  break;

                case "tool_use":
                  if (data.toolUse) {
                    blocks.push({
                      type: "tool_use",
                      toolUse: data.toolUse,
                      status: "running",
                    });
                  }
                  break;

                case "tool_result":
                  if (data.toolUse) {
                    // Find the matching tool_use block to get its name/input
                    const matchingToolUse = blocks.find(
                      (b) =>
                        b.type === "tool_use" &&
                        b.toolUse?.id === data.toolUse?.id
                    );

                    blocks.push({
                      type: "tool_result",
                      toolResult: {
                        toolUseId: data.toolUse.id,
                        output: data.content,
                        isError: data.isError,
                        toolName: matchingToolUse?.toolUse?.name,
                        toolInput: matchingToolUse?.toolUse?.input,
                      },
                      status: data.isError ? "error" : "done",
                    });
                    // Mark the matching tool_use block as done
                    const toolUseIdx = blocks.findIndex(
                      (b) =>
                        b.type === "tool_use" &&
                        b.toolUse?.id === data.toolUse?.id
                    );
                    if (toolUseIdx !== -1) {
                      blocks[toolUseIdx] = {
                        ...blocks[toolUseIdx],
                        status: data.isError ? "error" : "done",
                      };
                    }
                  }
                  break;

                case "error":
                  blocks.push({
                    type: "text",
                    text: `Error: ${data.content}`,
                  });
                  break;

                case "done":
                  break;
              }

              const fullText = blocks
                .filter((b) => b.type === "text")
                .map((b) => b.text || "")
                .join("");

              updated[updated.length - 1] = {
                ...lastMsg,
                content: fullText,
                contentBlocks: blocks,
              };
              return updated;
            });
          } catch {
            // Non-JSON data, treat as raw text
            setMessages((prev) => {
              const updated = [...prev];
              const lastMsg = updated[updated.length - 1];
              if (lastMsg.role !== "assistant") return prev;

              const blocks = [...(lastMsg.contentBlocks || [])];
              if (
                blocks.length > 0 &&
                blocks[blocks.length - 1].type === "text"
              ) {
                blocks[blocks.length - 1] = {
                  ...blocks[blocks.length - 1],
                  text: (blocks[blocks.length - 1].text || "") + event.data,
                };
              } else {
                blocks.push({ type: "text", text: event.data });
              }

              const fullText = blocks
                .filter((b) => b.type === "text")
                .map((b) => b.text || "")
                .join("");

              updated[updated.length - 1] = {
                ...lastMsg,
                content: fullText,
                contentBlocks: blocks,
              };
              return updated;
            });
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // User cancelled, ignore
        } else {
          setError(err instanceof Error ? err.message : "Streaming failed");
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [sessionId, messages, autoApprovedTools]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setUsage({ inputTokens: 0, outputTokens: 0, cost: 0 });
  }, []);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    clearMessages,
    setMessages,
    pendingConfirmation,
    autoApprovedTools,
    confirmTool,
    usage,
  };
}
