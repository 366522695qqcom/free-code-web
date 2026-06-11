"use client";

import type { EnhancedMessage } from "@/hooks/use-chat";
import { BrandHeader } from "@/components/ui/brand-header";
import { TextBlock } from "./text-block";
import { ThinkingBlock } from "./thinking-block";
import { ToolUseBlock } from "./tool-use-block";
import { ToolResultBlock } from "./tool-result-block";
import { cn } from "@/lib/utils";

interface AssistantMessageProps {
  message: EnhancedMessage;
  isStreaming: boolean;
  className?: string;
}

function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function AssistantMessage({ message, isStreaming, className }: AssistantMessageProps) {
  const blocks = message.contentBlocks || [];
  const showLoading = isStreaming && blocks.length === 0;

  return (
    <div
      className={cn(
        "group rounded-2xl border border-border bg-card/60 p-4 transition-all duration-150 hover:border-brand/30 hover:shadow-sm",
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <BrandHeader size="sm" />
        <span className="text-[10px] font-mono text-muted-foreground/60">
          {formatTimestamp(message.timestamp)}
        </span>
      </div>
      <div className="space-y-2">
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
          <div className="py-1 font-mono text-sm text-brand animate-pulse">
            ●
          </div>
        )}
      </div>
    </div>
  );
}
