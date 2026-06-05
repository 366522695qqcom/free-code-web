"use client";

import { useState } from "react";
import { ChevronRight, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThinkingBlockProps {
  text: string;
}

export function ThinkingBlock({ text }: ThinkingBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  return (
    <div className="rounded-lg border border-border/50 bg-muted/30">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronRight
          className={cn(
            "size-3.5 shrink-0 transition-transform",
            isExpanded && "rotate-90"
          )}
        />
        <Brain className="size-3.5 shrink-0 text-terminal-amber" />
        <span className="truncate font-mono">Thinking...</span>
      </button>
      {isExpanded && (
        <div className="animate-collapse-in border-t border-border/50 px-3 py-2">
          <p className="whitespace-pre-wrap font-mono text-xs italic text-muted-foreground/80">
            {text}
          </p>
        </div>
      )}
    </div>
  );
}
