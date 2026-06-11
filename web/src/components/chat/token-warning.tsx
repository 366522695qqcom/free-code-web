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
        距离自动压缩还有 {state.percentLeft}%
      </div>
    );
  }

  // Auto-compact disabled: show warning/error
  const colorClass = state.isAboveErrorThreshold ? "text-destructive" : "text-yellow-500";

  return (
    <div className={`px-4 py-1 font-mono text-xs ${colorClass}`}>
      上下文不足（剩余 {state.percentLeft}%）· 输入 /压缩 以压缩并继续
    </div>
  );
}
