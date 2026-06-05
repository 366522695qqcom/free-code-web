"use client";

import { Bot, Loader2 } from "lucide-react";
import type { EnhancedMessage } from "@/hooks/use-chat";
import { TextBlock } from "./text-block";
import { ThinkingBlock } from "./thinking-block";
import { ToolUseBlock } from "./tool-use-block";
import { ToolResultBlock } from "./tool-result-block";

interface AssistantMessageProps {
  message: EnhancedMessage;
  isStreaming: boolean;
}

export function AssistantMessage({ message, isStreaming }: AssistantMessageProps) {
  const blocks = message.contentBlocks || [];

  // If no content blocks yet but streaming, show loading
  const showLoading = isStreaming && blocks.length === 0;

  return (
    <div className="animate-message-in flex items-start gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted border border-border">
        <Bot className="size-4 text-terminal-green" />
      </div>
      <div className="min-w-0 max-w-[80%] flex-1 space-y-3">
        {blocks.map((block, index) => {
          switch (block.type) {
            case "text":
              return <TextBlock key={index} text={block.text || ""} />;
            case "thinking":
              return <ThinkingBlock key={index} text={block.text || ""} />;
            case "tool_use":
              return (
                <ToolUseBlock
                  key={index}
                  toolUse={block.toolUse!}
                  status={block.status || "running"}
                />
              );
            case "tool_result":
              return (
                <ToolResultBlock
                  key={index}
                  toolResult={block.toolResult!}
                />
              );
            default:
              return null;
          }
        })}
        {showLoading && (
          <div className="flex items-center gap-2 text-terminal-cyan">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm font-mono">Thinking...</span>
          </div>
        )}
      </div>
    </div>
  );
}
