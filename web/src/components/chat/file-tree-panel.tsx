"use client";

import { useState, useCallback } from "react";
import { ChevronRight, ChevronDown, File, Folder } from "lucide-react";
import type { FileTreeNode } from "@/hooks/use-file-tree";

interface FileTreePanelProps {
  tree: FileTreeNode[];
  onFileClick: (path: string) => void;
}

function StatusDot({ status }: { status?: "added" | "modified" | "read" }) {
  if (!status || status === "read") return null;

  const colorClass =
    status === "added"
      ? "text-terminal-green"
      : "text-terminal-amber";

  return <span className={`${colorClass} text-[0.5rem] leading-none`}>●</span>;
}

function TreeNode({
  node,
  depth,
  onFileClick,
}: {
  node: FileTreeNode;
  depth: number;
  onFileClick: (path: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleClick = useCallback(() => {
    if (node.type === "directory") {
      setIsExpanded((prev) => !prev);
    } else {
      onFileClick(node.path);
    }
  }, [node, onFileClick]);

  const indent = depth * 12;

  if (node.type === "directory") {
    return (
      <div>
        <button
          onClick={handleClick}
          className="flex w-full items-center gap-1 py-0.5 text-left font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
          style={{ paddingLeft: indent }}
        >
          {isExpanded ? (
            <ChevronDown className="size-3 shrink-0" />
          ) : (
            <ChevronRight className="size-3 shrink-0" />
          )}
          <Folder className="size-3 shrink-0 text-muted-foreground/60" />
          <span className="truncate">{node.name}/</span>
        </button>
        {isExpanded && (
          <div>
            {node.children.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                onFileClick={onFileClick}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="flex w-full items-center gap-1 py-0.5 text-left font-mono text-xs hover:text-foreground transition-colors"
      style={{ paddingLeft: indent + 12 }}
    >
      <File className="size-3 shrink-0 text-muted-foreground/40" />
      <span
        className={`truncate ${
          node.status === "read"
            ? "text-muted-foreground/40"
            : "text-muted-foreground"
        }`}
      >
        {node.name}
      </span>
      <StatusDot status={node.status} />
    </button>
  );
}

export function FileTreePanel({ tree, onFileClick }: FileTreePanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (tree.length === 0) return null;

  return (
    <div className="flex h-full flex-col border-r border-border bg-sidebar w-[200px] shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-2 py-1.5">
        <span className="font-mono text-[0.65rem] font-medium text-muted-foreground/60 uppercase tracking-wider">
          Files
        </span>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-muted-foreground/40 hover:text-foreground transition-colors"
          title={isCollapsed ? "Expand file tree" : "Collapse file tree"}
        >
          {isCollapsed ? (
            <ChevronRight className="size-3" />
          ) : (
            <ChevronDown className="size-3" />
          )}
        </button>
      </div>

      {/* Tree content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto py-1 px-1">
          {tree.map((node) => (
            <TreeNode
              key={node.path}
              node={node}
              depth={0}
              onFileClick={onFileClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
