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

interface ToolUseBlockProps {
  toolUse: {
    id: string;
    name: string;
    input: Record<string, unknown>;
  };
  status: "running" | "done" | "error";
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
  // Convert camelCase/PascalCase to readable format
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

export function ToolUseBlock({ toolUse, status }: ToolUseBlockProps) {
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
    <div className="rounded-lg border border-border/50 bg-muted/20">
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
        <Icon className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate text-sm text-muted-foreground">
          {displayName}
        </span>
        {status === "running" && (
          <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
        )}
        {status === "done" && (
          <CheckCircle2 className="size-3.5 text-green-500/70" />
        )}
        {status === "error" && (
          <XCircle className="size-3.5 text-destructive/70" />
        )}
      </button>
      {isExpanded && (
        <div className="border-t border-border/50 px-3 py-2">
          <div
            className={cn(
              "terminal-output text-muted-foreground",
              isBash && "rounded bg-black/30 p-2"
            )}
          >
            {inputPreview}
          </div>
        </div>
      )}
      {!isExpanded && (
        <div className="border-t border-border/30 px-3 py-1.5">
          <p className="truncate text-xs text-muted-foreground/60">
            {inputPreview.split("\n")[0]}
          </p>
        </div>
      )}
    </div>
  );
}
