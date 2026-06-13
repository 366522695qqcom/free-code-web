"use client";

import { useEffect, useRef } from "react";
import type { ToolConfirmation } from "@/types";

interface ToolConfirmDialogProps {
  confirmation: ToolConfirmation | null;
  onAllow: (toolCallId: string, alwaysAllow?: boolean) => void;
  onDeny: (toolCallId: string) => void;
}

function formatToolInput(input: Record<string, unknown>): string {
  if (input.command) return String(input.command);
  if (input.file_path || input.path) {
    const filePath = String(input.file_path || input.path);
    return filePath.split("/").pop() || filePath;
  }
  if (input.pattern) return String(input.pattern);
  return JSON.stringify(input).slice(0, 80);
}

export function ToolConfirmDialog({
  confirmation,
  onAllow,
  onDeny,
}: ToolConfirmDialogProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!confirmation) return;

    const currentConfirmation = confirmation;

    function handleKeyDown(e: KeyboardEvent) {
      // Don't capture if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const isHighRisk = currentConfirmation.riskLevel === "high";

      switch (e.key.toLowerCase()) {
        case "y":
        case "enter":
          e.preventDefault();
          onAllow(currentConfirmation.toolCallId, false);
          break;
        case "n":
        case "escape":
          e.preventDefault();
          onDeny(currentConfirmation.toolCallId);
          break;
        case "a":
          if (isHighRisk) {
            e.preventDefault();
            onAllow(currentConfirmation.toolCallId, true);
          }
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirmation, onAllow, onDeny]);

  // Scroll into view when confirmation appears
  useEffect(() => {
    if (confirmation && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [confirmation]);

  if (!confirmation) return null;

  const isOutsideSandbox = confirmation.riskLevel === "outside-sandbox";
  const isHighRisk = confirmation.riskLevel === "high";

  return (
    <div ref={containerRef} className="py-1 font-mono text-sm">
      {/* Tool info line */}
      <div className="flex items-center gap-2">
        <span className={isOutsideSandbox ? "text-accent-red" : "text-accent-orange"}>
          {isOutsideSandbox ? "▲" : "●"}
        </span>
        <span className="text-accent-orange">
          {confirmation.toolName}
        </span>
        <span className="text-text-muted truncate">
          {formatToolInput(confirmation.toolInput)}
        </span>
      </div>

      {/* Warning for outside-sandbox */}
      {isOutsideSandbox && (
        <div className="pl-4 text-accent-red text-xs">
          ⚠ 在宿主机运行，不在沙箱中
        </div>
      )}

      {/* Reason for high risk */}
      {isHighRisk && confirmation.reason && (
        <div className="pl-4 text-accent-orange/70 text-xs">
          {confirmation.reason}
        </div>
      )}

      {/* Prompt line */}
      <div className="pl-4 flex items-center gap-1">
        <span className="text-text-muted">允许？</span>
        <span className="text-text-muted/60">[</span>
        <button
          onClick={() => onAllow(confirmation.toolCallId)}
          className="text-accent-green hover:underline focus:outline-none focus:underline"
        >
          Y
        </button>
        <span className="text-text-muted/60">/</span>
        <button
          onClick={() => onDeny(confirmation.toolCallId)}
          className="text-accent-red hover:underline focus:outline-none focus:underline"
        >
          n
        </button>
        {isHighRisk && (
          <>
            <span className="text-text-muted/60">/</span>
            <button
              onClick={() => onAllow(confirmation.toolCallId, true)}
              className="text-accent-orange hover:underline focus:outline-none focus:underline"
            >
              a
            </button>
            <span className="text-text-muted/50 text-xs">(始终)</span>
          </>
        )}
        <span className="text-text-muted/60">]</span>
        <span className="text-text-muted/40">:</span>
      </div>
    </div>
  );
}
