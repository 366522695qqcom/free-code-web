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
        className="flex items-center gap-1.5 font-mono text-sm text-left text-text-muted/60 transition-colors hover:text-text-muted"
      >
        <span className="text-accent-orange">{isExpanded ? "▼" : "◌"}</span>
        <span className="truncate">
          {isExpanded ? "Thinking" : "Thinking..."}
        </span>
      </button>
      {isExpanded && (
        <div className="animate-collapse-in pl-4 pt-1">
          <p className="whitespace-pre-wrap font-mono text-xs text-text-muted/50">
            {text}
          </p>
        </div>
      )}
    </div>
  );
}
