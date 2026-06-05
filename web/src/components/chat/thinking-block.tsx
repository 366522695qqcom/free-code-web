"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThinkingBlockProps {
  text: string;
}

export function ThinkingBlock({ text }: ThinkingBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  return (
    <div className="border border-terminal-border bg-terminal-surface/50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-terminal-surface"
      >
        <ChevronRight
          className={cn(
            "size-3 shrink-0 text-terminal-dim transition-transform",
            isExpanded && "rotate-90"
          )}
        />
        <span className="text-terminal-dim italic">
          {isExpanded ? "thinking" : "thinking..."}
        </span>
        {!isExpanded && (
          <span className="ml-1 flex gap-0.5">
            <span className="inline-block size-1 rounded-full bg-terminal-dim animate-pulse" />
            <span className="inline-block size-1 rounded-full bg-terminal-dim animate-pulse [animation-delay:0.2s]" />
            <span className="inline-block size-1 rounded-full bg-terminal-dim animate-pulse [animation-delay:0.4s]" />
          </span>
        )}
      </button>
      {isExpanded && (
        <div className="border-t border-terminal-border px-3 py-2">
          <p className="whitespace-pre-wrap text-xs text-terminal-dim italic leading-relaxed">
            {text}
          </p>
        </div>
      )}
    </div>
  );
}
