"use client";

import { useState, useCallback, useRef } from "react";
import { connectSSE } from "@/lib/sse";
import type { ChatMessage, ChatResponseEvent } from "@/types";

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
}

export function useChat(sessionId: string | null): UseChatReturn {
  const [messages, setMessages] = useState<EnhancedMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsStreaming(false);
  }, []);

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
            message: content,
            conversationId: sessionId,
            model,
          }),
          signal: abortController.signal,
        });

        for await (const event of stream) {
          if (abortController.signal.aborted) break;

          try {
            const data = JSON.parse(event.data) as ChatResponseEvent;

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
                    blocks.push({
                      type: "tool_result",
                      toolResult: {
                        toolUseId: data.toolUse.id,
                        output: data.content,
                      },
                      status: "done",
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
                        status: "done",
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
    [sessionId]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    clearMessages,
    setMessages,
  };
}
