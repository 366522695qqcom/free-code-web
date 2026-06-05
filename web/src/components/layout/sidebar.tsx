"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  PanelLeftClose,
  PanelLeft,
  Search,
  Pencil,
  X,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChatConversation } from "@/types";

interface SidebarProps {
  sessions: ChatConversation[];
  currentSessionId: string | null;
  isLoading: boolean;
  isCollapsed: boolean;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, title: string) => void;
  onToggleCollapse: () => void;
  onSettingsClick: () => void;
  onLogout: () => void;
}

function formatRelativeTime(ts: number): string {
  const now = Date.now();
  const diffMs = now - ts;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return "1d";
  if (diffDays < 7) return `${diffDays}d`;

  const date = new Date(ts);
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  sessionId: string | null;
}

export function Sidebar({
  sessions,
  currentSessionId,
  isLoading,
  isCollapsed,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onRenameSession,
  onToggleCollapse,
  onSettingsClick,
  onLogout,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    sessionId: null,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu((prev) => ({ ...prev, visible: false }));
    if (contextMenu.visible) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [contextMenu.visible]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, sessionId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        sessionId,
      });
    },
    []
  );

  const handleStartRename = useCallback(() => {
    const session = sessions.find((s) => s.id === contextMenu.sessionId);
    if (session) {
      setEditingId(session.id);
      setEditTitle(session.title);
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, [contextMenu.sessionId, sessions]);

  const handleDeleteFromMenu = useCallback(() => {
    if (contextMenu.sessionId) {
      onDeleteSession(contextMenu.sessionId);
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, [contextMenu.sessionId, onDeleteSession]);

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

  const filteredSessions = searchQuery.trim()
    ? sessions.filter((s) =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sessions;

  if (isCollapsed) {
    return (
      <div className="flex h-full w-12 flex-col items-center border-r border-border bg-sidebar py-3 gap-2">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onToggleCollapse}
          title="Expand sidebar"
        >
          <PanelLeft className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onCreateSession}
          title="New Chat"
        >
          <Plus className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h2 className="font-mono text-xs font-medium text-sidebar-foreground/60">Chats</h2>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onSettingsClick}
            title="Settings"
          >
            <Settings className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onLogout}
            title="Sign out"
          >
            <LogOut className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onCreateSession}
            title="New Chat"
          >
            <Plus className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onToggleCollapse}
            title="Collapse sidebar"
          >
            <PanelLeftClose className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-1.5">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground/50" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full border-0 border-b border-border/50 bg-transparent py-1 pl-7 pr-7 font-mono text-xs text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-terminal-cyan/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      {/* Session list — flat terminal style */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && sessions.length === 0 ? (
          <div className="px-3 py-4 font-mono text-xs text-muted-foreground">
            Loading...
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="px-3 py-4 font-mono text-xs text-muted-foreground">
            {searchQuery ? "No matching chats" : "No conversations yet"}
          </div>
        ) : (
          <div className="py-1">
            {filteredSessions.map((session) => {
              const isActive = currentSessionId === session.id;
              return (
                <div
                  key={session.id}
                  className={cn(
                    "group flex items-center gap-1 px-3 py-1.5 font-mono text-xs transition-colors cursor-pointer",
                    isActive
                      ? "text-foreground"
                      : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80"
                  )}
                  onClick={() => onSelectSession(session.id)}
                  onDoubleClick={() => handleDoubleClick(session)}
                  onContextMenu={(e) => handleContextMenu(e, session.id)}
                >
                  {/* Active indicator: > prefix in terminal-cyan */}
                  <span className={cn(
                    "shrink-0 w-3 text-right select-none",
                    isActive ? "text-terminal-cyan" : "text-transparent"
                  )}>
                    &gt;
                  </span>
                  <div className="min-w-0 flex-1 flex items-center gap-2">
                    {editingId === session.id ? (
                      <input
                        ref={inputRef}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={handleKeyDown}
                        className="w-full border-0 border-b border-terminal-cyan/50 bg-transparent px-0 py-0 font-mono text-xs outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="block truncate">{session.title}</span>
                    )}
                    <span className="shrink-0 text-[0.6rem] text-muted-foreground/30">
                      {formatRelativeTime(session.updatedAt)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="shrink-0 opacity-0 group-hover:opacity-100 h-4 w-4"
                    title="Delete chat"
                  >
                    <Trash2 className="size-2.5 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenu.visible && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 min-w-[120px] border border-border bg-popover p-0.5 shadow-lg"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <button
            onClick={handleStartRename}
            className="flex w-full items-center gap-2 px-2 py-1 text-left font-mono text-xs transition-colors hover:bg-accent"
          >
            <Pencil className="size-3 text-muted-foreground" />
            <span>Rename</span>
          </button>
          <button
            onClick={handleDeleteFromMenu}
            className="flex w-full items-center gap-2 px-2 py-1 text-left font-mono text-xs transition-colors hover:bg-accent text-destructive"
          >
            <Trash2 className="size-3" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}
