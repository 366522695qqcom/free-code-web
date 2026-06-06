/**
 * Session store backed by Turso (SQLite).
 *
 * Sessions and messages are persisted in the database.
 * Messages are stored as JSON in a TEXT column.
 */

import { v4 as uuidv4 } from "uuid";
import type { InValue } from "@libsql/client";
import { getDb, initDb } from "@/lib/db";
import type { Session, Message, Usage } from "@/types";

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

function rowToSession(row: Record<string, unknown>): Session {
  return {
    id: row.id as string,
    title: row.title as string,
    model: row.model as string,
    messages: JSON.parse(row.messages as string) as Message[],
    tokenUsage: {
      inputTokens: row.input_tokens as number,
      outputTokens: row.output_tokens as number,
      cacheCreationInputTokens: row.cache_creation_input_tokens as number,
      cacheReadInputTokens: row.cache_read_input_tokens as number,
      cost: row.cost as number,
    },
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function createSession(options?: {
  title?: string;
  model?: string;
}): Promise<Session> {
  await initDb();
  const db = getDb();

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

  await db.execute({
    sql: `INSERT INTO sessions (id, title, model, messages, input_tokens, output_tokens, cache_creation_input_tokens, cache_read_input_tokens, cost, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [session.id, session.title, session.model, "[]", 0, 0, 0, 0, 0, now, now],
  });

  return session;
}

export async function getSession(id: string): Promise<Session | undefined> {
  await initDb();
  const db = getDb();

  const result = await db.execute({
    sql: "SELECT * FROM sessions WHERE id = ?",
    args: [id],
  });

  if (result.rows.length === 0) return undefined;
  return rowToSession(result.rows[0] as Record<string, unknown>);
}

export async function updateSessionMessages(
  id: string,
  messages: Message[]
): Promise<Session | undefined> {
  await initDb();
  const db = getDb();

  const now = new Date().toISOString();
  await db.execute({
    sql: "UPDATE sessions SET messages = ?, updated_at = ? WHERE id = ?",
    args: [JSON.stringify(messages), now, id],
  });

  return getSession(id);
}

export async function updateSessionUsage(
  id: string,
  usage: Partial<Usage>
): Promise<Session | undefined> {
  const session = await getSession(id);
  if (!session) return undefined;

  const merged: Usage = {
    inputTokens: usage.inputTokens ?? session.tokenUsage.inputTokens,
    outputTokens: usage.outputTokens ?? session.tokenUsage.outputTokens,
    cacheCreationInputTokens: usage.cacheCreationInputTokens ?? session.tokenUsage.cacheCreationInputTokens,
    cacheReadInputTokens: usage.cacheReadInputTokens ?? session.tokenUsage.cacheReadInputTokens,
    cost: usage.cost ?? session.tokenUsage.cost,
  };

  const now = new Date().toISOString();
  const db = getDb();
  await db.execute({
    sql: `UPDATE sessions SET input_tokens = ?, output_tokens = ?, cache_creation_input_tokens = ?, cache_read_input_tokens = ?, cost = ?, updated_at = ? WHERE id = ?`,
    args: [merged.inputTokens, merged.outputTokens, merged.cacheCreationInputTokens, merged.cacheReadInputTokens, merged.cost, now, id],
  });

  return getSession(id);
}

export async function updateSession(
  id: string,
  updates: Partial<Pick<Session, "title" | "messages" | "model" | "tokenUsage">>
): Promise<Session | undefined> {
  const session = await getSession(id);
  if (!session) return undefined;

  const now = new Date().toISOString();
  const db = getDb();

  const sets: string[] = ["updated_at = ?"];
  const args: InValue[] = [now];

  if (updates.title !== undefined) { sets.push("title = ?"); args.push(updates.title); }
  if (updates.model !== undefined) { sets.push("model = ?"); args.push(updates.model); }
  if (updates.messages !== undefined) { sets.push("messages = ?"); args.push(JSON.stringify(updates.messages)); }
  if (updates.tokenUsage !== undefined) {
    sets.push("input_tokens = ?");
    args.push(updates.tokenUsage.inputTokens);
    sets.push("output_tokens = ?");
    args.push(updates.tokenUsage.outputTokens);
    sets.push("cache_creation_input_tokens = ?");
    args.push(updates.tokenUsage.cacheCreationInputTokens);
    sets.push("cache_read_input_tokens = ?");
    args.push(updates.tokenUsage.cacheReadInputTokens);
    sets.push("cost = ?");
    args.push(updates.tokenUsage.cost);
  }

  args.push(id);
  await db.execute({ sql: `UPDATE sessions SET ${sets.join(", ")} WHERE id = ?`, args });

  return getSession(id);
}

export async function deleteSession(id: string): Promise<boolean> {
  await initDb();
  const db = getDb();

  const result = await db.execute({
    sql: "DELETE FROM sessions WHERE id = ?",
    args: [id],
  });

  return result.rowsAffected > 0;
}

export async function listSessions(): Promise<Session[]> {
  await initDb();
  const db = getDb();

  const result = await db.execute({
    sql: "SELECT * FROM sessions ORDER BY updated_at DESC",
    args: [],
  });

  return result.rows.map((row) => rowToSession(row as Record<string, unknown>));
}
