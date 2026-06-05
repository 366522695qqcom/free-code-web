"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
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

export function DiffView({
  oldText,
  newText,
  filePath,
  maxCollapsedLines = 10,
}: DiffViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const diffLines = computeDiff(oldText, newText);
  const hasMore = diffLines.length > maxCollapsedLines;
  const visibleLines = isExpanded
    ? diffLines
    : diffLines.slice(0, maxCollapsedLines);

  const addCount = diffLines.filter((l) => l.type === "add").length;
  const removeCount = diffLines.filter((l) => l.type === "remove").length;

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
            {visibleLines.map((line, idx) => (
              <tr
                key={idx}
                className={cn(
                  line.type === "add" && "bg-terminal-green/10",
                  line.type === "remove" && "bg-terminal-red/10"
                )}
              >
                {/* Line numbers */}
                <td className="w-8 select-none border-r border-border/20 px-1 text-right text-muted-foreground/30">
                  {line.type === "add"
                    ? line.newLineNum
                    : line.type === "remove"
                      ? line.oldLineNum
                      : line.oldLineNum ?? ""}
                </td>
                <td className="w-8 select-none border-r border-border/20 px-1 text-right text-muted-foreground/30">
                  {line.type === "remove"
                    ? ""
                    : line.type === "add"
                      ? line.newLineNum
                      : line.newLineNum ?? ""}
                </td>
                {/* Prefix */}
                <td className="w-4 select-none text-center">
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
                {/* Content */}
                <td
                  className={cn(
                    "px-2 whitespace-pre",
                    line.type === "add" && "text-terminal-green",
                    line.type === "remove" && "text-terminal-red",
                    line.type === "unchanged" && "text-muted-foreground/60"
                  )}
                >
                  {line.content}
                </td>
              </tr>
            ))}
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
