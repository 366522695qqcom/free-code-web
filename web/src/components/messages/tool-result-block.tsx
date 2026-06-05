"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { AnsiRenderer } from "@/components/chat/ansi-renderer";
import { DiffView } from "@/components/chat/diff-view";

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { output, isError, toolName, toolInput, exitCode } = toolResult;

  const detectedExitCode = exitCode ?? extractExitCode(output);
  const filePath = extractFilePath(toolInput) as string | null;

  const isBashTool =
    toolName?.toLowerCase().includes("bash") ||
    toolName?.toLowerCase().includes("shell");
  const isFileEditTool =
    toolName?.toLowerCase().includes("edit");

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

  return (
    <div className="pl-4 py-0.5">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 font-mono text-sm text-left"
      >
        {detectedExitCode !== null ? (
          <span
            className={cn(
              detectedExitCode === 0
                ? "text-terminal-green"
                : "text-terminal-red"
            )}
          >
            ✓ exit {detectedExitCode}
          </span>
        ) : (
          <span className={cn(isError ? "text-terminal-red" : "text-terminal-green")}>
            {isError ? "✗ error" : "✓ done"}
          </span>
        )}
        {!isExpanded && (
          <span className="text-muted-foreground/50 text-xs">(click to expand)</span>
        )}
      </button>

      {isExpanded && (
        <div className="animate-collapse-in mt-1">
          {/* File path link */}
          {filePath && (
            <div className="font-mono text-xs text-terminal-cyan mb-1">
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
              <div className="rounded border border-border/30 bg-black/40 p-2 max-h-80 overflow-y-auto">
                {isBashTool ? (
                  <AnsiRenderer content={output} />
                ) : (
                  <div className="terminal-output text-muted-foreground">
                    {isError ? `Error: ${output}` : output || "(no output)"}
                  </div>
                )}
              </div>
              {/* Copy button */}
              <button
                onClick={handleCopy}
                className="absolute top-1.5 right-1.5 rounded p-1 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted/30 hover:text-foreground"
                title="Copy output"
              >
                {copied ? (
                  <span className="text-terminal-green text-xs">✓</span>
                ) : (
                  <span className="text-xs">⎘</span>
                )}
              </button>
            </div>
          )}

          {!output && !shouldShowDiff && (
            <div className="terminal-output text-muted-foreground/40 text-xs">
              (no output)
            </div>
          )}
        </div>
      )}
    </div>
  );
}
