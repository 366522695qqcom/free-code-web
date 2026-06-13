"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    <span className="font-mono text-xs text-text-muted/50">
      {mins > 0 ? `${mins}m ` : ""}
      {secs}s
    </span>
  );
}

function StatusIndicator({ status }: { status: "running" | "done" | "error" }) {
  if (status === "running") {
    return (
      <span className="relative flex size-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-brand" />
      </span>
    );
  }
  if (status === "done") {
    return (
      <span className="inline-flex size-4 items-center justify-center rounded-full bg-brand/15 text-brand text-[10px]">
        ✓
      </span>
    );
  }
  return (
    <span className="inline-flex size-4 items-center justify-center rounded-full bg-accent-red/15 text-accent-red text-[10px]">
      ✕
    </span>
  );
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

  // Generate a DOM id for scrolling from file tree
  const domId = filePath
    ? `tool-${filePath.replace(/[^a-zA-Z0-9-_]/g, "_")}-${toolUse.id}`
    : undefined;

  return (
    <div id={domId} className="rounded-xl border border-border-subtle/50 bg-overlay/20">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left font-mono text-sm leading-relaxed transition-colors hover:bg-overlay/20"
      >
        <motion.span
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.15 }}
          className="shrink-0 text-text-muted/60"
        >
          ▶
        </motion.span>
        <StatusIndicator status={status} />
        <span className="shrink-0 text-[10px] uppercase tracking-wider text-text-muted">
          {displayName}
        </span>
        {!isExpanded && (
          <span className="truncate text-text-muted">{collapsedPreview}</span>
        )}
        {status === "running" && <ElapsedTimer />}
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-border-subtle/30 px-3 py-2">
              {/* File path for file edits */}
              {isFileEdit && filePath && (
                <div className="font-mono text-xs text-accent-cyan mb-1">
                  {filePath}
                </div>
              )}

              {/* Full input */}
              <div className="terminal-output text-text-muted">
                {isBash && <span className="text-accent-green">$ </span>}
                {inputPreview}
              </div>

              {/* Output if available */}
              {status !== "running" && output && (
                <div className="mt-1.5 rounded border border-border-subtle/30 bg-black/40 p-2 max-h-60 overflow-y-auto">
                  <div className="terminal-output text-text-muted">
                    {output}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
