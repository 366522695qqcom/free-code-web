"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";
import { useSessions } from "@/hooks/use-sessions";
import { ChatArea } from "@/components/chat/chat-area";
import { SessionSidebar } from "@/components/sidebar/session-sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Terminal } from "lucide-react";

export default function Home() {
  const { isAuthenticated, isLoading: authLoading, user, logout } = useAuth();
  const {
    sessions,
    currentSessionId,
    isLoading: sessionsLoading,
    setCurrentSessionId,
    createSession,
    deleteSession,
    renameSession,
  } = useSessions();
  const { messages, isStreaming, sendMessage, stopStreaming, setMessages } =
    useChat(currentSessionId);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Auto-create session if none exists
  useEffect(() => {
    if (!authLoading && isAuthenticated && sessions.length === 0 && !sessionsLoading) {
      createSession();
    }
  }, [authLoading, isAuthenticated, sessions.length, sessionsLoading, createSession]);

  // Load messages when switching sessions
  useEffect(() => {
    if (currentSessionId) {
      // In a real implementation, fetch messages from the API
      // For now, clear messages when switching sessions
      setMessages([]);
    }
  }, [currentSessionId, setMessages]);

  const handleSend = useCallback(
    async (content: string) => {
      if (!currentSessionId) {
        const session = await createSession();
        // After creating session, send the message
        // This is handled by the useChat hook which watches sessionId
      }
      sendMessage(content);
    },
    [currentSessionId, createSession, sendMessage]
  );

  const handleNewSession = useCallback(async () => {
    const session = await createSession();
    setCurrentSessionId(session.id);
  }, [createSession, setCurrentSessionId]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-terminal-bg">
        <div className="text-terminal-dim text-xs font-mono">
          <span className="text-terminal-green">&gt;</span> authenticating
          <span className="animate-cursor-blink">_</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return null;
  }

  const currentSession = sessions.find((s) => s.id === currentSessionId);

  return (
    <div className="flex h-screen bg-terminal-bg text-foreground font-mono">
      {/* Sidebar */}
      <SessionSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        isLoading={sessionsLoading}
        isCollapsed={sidebarCollapsed}
        onSelectSession={setCurrentSessionId}
        onCreateSession={handleNewSession}
        onDeleteSession={deleteSession}
        onRenameSession={renameSession}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-terminal-border px-4 py-1.5">
          <div className="flex items-center gap-2">
            <Terminal className="size-3.5 text-terminal-green" />
            <span className="text-xs text-terminal-dim font-mono">
              {currentSession ? currentSession.title : "free-code"}
            </span>
            {isStreaming && (
              <span className="text-[0.6rem] text-terminal-yellow animate-pulse">
                ● streaming
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <span className="text-[0.65rem] text-terminal-dim font-mono">
                {user.username}@free-code
              </span>
            )}
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={logout}
              className="text-terminal-dim hover:text-terminal-red"
              title="Logout"
            >
              <LogOut className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Chat area */}
        <ChatArea
          messages={messages}
          isStreaming={isStreaming}
          onSend={handleSend}
          onStop={stopStreaming}
        />
      </div>
    </div>
  );
}
