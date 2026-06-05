"use client";

import { useState } from "react";

interface ThinkingBlockProps {
  text: string;
}

export function ThinkingBlock({ text }: ThinkingBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  return (
    <div className="py-0.5">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 font-mono text-sm text-left text-muted-foreground/60 transition-colors hover:text-muted-foreground"
      >
        <span className="text-terminal-amber">{isExpanded ? "▼" : "◌"}</span>
        <span className="truncate">
          {isExpanded ? "Thinking" : "Thinking..."}
        </span>
      </button>
      {isExpanded && (
        <div className="animate-collapse-in pl-4 pt-1">
          <p className="whitespace-pre-wrap font-mono text-xs text-muted-foreground/50">
            {text}
          </p>
        </div>
      )}
    </div>
  );
}
