import { useMemo } from "react";
import type { EnhancedMessage } from "./use-chat";

export interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "directory";
  status?: "added" | "modified" | "read";
  children: FileTreeNode[];
}

export interface FlatFileEntry {
  path: string;
  status: "added" | "modified" | "read";
}

const FILE_WRITE_TOOLS = new Set(["file_write", "write"]);
const FILE_EDIT_TOOLS = new Set(["file_edit", "edit", "multiEdit"]);
const FILE_READ_TOOLS = new Set(["file_read", "read"]);

function isFileWriteTool(name: string): boolean {
  return FILE_WRITE_TOOLS.has(name);
}

function isFileEditTool(name: string): boolean {
  return FILE_EDIT_TOOLS.has(name);
}

function isFileReadTool(name: string): boolean {
  return FILE_READ_TOOLS.has(name);
}

function extractFilePath(input: Record<string, unknown>): string | null {
  const path = input.file_path || input.path;
  if (typeof path === "string" && path.length > 0) {
    return path;
  }
  return null;
}

function buildTree(flatFiles: FlatFileEntry[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];

  // Sort files by path for consistent ordering
  const sorted = [...flatFiles].sort((a, b) => a.path.localeCompare(b.path));

  for (const entry of sorted) {
    const parts = entry.path.split("/").filter(Boolean);
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join("/");

      if (isFile) {
        currentLevel.push({
          name: part,
          path: currentPath,
          type: "file",
          status: entry.status,
          children: [],
        });
      } else {
        let existingDir = currentLevel.find(
          (n) => n.type === "directory" && n.name === part
        );
        if (!existingDir) {
          existingDir = {
            name: part,
            path: currentPath,
            type: "directory",
            children: [],
          };
          currentLevel.push(existingDir);
        }
        currentLevel = existingDir.children;
      }
    }
  }

  // Sort: directories first, then files; alphabetically within each group
  function sortNodes(nodes: FileTreeNode[]): FileTreeNode[] {
    return nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
      return a.name.localeCompare(b.name);
    }).map((node) => ({
      ...node,
      children: sortNodes(node.children),
    }));
  }

  return sortNodes(root);
}

export function useFileTree(messages: EnhancedMessage[]): {
  tree: FileTreeNode[];
  flatFiles: FlatFileEntry[];
} {
  const { tree, flatFiles } = useMemo(() => {
    const fileStatusMap = new Map<string, FlatFileEntry["status"]>();

    for (const message of messages) {
      if (!message.contentBlocks) continue;

      for (const block of message.contentBlocks) {
        if (block.type !== "tool_use" || !block.toolUse) continue;

        const { name, input } = block.toolUse;
        const filePath = extractFilePath(input);
        if (!filePath) continue;

        if (isFileReadTool(name)) {
          // Only mark as read if we haven't seen a write/edit for this file
          if (!fileStatusMap.has(filePath)) {
            fileStatusMap.set(filePath, "read");
          }
        } else if (isFileWriteTool(name)) {
          if (!fileStatusMap.has(filePath)) {
            fileStatusMap.set(filePath, "added");
          }
          // If already exists as "read", upgrade to "added"
          else if (fileStatusMap.get(filePath) === "read") {
            fileStatusMap.set(filePath, "added");
          }
        } else if (isFileEditTool(name)) {
          if (!fileStatusMap.has(filePath)) {
            fileStatusMap.set(filePath, "added");
          } else if (fileStatusMap.get(filePath) !== "read") {
            fileStatusMap.set(filePath, "modified");
          } else {
            fileStatusMap.set(filePath, "added");
          }
        }
      }
    }

    const flatFiles: FlatFileEntry[] = Array.from(fileStatusMap.entries()).map(
      ([path, status]) => ({ path, status })
    );

    const tree = buildTree(flatFiles);

    return { tree, flatFiles };
  }, [messages]);

  return { tree, flatFiles };
}
