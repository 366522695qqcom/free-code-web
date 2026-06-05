"use client";

import { useState, useEffect } from "react";

interface ToolUseBlockProps {
  toolUse: {
    id: string;
    name: string;
    input: Record<string, unknown>;
  };
  status: "running" | "done" | "error";
  output?: string;
}

function getToolDisplayName(name: string): string {
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function truncateInput(input: Record<string, unknown>, maxLen = 120): string {
  const str = JSON.stringify(input, null, 2);
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "...";
}

function formatBashInput(input: Record<string, unknown>): string {
  if (input.command) return String(input.command);
  return truncateInput(input);
}

function formatFileEditInput(input: Record<string, unknown>): string {
  const parts: string[] = [];
  if (input.file_path || input.path) parts.push(String(input.file_path || input.path));
  if (input.old_string) parts.push(`- ${String(input.old_string).slice(0, 60)}`);
  if (input.new_string) parts.push(`+ ${String(input.new_string).slice(0, 60)}`);
  return parts.join("\n") || truncateInput(input);
}

function formatCollapsedPreview(
  name: string,
  input: Record<string, unknown>
): string {
  const isBash =
    name.toLowerCase().includes("bash") ||
    name.toLowerCase().includes("shell");
  const isFileEdit =
    name.toLowerCase().includes("edit") ||
    name.toLowerCase().includes("file");

  if (isBash) return formatBashInput(input);
  if (isFileEdit) {
    const filePath = input.file_path || input.path;
    if (filePath) {
      const oldStr = input.old_string ? String(input.old_string).slice(0, 30) : "";
      const newStr = input.new_string ? String(input.new_string).slice(0, 30) : "";
      if (oldStr && newStr) return `${filePath}: replace "${oldStr}" → "${newStr}"`;
      return String(filePath);
    }
  }
  return truncateInput(input, 80);
}

function ElapsedTimer() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startTime = performance.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((performance.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (elapsed < 1) return null;

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return (
    <span className="font-mono text-xs text-muted-foreground/50">
      {mins > 0 ? `${mins}m ` : ""}
      {secs}s
    </span>
  );
}

function StatusMarker({ status }: { status: "running" | "done" | "error" }) {
  if (status === "running") {
    return <span className="text-terminal-cyan animate-pulse">●</span>;
  }
  if (status === "done") {
    return <span className="text-terminal-green">✓</span>;
  }
  return <span className="text-terminal-red">✗</span>;
}

export function ToolUseBlock({ toolUse, status, output }: ToolUseBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayName = getToolDisplayName(toolUse.name);

  const isBash =
    toolUse.name.toLowerCase().includes("bash") ||
    toolUse.name.toLowerCase().includes("shell");
  const isFileEdit =
    toolUse.name.toLowerCase().includes("edit") ||
    toolUse.name.toLowerCase().includes("file");

  const inputPreview = isBash
    ? formatBashInput(toolUse.input)
    : isFileEdit
      ? formatFileEditInput(toolUse.input)
      : truncateInput(toolUse.input);

  const collapsedPreview = formatCollapsedPreview(toolUse.name, toolUse.input);

  const filePath = (toolUse.input.file_path || toolUse.input.path) as string | undefined;

  return (
    <div className="py-0.5">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-1.5 text-left font-mono text-sm leading-relaxed"
      >
        <span className="shrink-0">{isExpanded ? "▼" : "⏺"}</span>
        <StatusMarker status={status} />
        <span className="text-terminal-amber shrink-0">{displayName}:</span>
        {!isExpanded && (
          <span className="truncate text-muted-foreground">{collapsedPreview}</span>
        )}
        {status === "running" && <ElapsedTimer />}
      </button>

      {isExpanded && (
        <div className="animate-collapse-in pl-4 pt-1">
          {/* File path for file edits */}
          {isFileEdit && filePath && (
            <div className="font-mono text-xs text-terminal-cyan mb-1">
              {filePath}
            </div>
          )}

          {/* Full input */}
          <div className="terminal-output text-muted-foreground">
            {isBash && <span className="text-terminal-green">$ </span>}
            {inputPreview}
          </div>

          {/* Output if available */}
          {status !== "running" && output && (
            <div className="mt-1.5 rounded border border-border/30 bg-black/40 p-2 max-h-60 overflow-y-auto">
              <div className="terminal-output text-muted-foreground">
                {output}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
