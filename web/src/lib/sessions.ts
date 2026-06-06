/**
 * In-memory session store.
 *
 * Uses a Map for now — can be upgraded to SQLite or another
 * persistent store later without changing the API surface.
 */

import { v4 as uuidv4 } from "uuid";
import type { Session, Message, Usage } from "@/types";

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

const sessions = new Map<string, Session>();

/**
 * Create a new session with a unique ID.
 */
export function createSession(options?: {
  title?: string;
  model?: string;
}): Session {
  const now = new Date().toISOString();
  const session: Session = {
    id: uuidv4(),
    title: options?.title || "New Chat",
    messages: [],
    createdAt: now,
    updatedAt: now,
    model: options?.model || DEFAULT_MODEL,
    tokenUsage: { inputTokens: 0, outputTokens: 0, cacheCreationInputTokens: 0, cacheReadInputTokens: 0, cost: 0 },
  };
  sessions.set(session.id, session);
  return session;
}

/**
 * Get a session by ID.
 */
export function getSession(id: string): Session | undefined {
  return sessions.get(id);
}

/**
 * Update a session's messages.
 */
export function updateSessionMessages(
  id: string,
  messages: Message[]
): Session | undefined {
  const session = sessions.get(id);
  if (!session) return undefined;
  session.messages = messages;
  session.updatedAt = new Date().toISOString();
  return session;
}

/**
 * Update a session's token usage.
 */
export function updateSessionUsage(
  id: string,
  usage: Partial<Usage>
): Session | undefined {
  const session = sessions.get(id);
  if (!session) return undefined;
  session.tokenUsage = {
    inputTokens: usage.inputTokens ?? session.tokenUsage.inputTokens,
    outputTokens: usage.outputTokens ?? session.tokenUsage.outputTokens,
    cacheCreationInputTokens: usage.cacheCreationInputTokens ?? session.tokenUsage.cacheCreationInputTokens,
    cacheReadInputTokens: usage.cacheReadInputTokens ?? session.tokenUsage.cacheReadInputTokens,
    cost: usage.cost ?? session.tokenUsage.cost,
  };
  session.updatedAt = new Date().toISOString();
  return session;
}

/**
 * Update session properties (title, model, messages, tokenUsage).
 */
export function updateSession(
  id: string,
  updates: Partial<Pick<Session, "title" | "messages" | "model" | "tokenUsage">>
): Session | undefined {
  const session = sessions.get(id);
  if (!session) return undefined;
  Object.assign(session, updates, { updatedAt: new Date().toISOString() });
  return session;
}

/**
 * Delete a session by ID.
 */
export function deleteSession(id: string): boolean {
  return sessions.delete(id);
}

/**
 * List all sessions, sorted by last modified (most recent first).
 */
export function listSessions(): Session[] {
  return Array.from(sessions.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}
