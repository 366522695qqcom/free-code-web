import { Session } from "@/types";

const sessions = new Map<string, Session>();

export function listSessions(): Session[] {
  return Array.from(sessions.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getSession(id: string): Session | undefined {
  return sessions.get(id);
}

export function createSession(session: Session): Session {
  sessions.set(session.id, session);
  return session;
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
