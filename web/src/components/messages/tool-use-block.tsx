"use client";

import { useState, useEffect } from "react";
import {
  ChevronRight,
  Terminal,
  FileEdit,
  Wrench,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolUseBlockProps {
  toolUse: {
    id: string;
    name: string;
    input: Record<string, unknown>;
  };
  status: "running" | "done" | "error";
  output?: string;
}

function ToolIcon({ name }: { name: string }) {
  const lower = name.toLowerCase();
  if (lower.includes("bash") || lower.includes("shell") || lower.includes("exec")) {
    return <Terminal className="size-3.5 shrink-0 text-terminal-amber" />;
  }
  if (lower.includes("edit") || lower.includes("file") || lower.includes("write")) {
    return <FileEdit className="size-3.5 shrink-0 text-terminal-amber" />;
  }
  return <Wrench className="size-3.5 shrink-0 text-terminal-amber" />;
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

export function ToolUseBlock({ toolUse, status, output }: ToolUseBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
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

  const hasOutput = !!output;

  return (
    <div
      className={cn(
        "rounded-lg border border-border/50 bg-muted/20",
        status === "running" && "animate-pulse-glow border-terminal-cyan/20"
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
        <ToolIcon name={toolUse.name} />
        <span className="flex-1 truncate font-mono text-sm text-muted-foreground">
          {displayName}
        </span>
        {status === "running" && (
          <>
            <ElapsedTimer />
            <Loader2 className="size-3.5 animate-spin text-terminal-cyan" />
          </>
        )}
        {status === "done" && (
          <CheckCircle2 className="size-3.5 text-terminal-green" />
        )}
        {status === "error" && (
          <XCircle className="size-3.5 text-terminal-red" />
        )}
      </button>
      {isExpanded && (
        <div className="animate-collapse-in border-t border-border/50 px-3 py-2">
          <div
            className={cn(
              "terminal-output text-muted-foreground",
              isBash && "rounded border border-border/30 bg-black/40 p-2"
            )}
          >
            {isBash && <span className="text-terminal-green">$ </span>}
            {inputPreview}
          </div>

          {/* View Output button for completed tools */}
          {status !== "running" && hasOutput && (
            <div className="mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOutput(!showOutput);
                }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-terminal-cyan"
              >
                <Clock className="size-3" />
                {showOutput ? "Hide Output" : "View Output"}
              </button>
              {showOutput && (
                <div className="mt-1.5 terminal-output rounded border border-border/30 bg-black/40 p-2 text-muted-foreground max-h-60 overflow-y-auto">
                  {output}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {!isExpanded && (
        <div className="border-t border-border/30 px-3 py-1.5">
          <p className="truncate font-mono text-xs text-muted-foreground/60">
            {isBash && <span className="text-terminal-green/60">$ </span>}
            {inputPreview.split("\n")[0]}
          </p>
        </div>
      )}
    </div>
  );
}
