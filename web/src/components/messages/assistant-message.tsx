"use client";

import { motion } from "framer-motion";
import type { EnhancedMessage } from "@/hooks/use-chat";
import { BrandHeader } from "@/components/ui/brand-header";
import { TextBlock } from "./text-block";
import { ThinkingBlock } from "./thinking-block";
import { ToolUseBlock } from "./tool-use-block";
import { ToolResultBlock } from "./tool-result-block";

interface AssistantMessageProps {
  message: EnhancedMessage;
  isStreaming: boolean;
  className?: string;
}

export function AssistantMessage({ message, isStreaming, className }: AssistantMessageProps) {
  const blocks = message.contentBlocks || [];
  const showLoading = isStreaming && blocks.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="px-4"
    >
      <div className="rounded-2xl border border-border-subtle bg-elevated/60 p-4 border-l-2 border-l-brand transition-all duration-150 hover:border-brand/30 hover:shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <BrandHeader size="sm" />
          <span className="text-[10px] font-mono text-text-subtle">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
            <div className="flex items-center gap-1">
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-brand" />
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-brand [animation-delay:0.2s]" />
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-brand [animation-delay:0.4s]" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
