"use client";

import { useState } from "react";
import type { EnhancedMessage } from "@/hooks/use-chat";
import { MarkdownRenderer } from "./markdown-renderer";
import { ThinkingBlock } from "./thinking-block";
import { ToolCallBlock } from "./tool-call-block";
import { cn } from "@/lib/utils";

interface MessageItemProps {
  message: EnhancedMessage;
  isStreaming: boolean;
}

export function MessageItem({ message, isStreaming }: MessageItemProps) {
  const [showTimestamp, setShowTimestamp] = useState(false);

  if (message.role === "user") {
    return (
      <div
        className="animate-message-in group"
        onMouseEnter={() => setShowTimestamp(true)}
        onMouseLeave={() => setShowTimestamp(false)}
      >
        <div className="flex items-start gap-2">
          <span className="shrink-0 text-terminal-green select-none terminal-glow">&gt;</span>
          <div className="min-w-0 flex-1">
            <p className="whitespace-pre-wrap text-sm text-terminal-green leading-relaxed">
              {message.content}
            </p>
            {showTimestamp && (
              <span className="text-[0.65rem] text-terminal-dim mt-1 block">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Assistant message
  const blocks = message.contentBlocks || [];
  const showLoading = isStreaming && blocks.length === 0;

  return (
    <div
      className="animate-message-in group"
      onMouseEnter={() => setShowTimestamp(true)}
      onMouseLeave={() => setShowTimestamp(false)}
    >
      <div className="space-y-2">
        {blocks.map((block, index) => {
          switch (block.type) {
            case "text":
              return (
                <div key={index} className="text-sm text-foreground/90">
                  <MarkdownRenderer content={block.text || ""} />
                </div>
              );
            case "thinking":
              return <ThinkingBlock key={index} text={block.text || ""} />;
            case "tool_use":
              return (
                <ToolCallBlock
                  key={index}
                  toolUse={block.toolUse!}
                  status={block.status || "running"}
                />
              );
            case "tool_result": {
              // Find matching tool_use block to show combined view
              const matchingToolUse = blocks.find(
                (b) =>
                  b.type === "tool_use" &&
                  b.toolUse?.id === block.toolResult?.toolUseId
              );
              if (matchingToolUse) return null; // Shown inside ToolCallBlock
              return (
                <div
                  key={index}
                  className={cn(
                    "border border-terminal-border bg-terminal-surface/30",
                    block.toolResult?.isError && "border-terminal-red/30"
                  )}
                >
                  <div className="px-3 py-1.5 border-b border-terminal-border">
                    <span className="text-[0.65rem] text-terminal-dim uppercase tracking-wider">
                      {block.toolResult?.isError ? "Error Output" : "Output"}
                    </span>
                  </div>
                  <div className="p-2">
                    <div className="terminal-output rounded bg-[#080808] p-2 text-muted-foreground border border-terminal-border">
                      {block.toolResult?.output || "(no output)"}
                    </div>
                  </div>
                </div>
              );
            }
            default:
              return null;
          }
        })}
        {showLoading && (
          <div className="flex items-center gap-2 text-terminal-dim text-xs">
            <span className="typing-indicator flex gap-1">
              <span className="inline-block size-1.5 rounded-full bg-terminal-green" />
              <span className="inline-block size-1.5 rounded-full bg-terminal-green" />
              <span className="inline-block size-1.5 rounded-full bg-terminal-green" />
            </span>
            <span className="italic">processing...</span>
          </div>
        )}
        {showTimestamp && !showLoading && (
          <span className="text-[0.65rem] text-terminal-dim block">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}
