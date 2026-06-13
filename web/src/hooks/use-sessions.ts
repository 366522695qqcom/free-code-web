"use client";

import { useState, useCallback, useEffect } from "react";
import type { ChatConversation, Session } from "@/types";

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

function sessionToConversation(session: Session): ChatConversation {
  return {
    id: session.id,
    title: session.title,
    messages: [],
    model: session.model,
    createdAt: new Date(session.createdAt).getTime(),
    updatedAt: new Date(session.updatedAt).getTime(),
    tokenUsage: session.tokenUsage,
  };
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
      const conversations = (Array.isArray(data) ? data : []).map(
        (s: Session) => sessionToConversation(s)
      );
      setSessions(
        conversations.sort((a, b) => b.updatedAt - a.updatedAt)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取对话列表失败");
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
            title: title || "新建对话",
          }),
        });
        if (!res.ok) throw new Error(`Failed to create session: ${res.status}`);
        const session = (await res.json()) as Session;
        const conversation = sessionToConversation(session);
        setSessions((prev) => [conversation, ...prev]);
        setCurrentSessionId(conversation.id);
        return conversation;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "创建对话失败";
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
        const res = await fetch(`/api/sessions/${id}`, {
          method: "DELETE",
        });
        if (!res.ok)
          throw new Error(`Failed to delete session: ${res.status}`);
        setSessions((prev) => prev.filter((s) => s.id !== id));
        if (currentSessionId === id) {
          setCurrentSessionId(null);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "删除对话失败"
        );
      }
    },
    [currentSessionId]
  );

  const renameSession = useCallback(
    async (id: string, title: string): Promise<void> => {
      setError(null);
      try {
        const res = await fetch(`/api/sessions/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });
        if (!res.ok)
          throw new Error(`Failed to rename session: ${res.status}`);
        setSessions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, title } : s))
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "重命名对话失败"
        );
      }
    },
    []
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
