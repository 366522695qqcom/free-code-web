/**
 * Tool registry — maps tool names to executor functions.
 *
 * Each tool implements the ToolExecutor interface with a name,
 * description, JSON Schema for parameters, and an execute function.
 */

import type { Sandbox } from '@vercel/sandbox';

export interface ToolResult {
  output: string;
  error?: string;
  exitCode?: number;
}

export interface ToolExecutor {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
  /** Whether this tool requires user confirmation before execution */
  requiresConfirmation?: boolean;
  /** Can this tool run in sandbox? */
  sandboxCapable?: boolean;
  execute: (params: Record<string, unknown>) => Promise<ToolResult>;
  /** Execute the tool within a sandbox instance */
  executeInSandbox?: (params: Record<string, unknown>, sandboxInstance: Sandbox) => Promise<ToolResult>;
}

const toolRegistry = new Map<string, ToolExecutor>();

/**
 * Register a tool in the global registry.
 */
export function registerTool(tool: ToolExecutor): void {
  toolRegistry.set(tool.name, tool);
}

/**
 * Unregister a tool from the global registry.
 */
export function unregisterTool(name: string): boolean {
  return toolRegistry.delete(name);
}

/**
 * Look up a tool by name.
 */
export function getTool(name: string): ToolExecutor | undefined {
  return toolRegistry.get(name);
}

/**
 * Get all registered tools.
 */
export function getAllTools(): ToolExecutor[] {
  return Array.from(toolRegistry.values());
}

/**
 * Get all tool definitions in a format suitable for LLM tool schemas.
 */
export function getToolDefinitions(): Array<{
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}> {
  return getAllTools().map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: {
      type: "object" as const,
      ...tool.parameters,
    },
  }));
}
