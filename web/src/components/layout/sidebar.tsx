"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Search,
  Pencil,
  Settings,
  MessageSquare,
  Cpu,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  sessionId: string | null;
}

function groupSessionsByTime(
  sessions: ChatConversation[]
): { label: string; sessions: ChatConversation[] }[] {
  const today = new Date().setHours(0, 0, 0, 0);
  const yesterday = today - 86400000;

  const groups: { label: string; sessions: ChatConversation[] }[] = [
    { label: "今天", sessions: [] },
    { label: "昨天", sessions: [] },
    { label: "更早", sessions: [] },
  ];

  for (const session of sessions) {
    if (session.updatedAt >= today) groups[0].sessions.push(session);
    else if (session.updatedAt >= yesterday) groups[1].sessions.push(session);
    else groups[2].sessions.push(session);
  }

  return groups.filter((g) => g.sessions.length > 0);
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
  const router = useRouter();
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
    const handleClick = () =>
      setContextMenu((prev) => ({ ...prev, visible: false }));
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

  const sessionGroups = groupSessionsByTime(filteredSessions);

  // Determine active page for Activity Bar highlighting
  const isChatActive = true; // Chat is always the primary view
  const isSettingsActive = false;
  const isMcpActive = false;

  return (
    <div className="flex h-full">
      {/* Panel 1: Activity Bar (always visible, 56px) */}
      <div className="flex w-14 shrink-0 flex-col items-center border-r border-border-subtle bg-elevated py-3 gap-1">
        {/* Top icons */}
        <button
          type="button"
          onClick={() => {
            /* Already on chat page */
          }}
          className={cn(
            "size-9 rounded-lg flex items-center justify-center transition-colors duration-150",
            isChatActive
              ? "text-brand bg-brand/10"
              : "text-text-muted hover:text-text-primary hover:bg-overlay"
          )}
          title="对话"
        >
          <MessageSquare className="size-4" />
        </button>

        <button
          type="button"
          onClick={onSettingsClick}
          className={cn(
            "size-9 rounded-lg flex items-center justify-center transition-colors duration-150",
            isSettingsActive
              ? "text-brand bg-brand/10"
              : "text-text-muted hover:text-text-primary hover:bg-overlay"
          )}
          title="设置"
        >
          <Settings className="size-4" />
        </button>

        <button
          type="button"
          onClick={() => router.push("/mcp")}
          className={cn(
            "size-9 rounded-lg flex items-center justify-center transition-colors duration-150",
            isMcpActive
              ? "text-brand bg-brand/10"
              : "text-text-muted hover:text-text-primary hover:bg-overlay"
          )}
          title="MCP"
        >
          <Cpu className="size-4" />
        </button>

        {/* Collapse/Expand toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className={cn(
            "size-9 rounded-lg flex items-center justify-center transition-colors duration-150",
            "text-text-muted hover:text-text-primary hover:bg-overlay"
          )}
          title={isCollapsed ? "展开侧边栏" : "收起侧边栏"}
        >
          {isCollapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom: User avatar */}
        <button
          type="button"
          onClick={onLogout}
          className="size-9 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-overlay transition-colors duration-150"
          title="退出登录"
        >
          <div className="size-6 rounded-full bg-brand/20 text-brand flex items-center justify-center text-xs font-semibold">
            U
          </div>
        </button>
      </div>

      {/* Panel 2: Session Panel (collapsible, 224px) */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 224, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <aside className="flex h-full w-56 flex-col bg-base">
              {/* Header: Chats label + Plus button */}
              <div className="flex items-center justify-between px-3 py-3">
                <span className="text-[10px] font-medium uppercase tracking-wider text-text-subtle">
                  对话
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onCreateSession}
                  aria-label="新建对话"
                  title="新建对话"
                  className="size-7 rounded-lg text-brand hover:bg-brand/10 transition-colors duration-150"
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
                    placeholder="搜索对话..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 rounded-lg pl-8 text-xs focus-visible:ring-1 focus-visible:ring-brand"
                  />
                </div>
              </div>

              {/* Session list grouped by time */}
              <nav className="flex-1 overflow-y-auto px-2 pb-3">
                {isLoading && sessions.length === 0 ? (
                  <div className="px-3 py-4 font-mono text-xs text-text-muted">
                    加载中...
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div className="px-3 py-6 text-center text-xs text-text-muted font-mono">
                    {searchQuery ? "无匹配对话" : "暂无对话"}
                  </div>
                ) : (
                  <ul className="flex flex-col gap-0.5">
                    {sessionGroups.map((group) => (
                      <li key={group.label}>
                        {/* Group header */}
                        <div className="text-[10px] font-medium uppercase tracking-wider text-text-subtle px-3 py-1">
                          {group.label}
                        </div>
                        {/* Group sessions */}
                        {group.sessions.map((session) => {
                          const isActive = currentSessionId === session.id;
                          return (
                            <button
                              key={session.id}
                              type="button"
                              onClick={() => onSelectSession(session.id)}
                              onDoubleClick={() => handleDoubleClick(session)}
                              onContextMenu={(e) =>
                                handleContextMenu(e, session.id)
                              }
                              className={cn(
                                "group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all duration-150",
                                isActive
                                  ? "bg-brand/10 text-brand border-l-2 border-brand"
                                  : "text-text-primary/80 hover:bg-overlay/50 hover:text-text-primary"
                              )}
                            >
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
                                <span className="flex-1 truncate font-sans">
                                  {session.title}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </li>
                    ))}
                  </ul>
                )}
              </nav>
            </aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Context menu */}
      {contextMenu.visible && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 min-w-[120px] border border-border-subtle bg-elevated p-0.5 shadow-lg animate-scale-in"
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
            <span>重命名</span>
          </button>
          <button
            onClick={handleDeleteFromMenu}
            className="flex w-full items-center gap-2 px-2 py-1 text-left font-mono text-xs transition-colors hover:bg-overlay text-accent-red"
          >
            <Trash2 className="size-3" />
            <span>删除</span>
          </button>
        </div>
      )}
    </div>
  );
}
