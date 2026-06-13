"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Trash2,
  PanelLeft,
  Search,
  Pencil,
  Settings,
  Bot,
  Wrench,
  FileText,
  Cog,
  Shield,
  Info,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandHeader } from "@/components/ui/brand-header";
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

const QUICK_LINKS = [
  { href: "/settings/providers", icon: Bot, label: "Models" },
  { href: "/settings/permissions", icon: Shield, label: "Permissions" },
  { href: "/settings/tools", icon: Wrench, label: "Tools" },
  { href: "/settings/sessions", icon: FileText, label: "Sessions" },
  { href: "/mcp", icon: Cog, label: "MCP" },
  { href: "/settings", icon: Info, label: "About" },
];

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
  const [quickOpen, setQuickOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

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

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
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
      <div className="flex h-full w-12 flex-col items-center border-r border-border-subtle bg-elevated/40 py-3 gap-2">
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
    <aside className="flex w-72 flex-col border-r border-border-subtle bg-elevated/40">
      {/* Brand header + new chat */}
      <div className="flex items-center justify-between px-4 py-3">
        <BrandHeader size="sm" />
        <Button
          size="icon"
          variant="ghost"
          onClick={onCreateSession}
          aria-label="New session"
          title="New Chat"
          className="size-8 rounded-lg text-text-muted hover:bg-brand-soft hover:text-brand transition-colors duration-150"
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-text-muted pointer-events-none" />
          <Input
            type="search"
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 rounded-lg pl-8 text-xs focus-visible:ring-1 focus-visible:ring-brand"
          />
        </div>
      </div>

      {/* Quick Settings card (折叠) */}
      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={() => setQuickOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-lg border border-border-subtle bg-elevated/50 px-3 py-2 text-xs text-text-muted transition-colors hover:bg-elevated hover:text-text-primary"
        >
          <span className="flex items-center gap-2">
            <Settings className="size-3.5" />
            Quick Settings
          </span>
          {quickOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </button>
        {quickOpen && (
          <div className="mt-1 flex flex-col gap-0.5 rounded-lg border border-border-subtle bg-elevated/50 p-1 animate-collapse-in">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                      "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors duration-150",
                      active
                        ? "border-l-2 border-accent-cyan bg-accent-cyan/10 text-accent-cyan font-medium"
                        : "text-text-muted hover:bg-overlay hover:text-text-primary"
                    )}
                >
                  <Icon className="size-3.5" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Sessions label */}
      <div className="flex items-center justify-between px-4 pt-1 pb-1">
        <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">Chats</span>
        <span className="text-[10px] text-text-muted font-mono">{filteredSessions.length}</span>
      </div>

      {/* Session list */}
      <nav className="flex-1 overflow-y-auto px-2 pb-3">
        {isLoading && sessions.length === 0 ? (
          <div className="px-3 py-4 font-mono text-xs text-text-muted">
            Loading...
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-text-muted font-mono">
            {searchQuery ? "No matching chats" : "No sessions yet"}
          </div>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {filteredSessions.map((session) => {
              const isActive = currentSessionId === session.id;
              return (
                <li key={session.id}>
                  <button
                    type="button"
                    onClick={() => onSelectSession(session.id)}
                    onDoubleClick={() => handleDoubleClick(session)}
                    onContextMenu={(e) => handleContextMenu(e, session.id)}
                    className={cn(
                      "group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all duration-150",
                      isActive
                        ? "border-l-2 border-accent-cyan bg-accent-cyan/10 text-accent-cyan"
                        : "text-text-primary/80 hover:bg-overlay hover:text-text-primary"
                    )}
                  >
                    <span
                      className={cn(
                        "shrink-0 font-mono text-xs leading-none transition-colors",
                        isActive ? "text-accent-cyan" : "text-text-muted/40"
                      )}
                    >
                      {isActive ? "▌" : " "}
                    </span>
                    {editingId === session.id ? (
                      <input
                        ref={inputRef}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={handleRenameKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 border-0 border-b border-brand/50 bg-transparent px-0 py-0 font-mono text-xs outline-none"
                      />
                    ) : (
                      <span className="flex-1 truncate font-sans">{session.title}</span>
                    )}
                    <span className="shrink-0 text-[10px] text-text-muted/40 font-mono">
                      {formatRelativeTime(session.updatedAt)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      {/* Context menu */}
      {contextMenu.visible && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 min-w-[120px] border border-border-subtle bg-elevated p-0.5 shadow-lg"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <button
            onClick={handleStartRename}
            className="flex w-full items-center gap-2 px-2 py-1 text-left font-mono text-xs transition-colors hover:bg-overlay"
          >
            <Pencil className="size-3 text-text-muted" />
            <span>Rename</span>
          </button>
          <button
            onClick={handleDeleteFromMenu}
            className="flex w-full items-center gap-2 px-2 py-1 text-left font-mono text-xs transition-colors hover:bg-overlay text-accent-red"
          >
            <Trash2 className="size-3" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </aside>
  );
}
