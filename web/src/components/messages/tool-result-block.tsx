"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { AnsiRenderer } from "@/components/chat/ansi-renderer";
import { DiffView, getLanguageLabel } from "@/components/chat/diff-view";

interface ToolResultBlockProps {
  toolResult: {
    toolUseId: string;
    output: string;
    isError?: boolean;
    toolName?: string;
    toolInput?: Record<string, unknown>;
    exitCode?: number;
  };
}

function extractExitCode(output: string): number | null {
  const match = output.match(/exit code[:\s]+(\d+)/i);
  if (match) return parseInt(match[1], 10);
  return null;
}

function extractFilePath(input?: Record<string, unknown>): string | null {
  if (!input) return null;
  const raw = input.file_path || input.path;
  if (typeof raw === "string") return raw;
  return null;
}

export function ToolResultBlock({ toolResult }: ToolResultBlockProps) {
  const { output, isError, toolName, toolInput, exitCode } = toolResult;

  const isFileEditTool =
    toolName?.toLowerCase().includes("edit");

  // File edit results default to expanded
  const [isExpanded, setIsExpanded] = useState(isFileEditTool);
  const [copied, setCopied] = useState(false);

  const detectedExitCode = exitCode ?? extractExitCode(output);
  const filePath = extractFilePath(toolInput) as string | null;

  const isBashTool =
    toolName?.toLowerCase().includes("bash") ||
    toolName?.toLowerCase().includes("shell");

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, [output]);

  const oldString = typeof toolInput?.old_string === "string" ? toolInput.old_string : "";
  const newString = typeof toolInput?.new_string === "string" ? toolInput.new_string : "";
  const shouldShowDiff = isFileEditTool && oldString && newString;

  const languageLabel = getLanguageLabel(filePath ?? undefined);

  return (
    <div className="bg-overlay/30 border border-border-subtle rounded-xl px-4 py-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 font-mono text-sm text-left"
      >
        {detectedExitCode !== null ? (
          <span
            className={cn(
              detectedExitCode === 0
                ? "text-accent-green"
                : "text-accent-red"
            )}
          >
            ✓ exit {detectedExitCode}
          </span>
        ) : (
          <span className={cn(isError ? "text-accent-red" : "text-accent-green")}>
            {isError ? "✗ 错误" : "✓ 完成"}
          </span>
        )}
        {/* Language badge */}
        {languageLabel && (
          <span className="inline-flex items-center rounded px-1 py-0.5 text-[0.6rem] font-semibold leading-none bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30">
            {languageLabel}
          </span>
        )}
        {!isExpanded && (
          <span className="text-text-muted/50 text-xs">(点击展开)</span>
        )}
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
            <div className="mt-2">
              {/* File path link */}
              {filePath && (
                <div className="font-mono text-xs text-accent-cyan mb-1">
                  {filePath}
                </div>
              )}

              {/* Diff view for file edits */}
              {shouldShowDiff && (
                <DiffView
                  oldText={oldString}
                  newText={newString}
                  filePath={filePath ?? undefined}
                />
              )}

              {/* Output box */}
              {output && !shouldShowDiff && (
                <div className="relative group">
                  <div className="rounded border border-border-subtle/30 bg-black/40 p-2 max-h-80 overflow-y-auto">
                    {isBashTool ? (
                      <AnsiRenderer content={output} />
                    ) : (
                      <div className="font-mono text-xs text-text-muted">
                        {isError ? `错误: ${output}` : output || "(无输出)"}
                      </div>
                    )}
                  </div>
                  {/* Copy button */}
                  <button
                    onClick={handleCopy}
                    className="absolute top-1.5 right-1.5 rounded p-1 text-text-muted/40 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-overlay/30 hover:text-text-primary"
                    title="复制输出"
                  >
                    {copied ? (
                      <span className="text-accent-green text-xs">✓</span>
                    ) : (
                      <span className="text-xs">⎘</span>
                    )}
                  </button>
                </div>
              )}

              {!output && !shouldShowDiff && (
                <div className="font-mono text-xs text-text-muted/40">
                  (无输出)
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
