import type { Session, Message } from "@/types";

const sessions = new Map<string, Session>();

export function createSession(partial?: Partial<Session>): Session {
  const now = new Date().toISOString();
  const session: Session = {
    id: crypto.randomUUID(),
    title: partial?.title || "New Chat",
    messages: partial?.messages || [],
    createdAt: partial?.createdAt || now,
    updatedAt: partial?.updatedAt || now,
    model: partial?.model || "claude-sonnet-4-20250514",
    tokenUsage: partial?.tokenUsage || { inputTokens: 0, outputTokens: 0, cost: 0 },
  };
  sessions.set(session.id, session);
  return session;
}

export function getSession(id: string): Session | undefined {
  return sessions.get(id);
}

export function updateSession(
  id: string,
  updates: Partial<Pick<Session, "title" | "messages" | "model" | "tokenUsage">>
): Session | undefined {
  const session = sessions.get(id);
  if (!session) return undefined;
  Object.assign(session, updates, { updatedAt: new Date().toISOString() });
  return session;
}

export function deleteSession(id: string): boolean {
  return sessions.delete(id);
}

export function listSessions(): Session[] {
  return Array.from(sessions.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

/**
 * Get a preview of a session (without full message content) for listing.
 */
export function listSessionPreviews(): Array<{
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  model: string;
  messageCount: number;
  lastMessage?: string;
}> {
  return listSessions().map((session) => {
    const lastMsg = session.messages[session.messages.length - 1];
    let lastMessage: string | undefined;
    if (lastMsg) {
      const textBlock = lastMsg.content.find((b) => b.type === "text");
      lastMessage = textBlock?.type === "text" ? textBlock.text.slice(0, 100) : undefined;
    }
    return {
      id: session.id,
      title: session.title,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      model: session.model,
      messageCount: session.messages.length,
      lastMessage,
    };
  });
}

/**
 * Append a message to a session and update the timestamp.
 */
export function appendMessage(id: string, message: Message): Session | undefined {
  const session = sessions.get(id);
  if (!session) return undefined;
  session.messages.push(message);
  session.updatedAt = new Date().toISOString();
  return session;
}
