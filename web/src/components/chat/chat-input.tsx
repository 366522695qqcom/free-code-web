"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  type KeyboardEvent,
} from "react";
import { Shield, ShieldCheck, ShieldAlert, ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateTokenWarningState } from "@/lib/context";
import type { Usage } from "@/types";

/** 四档权限模式 — 参考 Claude Code 权限体系 */
export type PermissionMode =
  | "default"
  | "plan"
  | "acceptEdits"
  | "bypassPermissions";

interface ModeOption {
  value: PermissionMode;
  label: string;
  icon: React.ReactNode;
  coreBehavior: string;
  useCase: string;
  riskLevel: string;
  riskColor: string;
}

const MODE_OPTIONS: ModeOption[] = [
  {
    value: "default",
    label: "default",
    icon: <Shield className="size-4" />,
    coreBehavior: "标准模式，逐一询问。AI 默认只能调用只读工具。所有写操作和命令执行都需经过你的逐一批准。",
    useCase: "日常开发中最常用的模式，在安全和效率之间取得了最佳平衡。",
    riskLevel: "低（完全可控）",
    riskColor: "text-green-500",
  },
  {
    value: "plan",
    label: "plan",
    icon: <ShieldCheck className="size-4" />,
    coreBehavior: "规划模式，只读+计划。行为类似 default，但 AI 更倾向于制定行动计划，而不是直接执行或给出最终答案。",
    useCase: "复杂的重构、新功能规划、在动手前需要深度思考的场景。",
    riskLevel: "极低",
    riskColor: "text-green-400",
  },
  {
    value: "acceptEdits",
    label: "acceptEdits",
    icon: <ShieldAlert className="size-4" />,
    coreBehavior: "自动批准文件编辑。AI 可以自动执行文件编辑类操作（Edit, Write），无需你批准。但 Bash 等高风险命令仍需你批准。",
    useCase: "修复大量 Linter 错误、进行机械性的、可预期的代码格式化或重构。",
    riskLevel: "中等（需谨慎）",
    riskColor: "text-yellow-500",
  },
  {
    value: "bypassPermissions",
    label: "bypassPermissions",
    icon: <ShieldOff className="size-4" />,
    coreBehavior: "跳过所有权限提示。AI 将无需任何批准，自动执行所有操作，包括 Bash 命令。即官方文档中的\"YOLO 模式\"。",
    useCase: "极高风险，仅应在完全隔离的、无网络访问的容器化环境（如 Dev Container）中使用。",
    riskLevel: "极高",
    riskColor: "text-red-500",
  },
];

function formatCost(cost: number): string {
  if (cost < 0.01 && cost > 0) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}

interface FileEntry {
  path: string;
  type: "file" | "dir";
}

interface ChatInputProps {
  onSend: (content: string) => void;
  onStop: () => void;
  onSlashCommand: (command: string, args: string) => void;
  isStreaming: boolean;
  disabled?: boolean;
  /** 当前选中的权限模式 */
  permissionMode?: PermissionMode;
  /** 权限模式变更回调 */
  onPermissionModeChange?: (mode: PermissionMode) => void;
  /** 当前模型名称（用于状态栏显示） */
  currentModelName?: string;
  /** 当前模型 ID（如 claude-sonnet-4-20250514，用于阈值计算） */
  currentModelId?: string;
  /** 用量数据（用于状态栏显示） */
  usage?: Usage;
  /** 上下文窗口使用百分比 */
  contextPercentage?: number;
  /** 打开 Provider 管理对话框 */
  onProviderDialogOpen?: () => void;
}

