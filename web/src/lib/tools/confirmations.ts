/**
 * Tool confirmation management.
 *
 * Handles the permission flow for tools that require user confirmation
 * before execution. Pending confirmations are stored in memory.
 */

interface PendingConfirmation {
  toolCallId: string;
  approved: boolean;
  resolved: boolean;
  timestamp: number;
}

const pendingConfirmations = new Map<string, PendingConfirmation>();

const MAX_AGE = 10 * 60 * 1000; // 10 minutes

// Cleanup old confirmations periodically
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of pendingConfirmations) {
      if (now - value.timestamp > MAX_AGE) {
        pendingConfirmations.delete(key);
      }
    }
  }, 60_000);
}

startCleanup();

/**
 * Set a pending confirmation for a tool call.
 * Called by the agentic stream when a tool needs confirmation.
 */
export function setPendingConfirmation(toolCallId: string): void {
  pendingConfirmations.set(toolCallId, {
    toolCallId,
    approved: false,
    resolved: false,
    timestamp: Date.now(),
  });
}

/**
 * Resolve a pending confirmation.
 * Called by the confirm API endpoint when the user approves/denies.
 */
export function resolveConfirmation(
  toolCallId: string,
  approved: boolean
): boolean {
  const confirmation = pendingConfirmations.get(toolCallId);
  if (!confirmation) return false;

  confirmation.approved = approved;
  confirmation.resolved = true;
  return true;
}

/**
 * Wait for a confirmation to be resolved.
 * Returns true if approved, false if denied or timed out.
 */
export async function waitForConfirmation(
  toolCallId: string,
  timeoutMs: number = 60_000
): Promise<boolean> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const confirmation = pendingConfirmations.get(toolCallId);
    if (confirmation?.resolved) {
      pendingConfirmations.delete(toolCallId);
      return confirmation.approved;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  pendingConfirmations.delete(toolCallId);
  return false;
}

/**
 * Check if a confirmation exists for a tool call.
 */
export function hasPendingConfirmation(toolCallId: string): boolean {
  const confirmation = pendingConfirmations.get(toolCallId);
  return !!confirmation && !confirmation.resolved;
}
