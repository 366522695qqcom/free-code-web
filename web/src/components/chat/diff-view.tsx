"use client";

import { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import hljs from "highlight.js";
import { cn } from "@/lib/utils";

interface DiffViewProps {
  oldText: string;
  newText: string;
  filePath?: string;
  maxCollapsedLines?: number;
}

interface DiffLine {
  type: "add" | "remove" | "unchanged";
  content: string;
  oldLineNum?: number;
  newLineNum?: number;
}

/** Map file extension to a short language label for badges */
export function getLanguageLabel(filePath?: string): string | undefined {
  if (!filePath) return undefined;
  const ext = filePath.split(".").pop()?.toLowerCase();
  const labelMap: Record<string, string> = {
    ts: "TS", tsx: "TSX", js: "JS", jsx: "JSX",
    py: "Python", css: "CSS", html: "HTML", json: "JSON",
    md: "MD", rs: "Rust", go: "Go", sql: "SQL",
  };
  return ext ? labelMap[ext] : undefined;
}

/** Map file extension to highlight.js language name */
export function getLanguageFromPath(filePath?: string): string | undefined {
  if (!filePath) return undefined;
  const ext = filePath.split(".").pop()?.toLowerCase();
  const extMap: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    css: "css",
    html: "xml",
    json: "json",
    md: "markdown",
    rs: "rust",
    go: "go",
    sql: "sql",
  };
  return ext ? extMap[ext] : undefined;
}

function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const result: DiffLine[] = [];

  let oldIdx = 0;
  let newIdx = 0;
  let oldLineNum = 1;
  let newLineNum = 1;

  // Simple line-by-line diff using LCS-like approach
  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    const oldLine = oldLines[oldIdx];
    const newLine = newLines[newIdx];

    if (oldIdx >= oldLines.length) {
      // Only new lines remain
      result.push({ type: "add", content: newLine, newLineNum: newLineNum++ });
      newIdx++;
    } else if (newIdx >= newLines.length) {
      // Only old lines remain
      result.push({ type: "remove", content: oldLine, oldLineNum: oldLineNum++ });
      oldIdx++;
    } else if (oldLine === newLine) {
      // Unchanged line
      result.push({
        type: "unchanged",
        content: oldLine,
        oldLineNum: oldLineNum++,
        newLineNum: newLineNum++,
      });
      oldIdx++;
      newIdx++;
    } else if (newSet.has(oldLine) && !oldSet.has(newLine)) {
      // New line was inserted
      result.push({ type: "add", content: newLine, newLineNum: newLineNum++ });
      newIdx++;
    } else if (oldSet.has(newLine) && !newSet.has(oldLine)) {
      // Old line was removed
      result.push({ type: "remove", content: oldLine, oldLineNum: oldLineNum++ });
      oldIdx++;
    } else {
      // Lines differ — show as remove + add
      result.push({ type: "remove", content: oldLine, oldLineNum: oldLineNum++ });
      result.push({ type: "add", content: newLine, newLineNum: newLineNum++ });
      oldIdx++;
      newIdx++;
    }
  }

  return result;
}

/** Highlight a line of code using highlight.js, returning HTML string */
function highlightLine(content: string, language?: string): string {
  if (!content.trim()) return "";
  try {
    if (language) {
      return hljs.highlight(content, { language }).value;
    }
    return hljs.highlightAuto(content).value;
  } catch {
    // Fallback: escape HTML
    return content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

export function DiffView({
  oldText,
  newText,
  filePath,
  maxCollapsedLines = 10,
}: DiffViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const language = getLanguageFromPath(filePath);

  const diffLines = useMemo(() => computeDiff(oldText, newText), [oldText, newText]);
  const hasMore = diffLines.length > maxCollapsedLines;
  const visibleLines = isExpanded
    ? diffLines
    : diffLines.slice(0, maxCollapsedLines);

  const addCount = diffLines.filter((l) => l.type === "add").length;
  const removeCount = diffLines.filter((l) => l.type === "remove").length;

  // Compute max line number width for alignment
  const maxLineNum = Math.max(
    ...visibleLines.map((l) => l.oldLineNum ?? l.newLineNum ?? 0),
    1
  );
  const lineNumWidth = String(maxLineNum).length;

  return (
    <div className="rounded-lg border border-border/50 bg-black/40 overflow-hidden">
      {/* Header */}
      {(filePath || hasMore) && (
        <div className="flex items-center justify-between border-b border-border/30 px-3 py-1.5">
          {filePath && (
            <span className="font-mono text-xs text-terminal-cyan truncate">
              {filePath}
            </span>
          )}
          <div className="flex items-center gap-3 ml-auto">
            <span className="font-mono text-xs text-terminal-green">
              +{addCount}
            </span>
            <span className="font-mono text-xs text-terminal-red">
              -{removeCount}
            </span>
          </div>
        </div>
      )}

      {/* Diff content */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-mono text-xs leading-5">
          <tbody>
            {visibleLines.map((line, idx) => {
              const highlighted = highlightLine(line.content, language);
              return (
                <tr
                  key={idx}
                  className={cn(
                    line.type === "add" && "bg-terminal-green/10",
                    line.type === "remove" && "bg-terminal-red/10"
                  )}
                >
                  {/* Line number */}
                  <td
                    className={cn(
                      "select-none border-r px-1 text-right text-muted-foreground/40",
                      line.type === "add" && "border-terminal-green/30",
                      line.type === "remove" && "border-terminal-red/30",
                      line.type === "unchanged" && "border-border/20"
                    )}
                    style={{ width: `${Math.max(lineNumWidth, 3) + 1.5}ch` }}
                  >
                    {line.type === "add"
                      ? line.newLineNum
                      : line.type === "remove"
                        ? line.oldLineNum
                        : line.oldLineNum ?? ""}
                  </td>
                  {/* Prefix */}
                  <td
                    className={cn(
                      "w-4 select-none text-center border-r",
                      line.type === "add" && "border-terminal-green/30",
                      line.type === "remove" && "border-terminal-red/30",
                      line.type === "unchanged" && "border-border/20"
                    )}
                  >
                    {line.type === "add" && (
                      <span className="text-terminal-green">+</span>
                    )}
                    {line.type === "remove" && (
                      <span className="text-terminal-red">-</span>
                    )}
                    {line.type === "unchanged" && (
                      <span className="text-muted-foreground/20"> </span>
                    )}
                  </td>
                  {/* Content with syntax highlighting */}
                  <td
                    className={cn(
                      "px-2 whitespace-pre",
                      line.type === "add" && "text-terminal-green border-l-2 border-terminal-green/50",
                      line.type === "remove" && "text-terminal-red border-l-2 border-terminal-red/50",
                      line.type === "unchanged" && "text-muted-foreground/60"
                    )}
                    dangerouslySetInnerHTML={
                      highlighted
                        ? { __html: highlighted }
                        : undefined
                    }
                  >
                    {!highlighted ? line.content : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Expand/collapse */}
      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-center gap-1 border-t border-border/30 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/20 hover:text-foreground"
        >
          <ChevronDown
            className={cn(
              "size-3 transition-transform",
              isExpanded && "rotate-180"
            )}
          />
          {isExpanded
            ? "Show less"
            : `Show ${diffLines.length - maxCollapsedLines} more lines`}
        </button>
      )}
    </div>
  );
}
