"use client";

import { calculateTokenWarningState } from "@/lib/context";

interface TokenWarningProps {
  tokenUsage: number;
  model: string;
  autoCompactEnabled?: boolean;
}

export function TokenWarning({ tokenUsage, model, autoCompactEnabled = true }: TokenWarningProps) {
  const state = calculateTokenWarningState(tokenUsage, model, autoCompactEnabled);

  if (!state.isAboveWarningThreshold) {
    return null;
  }

  // Auto-compact enabled: show "XX% until auto-compact" (dimmed)
  if (autoCompactEnabled) {
    return (
      <div className="px-4 py-1 font-mono text-xs text-muted-foreground/50">
        {state.percentLeft}% until auto-compact
      </div>
    );
  }

  // Auto-compact disabled: show warning/error
  const colorClass = state.isAboveErrorThreshold ? "text-destructive" : "text-yellow-500";

  return (
    <div className={`px-4 py-1 font-mono text-xs ${colorClass}`}>
      Context low ({state.percentLeft}% remaining) · /compact to compact &amp; continue
    </div>
  );
}
