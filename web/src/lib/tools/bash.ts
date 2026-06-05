/**
 * BashTool — executes shell commands server-side.
 *
 * Uses Node.js child_process.exec with a configurable timeout.
 * Basic command sanitization blocks obviously dangerous patterns.
 */

import { exec } from "child_process";
import type { ToolExecutor, ToolResult } from "./registry";
import type { Sandbox } from '@vercel/sandbox';

const DEFAULT_TIMEOUT_MS = 30_000;
const WORK_DIR = process.env.WORK_DIR || process.cwd();

const DANGEROUS_PATTERNS = [
  /\brm\s+-rf\s+\//,           // rm -rf /
  /\brm\s+-rf\s+\~/,           // rm -rf ~
  /\bmkfs\b/,                   // mkfs
  /\bdd\s+if=/,                 // dd if=
  />\s*\/dev\/sd/,              // write to disk device
  /\bchmod\s+-R\s+777\s+\//,   // chmod -R 777 /
  /\bsudo\s+rm\b/,              // sudo rm
  /\bshutdown\b/,               // shutdown
  /\breboot\b/,                 // reboot
  /\binit\s+[06]/,              // init 0 / init 6
  /\brm\s+--no-preserve-root/,  // rm --no-preserve-root
];

function isDangerousCommand(command: string): boolean {
  return DANGEROUS_PATTERNS.some((pattern) => pattern.test(command));
}

export const bashTool: ToolExecutor = {
  name: "bash",
  description:
    "Execute a bash command in the terminal. Returns stdout, stderr, and exit code. Use for running shell commands, scripts, and build tools.",
  parameters: {
    properties: {
      command: {
        type: "string",
        description: "The bash command to execute",
      },
      timeout: {
        type: "number",
        description:
          "Timeout in milliseconds (default: 30000, max: 120000)",
      },
      workdir: {
        type: "string",
        description: "Working directory for the command (default: WORK_DIR env or process.cwd())",
      },
    },
    required: ["command"],
  },
  requiresConfirmation: true,
  sandboxCapable: true,

  async execute(params: Record<string, unknown>): Promise<ToolResult> {
    const command = params.command as string;
    const timeout = Math.min(
      (params.timeout as number) || DEFAULT_TIMEOUT_MS,
      120_000
    );
    const cwd = (params.workdir as string) || WORK_DIR;

    if (!command || typeof command !== "string") {
      return {
        output: "",
        error: "command is required and must be a string",
        exitCode: 1,
      };
    }

    if (isDangerousCommand(command)) {
      return {
        output: "",
        error: `Command blocked for safety: "${command}". This pattern matches a known dangerous command.`,
        exitCode: 1,
      };
    }

    return new Promise((resolve) => {
      exec(
        command,
        { cwd, timeout, maxBuffer: 10 * 1024 * 1024 }, // 10MB buffer
        (error, stdout, stderr) => {
          const output = stdout || "";
          const errOutput = stderr || "";
          const exitCode = error ? error.code as number || 1 : 0;

          if (error && error.killed) {
            resolve({
              output: output,
              error: `Command timed out after ${timeout}ms`,
              exitCode: -1,
            });
            return;
          }

          resolve({
            output: output + (errOutput ? `\n[stderr]\n${errOutput}` : ""),
            error: errOutput || undefined,
            exitCode,
          });
        }
      );
    });
  },

  async executeInSandbox(params: Record<string, unknown>, sandbox: Sandbox): Promise<ToolResult> {
    const command = params.command as string;
    const cwd = (params.workdir as string) || '/vercel/sandbox';

    if (!command) {
      return { output: '', error: 'command is required', exitCode: 1 };
    }

    if (isDangerousCommand(command)) {
      return {
        output: '',
        error: `Command blocked for safety: "${command}". This pattern matches a known dangerous command.`,
        exitCode: 1,
      };
    }

    try {
      const result = await sandbox.runCommand({ cmd: 'sh', args: ['-c', command], cwd });
      const stdout = await result.stdout();
      const stderr = await result.stderr();

      return {
        output: stdout + (stderr ? `\n[stderr]\n${stderr}` : ''),
        error: stderr || undefined,
        exitCode: result.exitCode,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        output: '',
        error: `Sandbox execution failed: ${message}`,
        exitCode: 1,
      };
    }
  },
};
