"use client";

import type { Usage } from "@/types";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface CostTrackerProps {
  usage: Usage;
}

function formatTokens(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return String(count);
}

function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(2)}`;
}

export function CostTracker({ usage }: CostTrackerProps) {
  const { inputTokens, outputTokens, cost } = usage;

  const hasUsage = inputTokens > 0 || outputTokens > 0;

  if (!hasUsage) return null;

  return (
    <Tooltip>
      <TooltipTrigger className="flex items-center gap-2 font-mono text-xs text-muted-foreground/60 select-none cursor-default">
        <span className="text-terminal-cyan/60">↑{formatTokens(inputTokens)}</span>
        <span className="text-terminal-green/60">↓{formatTokens(outputTokens)}</span>
        <span className="text-terminal-amber/60">{formatCost(cost)}</span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <div className="font-mono text-xs space-y-0.5">
          <div>Input tokens: {inputTokens.toLocaleString()}</div>
          <div>Output tokens: {outputTokens.toLocaleString()}</div>
          <div>Estimated cost: {formatCost(cost)}</div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