export function ChatInput({
  onSend,
  onStop,
  onSlashCommand,
  isStreaming,
  disabled,
  permissionMode = "default",
  onPermissionModeChange,
  currentModelName = "claude-sonnet-4",
  currentModelId,
  usage,
  contextPercentage,
  onProviderDialogOpen,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // @ file autocomplete state
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [fileResults, setFileResults] = useState<FileEntry[]>([]);
  const [fileSelectedIndex, setFileSelectedIndex] = useState(0);
  const [atPosition, setAtPosition] = useState(-1); // cursor position when @ was typed
  const fileMenuRef = useRef<HTMLDivElement>(null);
  const fileFetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Command history
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const savedValueRef = useRef("");
  const [historyLen, setHistoryLen] = useState(0);
  const [historyPos, setHistoryPos] = useState(-1);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [value]);

  // Detect "/" to show mode selector
  useEffect(() => {
    if (value === "/") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowModeMenu(true);
      setSelectedIndex(0);
      setShowFileMenu(false);
    } else {
      setShowModeMenu(false);
    }
  }, [value]);

  // Reset selected index when menu toggles
  useEffect(() => {
    if (showModeMenu) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedIndex(0);
    }
  }, [showModeMenu]);

  // @ file autocomplete: detect @ and fetch files
  useEffect(() => {
    if (showModeMenu) {
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);

    // Find the last @ that isn't preceded by another @ (i.e., start of a file reference)
    const atIdx = textBeforeCursor.lastIndexOf("@");
    if (atIdx === -1) {
      setShowFileMenu(false);
      setAtPosition(-1);
      return;
    }

    // Check there's a space or start of string before @, or it's the first char
    if (atIdx > 0 && textBeforeCursor[atIdx - 1] !== " " && textBeforeCursor[atIdx - 1] !== "\n") {
      setShowFileMenu(false);
      return;
    }

    // Extract the prefix after @
    const prefix = textBeforeCursor.substring(atIdx + 1);

    // If there's a space after @, it's not a file reference anymore
    if (prefix.includes(" ")) {
      setShowFileMenu(false);
      return;
    }

    setAtPosition(atIdx);

    // Debounce fetch
    if (fileFetchTimerRef.current) {
      clearTimeout(fileFetchTimerRef.current);
    }

    fileFetchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/files?prefix=${encodeURIComponent(prefix)}`);
        if (res.ok) {
          const data = await res.json();
          const files: FileEntry[] = data.files || [];
          setFileResults(files);
          setShowFileMenu(files.length > 0);
          setFileSelectedIndex(0);
        }
      } catch {
        // Ignore fetch errors
      }
    }, 150);

    return () => {
      if (fileFetchTimerRef.current) {
        clearTimeout(fileFetchTimerRef.current);
      }
    };
  }, [value, showModeMenu]);

  const handleSelectMode = useCallback(
    (mode: PermissionMode) => {
      onPermissionModeChange?.(mode);
      setShowModeMenu(false);
      setValue("");
      textareaRef.current?.focus();
    },
    [onPermissionModeChange]
  );

  const handleSelectFile = useCallback(
    (file: FileEntry) => {
      if (atPosition === -1) return;

      const before = value.substring(0, atPosition);
      const afterAt = value.substring(atPosition + 1);
      // Find where the current prefix ends (next space or end of string)
      const spaceIdx = afterAt.indexOf(" ");
      const after = spaceIdx !== -1 ? afterAt.substring(spaceIdx) : "";

      const suffix = file.type === "dir" ? "/" : " ";
      const newValue = `${before}@${file.path}${suffix}${after}`;
      setValue(newValue);

      setShowFileMenu(false);
      setAtPosition(-1);
      setFileResults([]);
      setFileSelectedIndex(0);

      // Focus and set cursor position
      requestAnimationFrame(() => {
        const textarea = textareaRef.current;
        if (textarea) {
          const newCursorPos = before.length + 1 + file.path.length + suffix.length;
          textarea.focus();
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }
      });
    },
    [value, atPosition]
  );

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;

    // Add to history
    historyRef.current = [...historyRef.current, trimmed];
    historyIndexRef.current = historyRef.current.length;
    savedValueRef.current = "";
    setHistoryLen(historyRef.current.length);
    setHistoryPos(historyRef.current.length);

    // Handle slash commands (non-mode commands like /clear, /help)
    if (trimmed.startsWith("/") && trimmed !== "/") {
      const parts = trimmed.split(/\s+/);
      const cmd = parts[0];
      const args = parts.slice(1).join(" ");
      onSlashCommand(cmd, args);
      setValue("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      return;
    }

    onSend(trimmed);
    setValue("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, onSend, onSlashCommand]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Ctrl+C to stop streaming
      if (e.key === "c" && e.ctrlKey && isStreaming) {
        e.preventDefault();
        onStop();
        return;
      }

      // File autocomplete navigation
      if (showFileMenu) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setFileSelectedIndex((prev) =>
            prev < fileResults.length - 1 ? prev + 1 : 0
          );
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setFileSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : fileResults.length - 1
          );
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          const selected = fileResults[fileSelectedIndex];
          if (selected) {
            handleSelectFile(selected);
          }
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setShowFileMenu(false);
          return;
        }
      }

      if (showModeMenu) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < MODE_OPTIONS.length - 1 ? prev + 1 : 0
          );
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : MODE_OPTIONS.length - 1
          );
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          const selected = MODE_OPTIONS[selectedIndex];
          handleSelectMode(selected.value);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setShowModeMenu(false);
          setValue("");
          return;
        }
        // Any other key when showing mode menu: hide menu and let typing continue
        setShowModeMenu(false);
      }

      // Command history navigation (only when not showing mode menu or file menu)
      if (!showModeMenu && !showFileMenu && !isStreaming) {
        if (e.key === "ArrowUp" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
          // Only navigate history if cursor is at the start of the textarea
          const textarea = textareaRef.current;
          if (textarea && textarea.selectionStart === 0 && textarea.selectionEnd === 0) {
            e.preventDefault();
            const history = historyRef.current;
            if (history.length === 0) return;
            // Save current input when first going up
            if (historyIndexRef.current === history.length) {
              savedValueRef.current = value;
            }
            const newIndex = Math.max(0, historyIndexRef.current - 1);
            historyIndexRef.current = newIndex;
            setHistoryPos(newIndex);
            setValue(history[newIndex]);
            return;
          }
        }
        if (e.key === "ArrowDown" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
          const textarea = textareaRef.current;
          if (textarea && textarea.selectionStart === value.length && textarea.selectionEnd === value.length) {
            e.preventDefault();
            const history = historyRef.current;
            const newIndex = Math.min(history.length, historyIndexRef.current + 1);
            historyIndexRef.current = newIndex;
            setHistoryPos(newIndex);
            if (newIndex === history.length) {
              setValue(savedValueRef.current);
            } else {
              setValue(history[newIndex]);
            }
            return;
          }
        }
      }

      // Enter to send, Shift+Enter for newline
      if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend, showModeMenu, showFileMenu, selectedIndex, fileSelectedIndex, fileResults, handleSelectMode, handleSelectFile, isStreaming, onStop, value]
  );

  // Scroll selected item into view (mode menu)
  useEffect(() => {
    if (showModeMenu && menuRef.current) {
      const selectedEl = menuRef.current.querySelector(
        `[data-mode-index="${selectedIndex}"]`
      );
      selectedEl?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, showModeMenu]);

  // Scroll selected item into view (file menu)
  useEffect(() => {
    if (showFileMenu && fileMenuRef.current) {
      const selectedEl = fileMenuRef.current.querySelector(
        `[data-file-index="${fileSelectedIndex}"]`
      );
      selectedEl?.scrollIntoView({ block: "nearest" });
    }
  }, [fileSelectedIndex, showFileMenu]);

  /** 当前模式的标签 */
  const currentModeLabel = MODE_OPTIONS.find(
    (m) => m.value === permissionMode
  )?.label;

  // History position indicator
  const historyIndicator =
    historyLen > 0
      ? `↑${historyLen - historyPos}↓${historyPos}`
      : "";

  const cost = usage?.cost ?? 0;

  // Context display — use buffer-based thresholds like CC
  const totalInputTokens = (usage?.inputTokens ?? 0) + (usage?.cacheCreationInputTokens ?? 0) + (usage?.cacheReadInputTokens ?? 0);
  const warningState = calculateTokenWarningState(totalInputTokens, currentModelId ?? "claude-sonnet-4-20250514");
  const ctxPct = contextPercentage ?? 0;
  const ctxColor = warningState.isAboveErrorThreshold
    ? "text-destructive"
    : warningState.isAboveWarningThreshold
      ? "text-yellow-500"
      : "text-muted-foreground/50";

  return (
    <div className="relative">
      {/* File Autocomplete Menu */}
      {showFileMenu && fileResults.length > 0 && (
        <div
          ref={fileMenuRef}
          className="absolute bottom-full left-0 right-0 mb-1 border border-border bg-popover shadow-xl overflow-hidden z-50 max-h-60 overflow-y-auto"
        >
          <div className="border-b border-border bg-muted/20 px-3 py-1 flex items-center justify-between">
            <span className="text-[0.65rem] text-muted-foreground/60">Files</span>
            <div className="flex items-center gap-2 text-[0.6rem] text-muted-foreground/40">
              <kbd className="border border-border px-1">↑↓</kbd>
              <span>navigate</span>
              <span>·</span>
              <kbd className="border border-border px-1">Tab</kbd>
              <span>select</span>
              <span>·</span>
              <kbd className="border border-border px-1">Esc</kbd>
              <span>close</span>
            </div>
          </div>
          {fileResults.map((file, idx) => (
            <button
              key={file.path}
              data-file-index={idx}
              onClick={() => handleSelectFile(file)}
              onMouseEnter={() => setFileSelectedIndex(idx)}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors border-b border-border last:border-b-0",
                idx === fileSelectedIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/30"
              )}
            >
              <span
                className={cn(
                  "font-mono text-xs shrink-0",
                  file.type === "dir" ? "text-terminal-cyan" : "text-muted-foreground/60"
                )}
              >
                {file.type === "dir" ? "📁" : "📄"}
              </span>
              <span className="font-mono text-xs truncate">{file.path}</span>
              {file.type === "dir" && (
                <span className="ml-auto text-[0.6rem] text-muted-foreground/40 shrink-0">/</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Mode Selector Menu */}
      {showModeMenu && (
        <div
          ref={menuRef}
          className="absolute bottom-full left-0 right-0 mb-1 border border-border bg-popover shadow-xl overflow-hidden z-50"
        >
          {/* Table header */}
          <div className="grid grid-cols-[100px_1fr_1fr_90px] gap-px bg-border border-b border-border">
            {["模式", "核心行为", "适用场景", "风险等级"].map((h) => (
              <div
                key={h}
                className="bg-muted/60 px-2 py-1.5 text-xs font-medium text-muted-foreground"
              >
                {h}
              </div>
            ))}
          </div>

          {/* Mode rows */}
          {MODE_OPTIONS.map((mode, idx) => (
            <button
              key={mode.value}
              data-mode-index={idx}
              onClick={() => handleSelectMode(mode.value)}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={cn(
                "grid grid-cols-[100px_1fr_1fr_90px] gap-px w-full text-left transition-colors border-b border-border last:border-b-0",
                idx === selectedIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/30"
              )}
            >
              {/* 模式名 */}
              <div
                className={cn(
                  "flex items-center gap-1.5 px-2 py-2.5 font-mono text-sm font-semibold",
                  idx !== selectedIndex && "text-foreground"
                )}
              >
                {mode.icon}
                {mode.label}
                {permissionMode === mode.value && (
                  <span className="ml-auto text-[10px] bg-primary text-primary-foreground px-1.5">
                    *
                  </span>
                )}
              </div>

              {/* 核心行为 */}
              <div className="px-2 py-2.5 text-xs leading-relaxed line-clamp-3">
                {mode.coreBehavior}
              </div>

              {/* 适用场景 */}
              <div className="px-2 py-2.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                {mode.useCase}
              </div>

              {/* 风险等级 */}
              <div
                className={cn(
                  "px-2 py-2.5 text-xs font-medium flex items-center",
                  idx !== selectedIndex && mode.riskColor
                )}
              >
                {mode.riskLevel}
              </div>
            </button>
          ))}

          {/* Footer hint */}
          <div className="border-t border-border bg-muted/20 px-3 py-1.5 flex items-center justify-between">
            <span className="text-[0.65rem] text-muted-foreground/60">
              选择一个权限模式来控制 AI 的操作范围
            </span>
            <div className="flex items-center gap-2 text-[0.6rem] text-muted-foreground/40">
              <kbd className="border border-border px-1">↑↓</kbd>
              <span>选择</span>
              <span>·</span>
              <kbd className="border border-border px-1">Enter</kbd>
              <span>确认</span>
              <span>·</span>
              <kbd className="border border-border px-1">Esc</kbd>
              <span>关闭</span>
            </div>
          </div>
        </div>
      )}

      {/* Terminal prompt input */}
      <div className="flex items-start px-4 py-2">
        <span className="font-mono text-sm text-terminal-cyan shrink-0 pt-2 select-none">
          &gt;&nbsp;
        </span>
        <div className="relative min-w-0 flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isStreaming
                ? "Waiting for response..."
                : "Type a message... (Enter to send · / to switch mode · @ to reference file)"
            }
            disabled={disabled}
            rows={1}
            className={cn(
              "w-full resize-none border-0 bg-transparent px-0 py-2",
              "font-mono text-sm leading-relaxed text-foreground",
              "placeholder:text-muted-foreground/40",
              "outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "max-h-[200px]"
            )}
          />
        </div>
        {/* Stop button during streaming — small ■ character */}
        {isStreaming && (
          <button
            onClick={onStop}
            title="Stop generating (Ctrl+C)"
            className="shrink-0 mt-2 ml-2 font-mono text-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            ■
          </button>
        )}
      </div>

      {/* Terminal-style status bar */}
      <div className="flex items-center justify-between px-4 py-1 border-t border-border/50">
        <span className="font-mono text-[0.65rem] text-muted-foreground/50 flex items-center gap-1.5">
          <span className="text-terminal-cyan/70">{currentModeLabel}</span>
          <span className="text-muted-foreground/30">│</span>
          <span>{currentModelName}</span>
          <span className="text-muted-foreground/30">│</span>
          <span>{formatCost(cost)}</span>
          <span className="text-muted-foreground/30">│</span>
          <span className={ctxColor}>
            {warningState.isAboveAutoCompactThreshold
              ? `${warningState.percentLeft}% until auto-compact`
              : `ctx: ${ctxPct.toFixed(0)}%`}
          </span>
          {historyIndicator && (
            <>
              <span className="text-muted-foreground/30">│</span>
              <span>{historyIndicator}</span>
            </>
          )}
        </span>
        <span className="font-mono text-[0.6rem] text-muted-foreground/30">
          Enter↵ send · Shift+Enter newline · / mode · @ file · Ctrl+C stop
        </span>
      </div>
    </div>
  );
}
