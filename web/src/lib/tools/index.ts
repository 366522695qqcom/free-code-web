/**
 * Tool registration entry point.
 *
 * Imports all tool implementations and registers them
 * in the global tool registry.
 */

import { registerTool } from "./registry";
import { bashTool } from "./bash";
import { fileReadTool, fileWriteTool, fileEditTool } from "./file-tools";
import { globTool, grepTool } from "./search-tools";
import { webFetchTool, webSearchTool } from "./web-tools";

let initialized = false;

/**
 * Register all built-in tools. Safe to call multiple times —
 * subsequent calls are no-ops.
 */
export function initializeTools(): void {
  if (initialized) return;
  initialized = true;

  registerTool(bashTool);
  registerTool(fileReadTool);
  registerTool(fileWriteTool);
  registerTool(fileEditTool);
  registerTool(globTool);
  registerTool(grepTool);
  registerTool(webFetchTool);
  registerTool(webSearchTool);
}

export { registerTool, unregisterTool, getTool, getAllTools, getToolDefinitions } from "./registry";
export type { ToolExecutor, ToolResult } from "./registry";
