"use client";

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
  const showLoading = isStreaming && blocks.length === 0;

  return (
    <div className="space-y-1">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "text":
            return <TextBlock key={index} text={block.text || ""} />;
          case "thinking":
            return <ThinkingBlock key={index} text={block.text || ""} />;
          case "tool_use":
            return <ToolUseBlock key={index} toolUse={block.toolUse!} status={block.status || "running"} />;
          case "tool_result":
            return <ToolResultBlock key={index} toolResult={block.toolResult!} />;
          default:
            return null;
        }
      })}
      {showLoading && (
        <div className="py-1 font-mono text-sm text-terminal-cyan animate-pulse">
          ●
        </div>
      )}
    </div>
  );
}
