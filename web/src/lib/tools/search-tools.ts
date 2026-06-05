/**
 * Search tools — find files and search file contents.
 *
 * - GlobTool: Find files matching glob patterns
 * - GrepTool: Search file contents using ripgrep or Node.js fallback
 */

import { exec } from "child_process";
import { resolve } from "path";
import fg from "fast-glob";
import { readFile, stat } from "fs/promises";
import { existsSync } from "fs";
import type { ToolExecutor, ToolResult } from "./registry";

const WORK_DIR = process.env.WORK_DIR || process.cwd();

// ─── GlobTool ────────────────────────────────────────────────────────────────

export const globTool: ToolExecutor = {
  name: "glob",
  description:
    "Find files matching a glob pattern. Returns a list of matching file paths.",
  parameters: {
    properties: {
      pattern: {
        type: "string",
        description:
          'Glob pattern to match files (e.g., "**/*.ts", "src/**/*.tsx")',
      },
      path: {
        type: "string",
        description: "Base directory to search in (default: WORK_DIR)",
      },
    },
    required: ["pattern"],
  },
  requiresConfirmation: false,

  async execute(params: Record<string, unknown>): Promise<ToolResult> {
    const pattern = params.pattern as string;
    const basePath = (params.path as string) || WORK_DIR;

    if (!pattern) {
      return {
        output: "",
        error: "pattern is required",
        exitCode: 1,
      };
    }

    try {
      const entries = await fg(pattern, {
        cwd: basePath,
        onlyFiles: true,
        ignore: ["node_modules", ".git", ".next"],
        absolute: false,
      });

      if (entries.length === 0) {
        return {
          output: "No files found matching the pattern.",
        };
      }

      return {
        output: entries.join("\n"),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        output: "",
        error: `Glob search failed: ${message}`,
        exitCode: 1,
      };
    }
  },
};

// ─── GrepTool ────────────────────────────────────────────────────────────────

/**
 * Check if ripgrep (rg) is available on the system.
 */
async function hasRipgrep(): Promise<boolean> {
  return new Promise((resolve) => {
    exec("which rg", (error) => {
      resolve(!error);
    });
  });
}

/**
 * Search using ripgrep — fast and feature-rich.
 */
function grepWithRipgrep(
  pattern: string,
  path: string,
  options: {
    glob?: string;
    ignoreCase?: boolean;
    maxResults?: number;
  }
): Promise<ToolResult> {
  return new Promise((resolve) => {
    let cmd = "rg";

    // Line number, no heading, no colors
    cmd += " --line-number --no-heading --color never";

    if (options.ignoreCase) cmd += " -i";
    if (options.glob) cmd += ` --glob '${options.glob.replace(/'/g, "'\\''")}'`;
    if (options.maxResults) cmd += ` --max-count ${options.maxResults}`;

    cmd += ` '${pattern.replace(/'/g, "'\\''")}' '${path}'`;

    exec(
      cmd,
      { maxBuffer: 10 * 1024 * 1024, timeout: 30_000 },
      (error, stdout, stderr) => {
        if (error && !stdout) {
          // rg returns exit code 1 when no matches found
          if (error.code === 1) {
            resolve({ output: "No matches found." });
            return;
          }
          resolve({
            output: "",
            error: stderr || error.message,
            exitCode: error.code as number,
          });
          return;
        }

        let output = stdout.trim();
        if (options.maxResults) {
          const lines = output.split("\n");
          if (lines.length > options.maxResults) {
            output =
              lines.slice(0, options.maxResults).join("\n") +
              `\n... and ${lines.length - options.maxResults} more matches`;
          }
        }

        resolve({ output });
      }
    );
  });
}

/**
 * Fallback search using Node.js line-by-line reading.
 */
async function grepWithNode(
  pattern: string,
  searchPath: string,
  options: {
    glob?: string;
    ignoreCase?: boolean;
    maxResults?: number;
  }
): Promise<ToolResult> {
  const flags = options.ignoreCase ? "i" : "";
  const regex = new RegExp(pattern, flags);
  const results: string[] = [];
  const maxResults = options.maxResults || 100;

  try {
    // Get list of files using fast-glob
    const globPattern = options.glob || "**/*";
    const files = await fg(globPattern, {
      cwd: searchPath,
      onlyFiles: true,
      ignore: ["node_modules", ".git", ".next", "*.min.js", "*.map"],
      absolute: true,
    });

    for (const file of files) {
      if (results.length >= maxResults) break;

      try {
        const content = await readFile(file, "utf-8");
        const lines = content.split("\n");
        const relativePath = resolve(file).replace(resolve(searchPath) + "/", "");

        for (let i = 0; i < lines.length; i++) {
          if (results.length >= maxResults) break;
          if (regex.test(lines[i])) {
            results.push(`${relativePath}:${i + 1}:${lines[i]}`);
          }
        }
      } catch {
        // Skip files that can't be read (binary, permissions, etc.)
      }
    }

    if (results.length === 0) {
      return { output: "No matches found." };
    }

    return { output: results.join("\n") };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      output: "",
      error: `Search failed: ${message}`,
      exitCode: 1,
    };
  }
}

export const grepTool: ToolExecutor = {
  name: "grep",
  description:
    "Search file contents for a pattern. Uses ripgrep if available, otherwise falls back to Node.js search. Returns matching lines with file paths and line numbers.",
  parameters: {
    properties: {
      pattern: {
        type: "string",
        description: "Regular expression pattern to search for",
      },
      path: {
        type: "string",
        description: "Directory or file to search in (default: WORK_DIR)",
      },
      glob: {
        type: "string",
        description: 'File glob pattern to filter (e.g., "*.ts", "*.{js,jsx}")',
      },
      ignore_case: {
        type: "boolean",
        description: "Case-insensitive search (default: false)",
      },
      max_results: {
        type: "number",
        description: "Maximum number of results to return (default: 100)",
      },
    },
    required: ["pattern"],
  },
  requiresConfirmation: false,

  async execute(params: Record<string, unknown>): Promise<ToolResult> {
    const pattern = params.pattern as string;
    const searchPath = (params.path as string) || WORK_DIR;
    const glob = params.glob as string | undefined;
    const ignoreCase = (params.ignore_case as boolean) || false;
    const maxResults = (params.max_results as number) || 100;

    if (!pattern) {
      return {
        output: "",
        error: "pattern is required",
        exitCode: 1,
      };
    }

    // If path is a file, search just that file
    if (existsSync(searchPath)) {
      const fileStat = await stat(searchPath).catch(() => null);
      if (fileStat && fileStat.isFile()) {
        try {
          const content = await readFile(searchPath, "utf-8");
          const flags = ignoreCase ? "i" : "";
          const regex = new RegExp(pattern, flags);
          const lines = content.split("\n");
          const matches = lines
            .map((line, i) => (regex.test(line) ? `${i + 1}:${line}` : null))
            .filter(Boolean) as string[];

          if (matches.length === 0) {
            return { output: "No matches found." };
          }
          return { output: matches.join("\n") };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return {
            output: "",
            error: `Failed to read file: ${message}`,
            exitCode: 1,
          };
        }
      }
    }

    // Try ripgrep first, fall back to Node.js
    const useRg = await hasRipgrep();
    if (useRg) {
      return grepWithRipgrep(pattern, searchPath, {
        glob,
        ignoreCase,
        maxResults,
      });
    }

    return grepWithNode(pattern, searchPath, {
      glob,
      ignoreCase,
      maxResults,
    });
  },
};
