"use client";

import { useState } from "react";
import {
  ChevronRight,
  Terminal,
  FileEdit,
  Wrench,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnsiRenderer } from "./ansi-renderer";

interface ToolCallBlockProps {
  toolUse: {
    id: string;
    name: string;
    input: Record<string, unknown>;
  };
  status: "running" | "done" | "error";
  output?: string;
}

function getToolIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("bash") || lower.includes("shell") || lower.includes("exec")) {
    return Terminal;
  }
  if (lower.includes("edit") || lower.includes("file") || lower.includes("write")) {
    return FileEdit;
  }
  return Wrench;
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

const statusIcons = {
  running: <Loader2 className="size-3 animate-spin text-terminal-yellow" />,
  done: <CheckCircle2 className="size-3 text-terminal-green" />,
  error: <XCircle className="size-3 text-terminal-red" />,
};

const statusLabels = {
  running: "⏳",
  done: "✓",
  error: "✗",
};

export function ToolCallBlock({ toolUse, status, output }: ToolCallBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = getToolIcon(toolUse.name);
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

  return (
    <div className="border border-terminal-border bg-terminal-surface/30">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-terminal-surface/60"
      >
        <ChevronRight
          className={cn(
            "size-3 shrink-0 text-terminal-dim transition-transform",
            isExpanded && "rotate-90"
          )}
        />
        <span className="text-terminal-dim">{statusLabels[status]}</span>
        <Icon className="size-3 shrink-0 text-terminal-cyan" />
        <span className="flex-1 truncate text-terminal-cyan font-medium">
          {displayName}
        </span>
        {statusIcons[status]}
      </button>
      {isExpanded && (
        <div className="border-t border-terminal-border">
          <div className="px-3 py-1.5">
            <span className="text-[0.65rem] text-terminal-dim uppercase tracking-wider">Input</span>
          </div>
          <div className="px-3 pb-2">
            <div
              className={cn(
                "terminal-output rounded bg-[#080808] p-2 text-muted-foreground border border-terminal-border",
                isBash && "text-terminal-green"
              )}
            >
              {isBash ? (
                <AnsiRenderer content={inputPreview} />
              ) : (
                inputPreview
              )}
            </div>
          </div>
          {output && (
            <>
              <div className="px-3 py-1.5 border-t border-terminal-border">
                <span className="text-[0.65rem] text-terminal-dim uppercase tracking-wider">Output</span>
              </div>
              <div className="px-3 pb-2">
                <div className="terminal-output rounded bg-[#080808] p-2 text-muted-foreground border border-terminal-border">
                  <AnsiRenderer content={output} />
                </div>
              </div>
            </>
          )}
        </div>
      )}
      {!isExpanded && (
        <div className="border-t border-terminal-border/50 px-3 py-1">
          <p className="truncate text-[0.7rem] text-terminal-dim">
            {inputPreview.split("\n")[0]}
          </p>
        </div>
      )}
    </div>
  );
}
