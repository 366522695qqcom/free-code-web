"use client";

import { useState } from "react";
import { ChevronRight, FileOutput } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolResultBlockProps {
  toolResult: {
    toolUseId: string;
    output: string;
    isError?: boolean;
  };
}

function formatOutput(output: string, isError?: boolean): string {
  if (!output) return "(no output)";
  if (isError) return `Error: ${output}`;
  return output;
}

export function ToolResultBlock({ toolResult }: ToolResultBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { output, isError } = toolResult;

  return (
    <div
      className={cn(
        "rounded-lg border border-border/50",
        isError ? "bg-destructive/5" : "bg-muted/10"
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-muted/30"
      >
        <ChevronRight
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform",
            isExpanded && "rotate-90"
          )}
        />
        <FileOutput className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {isError ? "Error Output" : "Output"}
        </span>
      </button>
      {isExpanded && (
        <div className="border-t border-border/50 px-3 py-2">
          <div className="terminal-output rounded bg-black/30 p-2 text-muted-foreground">
            {formatOutput(output, isError)}
          </div>
        </div>
      )}
    </div>
  );
}
