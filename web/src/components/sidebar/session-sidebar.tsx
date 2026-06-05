"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, MessageSquare, PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChatConversation } from "@/types";

interface SessionSidebarProps {
  sessions: ChatConversation[];
  currentSessionId: string | null;
  isLoading: boolean;
  isCollapsed: boolean;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, title: string) => void;
  onToggleCollapse: () => void;
}

function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function SessionSidebar({
  sessions,
  currentSessionId,
  isLoading,
  isCollapsed,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onRenameSession,
  onToggleCollapse,
}: SessionSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleDoubleClick = (session: ChatConversation) => {
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleRenameSubmit = () => {
    if (editingId && editTitle.trim()) {
      onRenameSession(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRenameSubmit();
    } else if (e.key === "Escape") {
      setEditingId(null);
    }
  };

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center border-r border-terminal-border bg-sidebar py-3 gap-2">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onToggleCollapse}
          title="Expand sidebar"
          className="text-terminal-dim hover:text-terminal-green"
        >
          <PanelLeft className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onCreateSession}
          title="New Chat"
          className="text-terminal-dim hover:text-terminal-green"
        >
          <Plus className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-64 flex-col border-r border-terminal-border bg-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-terminal-border px-3 py-2">
        <h2 className="text-[0.7rem] text-terminal-dim uppercase tracking-wider font-mono">
          ═══ Sessions ═══
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onCreateSession}
            title="New Chat"
            className="text-terminal-dim hover:text-terminal-green"
          >
            <Plus className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onToggleCollapse}
            title="Collapse sidebar"
            className="text-terminal-dim hover:text-terminal-green"
          >
            <PanelLeftClose className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && sessions.length === 0 ? (
          <div className="px-3 py-8 text-center text-xs text-terminal-dim font-mono">
            loading...
          </div>
        ) : sessions.length === 0 ? (
          <div className="px-3 py-8 text-center text-xs text-terminal-dim font-mono">
            no sessions
          </div>
        ) : (
          <div className="space-y-px p-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "group flex items-center gap-2 px-2 py-1.5 text-xs transition-colors cursor-pointer border",
                  currentSessionId === session.id
                    ? "border-terminal-green/30 bg-terminal-green/5 text-terminal-green"
                    : "border-transparent text-muted-foreground/70 hover:bg-terminal-surface/50 hover:text-foreground"
                )}
                onClick={() => onSelectSession(session.id)}
                onDoubleClick={() => handleDoubleClick(session)}
              >
                <MessageSquare className="size-3 shrink-0 opacity-50" />
                <div className="min-w-0 flex-1">
                  {editingId === session.id ? (
                    <input
                      ref={inputRef}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={handleRenameSubmit}
                      onKeyDown={handleKeyDown}
                      className="w-full rounded border border-terminal-border bg-terminal-bg px-1 py-0.5 text-xs outline-none focus:border-terminal-green"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="block truncate font-mono">{session.title}</span>
                  )}
                  <span className="block text-[0.6rem] text-terminal-dim font-mono">
                    {formatTimestamp(session.updatedAt)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="shrink-0 opacity-0 group-hover:opacity-100 text-terminal-dim hover:text-terminal-red"
                  title="Delete chat"
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
