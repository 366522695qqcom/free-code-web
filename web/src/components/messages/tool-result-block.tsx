"use client";

import { useState, useCallback } from "react";
import { ChevronRight, FileOutput, Copy, Check, ExternalLink } from "lucide-react";
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
  // Try to find exit code pattern in output
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

  // For file edit tool, try to show diff view
  const oldString = typeof toolInput?.old_string === "string" ? toolInput.old_string : "";
  const newString = typeof toolInput?.new_string === "string" ? toolInput.new_string : "";
  const shouldShowDiff = isFileEditTool && oldString && newString;

  return (
    <div
      className={cn(
        "rounded-lg border border-border/50",
        isError ? "bg-terminal-red/5 border-terminal-red/20" : "bg-muted/10"
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
        <FileOutput
          className={cn(
            "size-3.5 shrink-0",
            isError ? "text-terminal-red" : "text-terminal-green"
          )}
        />
        <span className="font-mono text-sm text-muted-foreground">
          {isError ? "Error Output" : "Output"}
        </span>

        {/* Exit code indicator */}
        {detectedExitCode !== null && (
          <span
            className={cn(
              "ml-auto font-mono text-xs px-1.5 py-0.5 rounded",
              detectedExitCode === 0
                ? "text-terminal-green bg-terminal-green/10"
                : "text-terminal-red bg-terminal-red/10"
            )}
          >
            exit {detectedExitCode}
          </span>
        )}
      </button>

      {isExpanded ? (
        <div className="animate-collapse-in border-t border-border/50 px-3 py-2 space-y-2">
          {/* File path link */}
          {filePath ? (
            <div className="flex items-center gap-1.5">
              <ExternalLink className="size-3 text-terminal-cyan/60" />
              <span className="font-mono text-xs text-terminal-cyan truncate">
                {filePath}
              </span>
            </div>
          ) : null}

          {/* Diff view for file edits */}
          {shouldShowDiff && (
            <DiffView
              oldText={oldString}
              newText={newString}
              filePath={filePath ?? undefined}
            />
          )}

          {/* ANSI-rendered output for bash tools, plain for others */}
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
                  <Check className="size-3 text-terminal-green" />
                ) : (
                  <Copy className="size-3" />
                )}
              </button>
            </div>
          )}

          {!output && !shouldShowDiff && (
            <div className="terminal-output rounded border border-border/30 bg-black/40 p-2 text-muted-foreground/40">
              (no output)
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
