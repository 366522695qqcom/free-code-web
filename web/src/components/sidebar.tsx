"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, MessageSquare, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChatConversation } from "@/types";

interface SidebarProps {
  sessions: ChatConversation[];
  currentSessionId: string | null;
  isLoading: boolean;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, title: string) => void;
  onClose: () => void;
}

function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function Sidebar({
  sessions,
  currentSessionId,
  isLoading,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onRenameSession,
  onClose,
}: SidebarProps) {
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

  return (
    <div className="flex h-full flex-col border-r border-border bg-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-3">
        <h2 className="text-sm font-medium text-sidebar-foreground">Chats</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onCreateSession}
            title="New Chat"
          >
            <Plus className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            title="Close sidebar"
            className="md:hidden"
          >
            <PanelLeftClose className="size-4" />
          </Button>
        </div>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && sessions.length === 0 ? (
          <div className="px-3 py-8 text-center text-xs text-muted-foreground">
            Loading...
          </div>
        ) : sessions.length === 0 ? (
          <div className="px-3 py-8 text-center text-xs text-muted-foreground">
            No conversations yet
          </div>
        ) : (
          <div className="space-y-0.5 p-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "group flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors cursor-pointer",
                  currentSessionId === session.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
                onClick={() => onSelectSession(session.id)}
                onDoubleClick={() => handleDoubleClick(session)}
              >
                <MessageSquare className="size-3.5 shrink-0 opacity-50" />
                <div className="min-w-0 flex-1">
                  {editingId === session.id ? (
                    <input
                      ref={inputRef}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={handleRenameSubmit}
                      onKeyDown={handleKeyDown}
                      className="w-full rounded border border-border bg-background px-1 py-0.5 text-sm outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="block truncate">{session.title}</span>
                  )}
                  <span className="block text-[0.65rem] text-muted-foreground/60">
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
                  className="shrink-0 opacity-0 group-hover:opacity-100"
                  title="Delete chat"
                >
                  <Trash2 className="size-3 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
