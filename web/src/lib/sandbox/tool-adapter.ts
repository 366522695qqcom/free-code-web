/**
 * Sandbox tool adapter — routes tool calls to sandbox when enabled.
 *
 * Integrates the permission system (assessRisk) with the sandbox manager
 * to decide how each tool invocation should be executed.
 */

import { assessRisk } from '@/lib/permissions';
import { sandboxManager, getSandboxConfig } from '@/lib/sandbox';
import type { RiskLevel } from '@/lib/permissions';
import type { Sandbox } from '@vercel/sandbox';
import type { ToolResult } from '@/lib/tools/registry';
import { getTool } from '@/lib/tools/registry';

export interface ToolExecutionRequest {
  toolName: string;
  params: Record<string, unknown>;
  sessionId?: string;
}

export interface ToolExecutionDecision {
  execute: boolean;
  riskLevel: RiskLevel;
  needsConfirmation: boolean;
  sandboxEnabled: boolean;
  reason: string;
}

/**
 * Assess whether a tool call should proceed and how.
 *
 * 1. Get sandbox config (is it enabled?)
 * 2. Call assessRisk(toolName, params, sandboxEnabled)
 * 3. If riskLevel is 'low': auto-approve, no confirmation needed
 * 4. If riskLevel is 'high': needs confirmation
 * 5. If riskLevel is 'outside-sandbox': needs special confirmation (runs on host, not sandbox)
 */
export function assessToolExecution(request: ToolExecutionRequest): ToolExecutionDecision {
  const config = getSandboxConfig();
  const sandboxEnabled = config.enabled;

  const decision = assessRisk(request.toolName, request.params, sandboxEnabled);

  const needsConfirmation = decision.riskLevel !== 'low';

  return {
    execute: true,
    riskLevel: decision.riskLevel,
    needsConfirmation,
    sandboxEnabled,
    reason: decision.reason,
  };
}

/**
 * Execute a tool, routing to sandbox if enabled.
 *
 * 1. Get the tool from registry
 * 2. If sandbox is enabled AND tool is sandboxCapable AND risk is not 'outside-sandbox':
 *    - Get sandbox instance for the session
 *    - Call tool.executeInSandbox(params, sandboxInstance) if available
 *    - Otherwise fall back to tool.execute(params) but log a warning
 * 3. If sandbox is not enabled OR risk is 'outside-sandbox':
 *    - Call tool.execute(params) directly on host
 * 4. Return ToolResult
 */
export async function executeToolWithSandbox(
  request: ToolExecutionRequest,
  sandboxInstance?: Sandbox
): Promise<ToolResult> {
  const tool = getTool(request.toolName);

  if (!tool) {
    return {
      output: '',
      error: `Unknown tool: ${request.toolName}`,
      exitCode: 1,
    };
  }

  const config = getSandboxConfig();
  const sandboxEnabled = config.enabled;
  const decision = assessRisk(request.toolName, request.params, sandboxEnabled);

  // Determine if we should execute in sandbox
  const shouldUseSandbox =
    sandboxEnabled &&
    tool.sandboxCapable === true &&
    decision.riskLevel !== 'outside-sandbox';

  if (shouldUseSandbox) {
    // Get sandbox instance — either passed in or from the manager
    let sandbox = sandboxInstance;
    if (!sandbox && request.sessionId) {
      sandbox = (await sandboxManager.getSandboxInstance(request.sessionId)) ?? undefined;
    }

    if (sandbox) {
      if (tool.executeInSandbox) {
        return tool.executeInSandbox(request.params, sandbox);
      } else {
        // Tool is sandboxCapable but has no executeInSandbox — fall back with warning
        console.warn(
          `Tool "${request.toolName}" is sandboxCapable but has no executeInSandbox method. Falling back to host execution.`
        );
        return tool.execute(request.params);
      }
    } else {
      // No sandbox instance available — deny execution for safety
      return {
        output: '',
        error: `Sandbox is enabled but no instance available for session "${request.sessionId}". Execution denied for safety.`,
        exitCode: 1,
      };
    }
  }

  // Execute on host (sandbox not enabled, or risk is 'outside-sandbox', or tool not sandboxCapable)
  return tool.execute(request.params);
}
