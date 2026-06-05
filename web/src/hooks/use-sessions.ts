"use client";

import { useState, useCallback, useEffect } from "react";
import type { ChatConversation } from "@/types";

interface UseSessionsReturn {
  sessions: ChatConversation[];
  currentSessionId: string | null;
  isLoading: boolean;
  error: string | null;
  setCurrentSessionId: (id: string | null) => void;
  createSession: (title?: string) => Promise<ChatConversation>;
  deleteSession: (id: string) => Promise<void>;
  renameSession: (id: string, title: string) => Promise<void>;
  refreshSessions: () => Promise<void>;
}

export function useSessions(): UseSessionsReturn {
  const [sessions, setSessions] = useState<ChatConversation[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions");
      if (!res.ok) throw new Error(`Failed to fetch sessions: ${res.status}`);
      const data = await res.json();
      setSessions(
        (data as ChatConversation[]).sort(
          (a, b) => b.updatedAt - a.updatedAt
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch sessions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createSession = useCallback(
    async (title?: string): Promise<ChatConversation> => {
      setError(null);
      try {
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title || "New Chat",
          }),
        });
        if (!res.ok) throw new Error(`Failed to create session: ${res.status}`);
        const session = (await res.json()) as ChatConversation;
        setSessions((prev) => [session, ...prev]);
        setCurrentSessionId(session.id);
        return session;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create session";
        setError(message);
        throw err;
      }
    },
    []
  );

  const deleteSession = useCallback(
    async (id: string): Promise<void> => {
      setError(null);
      try {
        const res = await fetch(`/api/sessions?id=${id}`, {
          method: "DELETE",
        });
        if (!res.ok)
          throw new Error(`Failed to delete session: ${res.status}`);
        setSessions((prev) => prev.filter((s) => s.id !== id));
        if (currentSessionId === id) {
          setCurrentSessionId(sessions[0]?.id ?? null);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete session"
        );
      }
    },
    [currentSessionId, sessions]
  );

  const renameSession = useCallback(
    async (id: string, title: string): Promise<void> => {
      setError(null);
      try {
        const res = await fetch("/api/sessions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, title }),
        });
        if (!res.ok)
          throw new Error(`Failed to rename session: ${res.status}`);
        setSessions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, title } : s))
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to rename session"
        );
      }
    },
    []
  );

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  return {
    sessions,
    currentSessionId,
    isLoading,
    error,
    setCurrentSessionId,
    createSession,
    deleteSession,
    renameSession,
    refreshSessions,
  };
}
