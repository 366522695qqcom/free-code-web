/**
 * File operation tools — read, write, and edit files server-side.
 *
 * - FileReadTool: Read file content with optional line range
 * - FileWriteTool: Write file content, creating dirs as needed
 * - FileEditTool: Search/replace editing with diff output
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { dirname, resolve, isAbsolute, normalize } from "path";
import { diffLines } from "diff";
import type { ToolExecutor, ToolResult } from "./registry";
import type { Sandbox } from '@vercel/sandbox';

const WORK_DIR = process.env.WORK_DIR || (process.env.VERCEL ? '/tmp' : process.cwd());

function resolvePath(filePath: string): string {
  // H-2: reject absolute paths (would allow reading /etc/passwd, etc.)
  if (isAbsolute(filePath)) {
    throw new Error(`Absolute paths are not allowed: ${filePath}`);
  }
  // H-2: reject path traversal attempts (../ or ..)
  const normalized = normalize(filePath);
  if (normalized.startsWith("..")) {
    throw new Error(`Path traversal detected: ${filePath}`);
  }
  return resolve(WORK_DIR, normalized);
}

// ─── FileReadTool ────────────────────────────────────────────────────────────

export const fileReadTool: ToolExecutor = {
  name: "file_read",
  description:
    "Read the contents of a file. Supports reading specific line ranges with offset and limit parameters.",
  parameters: {
    properties: {
      path: {
        type: "string",
        description: "Path to the file to read (relative to WORK_DIR or absolute)",
      },
      offset: {
        type: "number",
        description: "Line number to start reading from (1-based, default: 1)",
      },
      limit: {
        type: "number",
        description: "Maximum number of lines to read (default: all lines)",
      },
    },
    required: ["path"],
  },
  requiresConfirmation: false,
  sandboxCapable: true,

  async execute(params: Record<string, unknown>): Promise<ToolResult> {
    const filePath = resolvePath(params.path as string);
    const offset = (params.offset as number) || 1;
    const limit = params.limit as number | undefined;

    if (!existsSync(filePath)) {
      return {
        output: "",
        error: `File not found: ${filePath}`,
        exitCode: 1,
      };
    }

    try {
      const content = await readFile(filePath, "utf-8");
      const lines = content.split("\n");

      const startLine = Math.max(1, offset) - 1; // Convert to 0-based
      const endLine = limit !== undefined ? startLine + limit : lines.length;
      const selectedLines = lines.slice(startLine, endLine);

      // Add line numbers
      const numbered = selectedLines
        .map((line, i) => `${startLine + i + 1}→${line}`)
        .join("\n");

      return {
        output: numbered,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        output: "",
        error: `Failed to read file: ${message}`,
        exitCode: 1,
      };
    }
  },

  async executeInSandbox(params: Record<string, unknown>, sandbox: Sandbox): Promise<ToolResult> {
    const rawPath = params.path as string;
    const filePath = rawPath.startsWith("/") ? rawPath : `/vercel/sandbox/${rawPath}`;
    const offset = (params.offset as number) || 1;
    const limit = params.limit as number | undefined;

    try {
      const content = await sandbox.fs.readFile(filePath, "utf-8");
      const lines = content.split("\n");

      const startLine = Math.max(1, offset) - 1;
      const endLine = limit !== undefined ? startLine + limit : lines.length;
      const selectedLines = lines.slice(startLine, endLine);

      const numbered = selectedLines
        .map((line: string, i: number) => `${startLine + i + 1}→${line}`)
        .join("\n");

      return { output: numbered };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        output: "",
        error: `Failed to read file in sandbox: ${message}`,
        exitCode: 1,
      };
    }
  },
};

// ─── FileWriteTool ───────────────────────────────────────────────────────────

export const fileWriteTool: ToolExecutor = {
  name: "file_write",
  description:
    "Write content to a file. Creates the file and any parent directories if they don't exist.",
  parameters: {
    properties: {
      path: {
        type: "string",
        description: "Path to the file to write (relative to WORK_DIR or absolute)",
      },
      content: {
        type: "string",
        description: "The content to write to the file",
      },
    },
    required: ["path", "content"],
  },
  requiresConfirmation: true,
  sandboxCapable: true,

  async execute(params: Record<string, unknown>): Promise<ToolResult> {
    const filePath = resolvePath(params.path as string);
    const content = params.content as string;

    if (content === undefined || content === null) {
      return {
        output: "",
        error: "content is required",
        exitCode: 1,
      };
    }

    try {
      const dir = dirname(filePath);
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }

      await writeFile(filePath, content, "utf-8");

      return {
        output: `Successfully wrote ${content.length} bytes to ${filePath}`,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        output: "",
        error: `Failed to write file: ${message}`,
        exitCode: 1,
      };
    }
  },

  async executeInSandbox(params: Record<string, unknown>, sandbox: Sandbox): Promise<ToolResult> {
    const rawPath = params.path as string;
    const filePath = rawPath.startsWith("/") ? rawPath : `/vercel/sandbox/${rawPath}`;
    const content = params.content as string;

    if (content === undefined || content === null) {
      return { output: "", error: "content is required", exitCode: 1 };
    }

    try {
      const dir = dirname(filePath);
      await sandbox.fs.mkdir(dir, { recursive: true });
      await sandbox.fs.writeFile(filePath, content, "utf-8");

      return {
        output: `Successfully wrote ${content.length} bytes to ${filePath}`,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        output: "",
        error: `Failed to write file in sandbox: ${message}`,
        exitCode: 1,
      };
    }
  },
};

// ─── FileEditTool ────────────────────────────────────────────────────────────

export const fileEditTool: ToolExecutor = {
  name: "file_edit",
  description:
    "Edit a file by replacing an exact string match (old_string) with new_string. Returns a diff of the changes. The old_string must exist uniquely in the file.",
  parameters: {
    properties: {
      path: {
        type: "string",
        description: "Path to the file to edit (relative to WORK_DIR or absolute)",
      },
      old_string: {
        type: "string",
        description: "The exact text to find and replace in the file",
      },
      new_string: {
        type: "string",
        description: "The text to replace old_string with",
      },
    },
    required: ["path", "old_string", "new_string"],
  },
  requiresConfirmation: true,
  sandboxCapable: true,

  async execute(params: Record<string, unknown>): Promise<ToolResult> {
    const filePath = resolvePath(params.path as string);
    const oldString = params.old_string as string;
    const newString = params.new_string as string;

    if (!existsSync(filePath)) {
      return {
        output: "",
        error: `File not found: ${filePath}`,
        exitCode: 1,
      };
    }

    if (oldString === newString) {
      return {
        output: "",
        error: "old_string and new_string are identical — no change needed",
        exitCode: 1,
      };
    }

    try {
      const content = await readFile(filePath, "utf-8");

      if (!content.includes(oldString)) {
        return {
          output: "",
          error: `old_string not found in ${filePath}. Make sure the string matches exactly, including whitespace and indentation.`,
          exitCode: 1,
        };
      }

      // Check for uniqueness
      const firstIndex = content.indexOf(oldString);
      const secondIndex = content.indexOf(oldString, firstIndex + 1);
      if (secondIndex !== -1) {
        return {
          output: "",
          error: `old_string appears multiple times in ${filePath}. Provide more context to make it unique.`,
          exitCode: 1,
        };
      }

      const newContent = content.replace(oldString, newString);
      await writeFile(filePath, newContent, "utf-8");

      // Generate diff
      const changes = diffLines(oldString, newString);
      const diffOutput = changes
        .map((change) => {
          const prefix = change.added ? "+" : change.removed ? "-" : " ";
          return change.value
            .split("\n")
            .filter((line) => line !== "")
            .map((line) => `${prefix}${line}`)
            .join("\n");
        })
        .join("\n");

      return {
        output: `Successfully edited ${filePath}\n\nDiff:\n${diffOutput}`,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        output: "",
        error: `Failed to edit file: ${message}`,
        exitCode: 1,
      };
    }
  },

  async executeInSandbox(params: Record<string, unknown>, sandbox: Sandbox): Promise<ToolResult> {
    const rawPath = params.path as string;
    const filePath = rawPath.startsWith("/") ? rawPath : `/vercel/sandbox/${rawPath}`;
    const oldString = params.old_string as string;
    const newString = params.new_string as string;

    if (oldString === newString) {
      return {
        output: "",
        error: "old_string and new_string are identical — no change needed",
        exitCode: 1,
      };
    }

    try {
      const content = await sandbox.fs.readFile(filePath, "utf-8");

      if (!content.includes(oldString)) {
        return {
          output: "",
          error: `old_string not found in ${filePath}. Make sure the string matches exactly, including whitespace and indentation.`,
          exitCode: 1,
        };
      }

      // Check for uniqueness
      const firstIndex = content.indexOf(oldString);
      const secondIndex = content.indexOf(oldString, firstIndex + 1);
      if (secondIndex !== -1) {
        return {
          output: "",
          error: `old_string appears multiple times in ${filePath}. Provide more context to make it unique.`,
          exitCode: 1,
        };
      }

      const newContent = content.replace(oldString, newString);
      await sandbox.fs.writeFile(filePath, newContent, "utf-8");

      // Generate diff
      const changes = diffLines(oldString, newString);
      const diffOutput = changes
        .map((change) => {
          const prefix = change.added ? "+" : change.removed ? "-" : " ";
          return change.value
            .split("\n")
            .filter((line) => line !== "")
            .map((line) => `${prefix}${line}`)
            .join("\n");
        })
        .join("\n");

      return {
        output: `Successfully edited ${filePath}\n\nDiff:\n${diffOutput}`,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        output: "",
        error: `Failed to edit file in sandbox: ${message}`,
        exitCode: 1,
      };
    }
  },
};
