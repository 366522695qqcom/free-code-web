"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  type KeyboardEvent,
} from "react";
import { Send, SquareSlash, Shield, ShieldCheck, ShieldAlert, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  coreBehavior: string;    // 核心行为
  useCase: string;         // 适用场景
  riskLevel: string;       // 风险等级
  riskColor: string;       // 风险颜色
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
    coreBehavior: "跳过所有权限提示。AI 将无需任何批准，自动执行所有操作，包括 Bash 命令。即官方文档中的“YOLO 模式”。",
    useCase: "极高风险，仅应在完全隔离的、无网络访问的容器化环境（如 Dev Container）中使用。",
    riskLevel: "极高",
    riskColor: "text-red-500",
  },
];

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
}

export function ChatInput({
  onSend,
  onStop,
  onSlashCommand,
  isStreaming,
  disabled,
  permissionMode = "default",
  onPermissionModeChange,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const handleSelectMode = useCallback(
    (mode: PermissionMode) => {
      onPermissionModeChange?.(mode);
      setShowModeMenu(false);
      setValue("");
      textareaRef.current?.focus();
    },
    [onPermissionModeChange]
  );

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;

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

      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend, showModeMenu, selectedIndex]
  );

  const handleSelectMode = useCallback(
    (mode: PermissionMode) => {
      onPermissionModeChange?.(mode);
      setShowModeMenu(false);
      setValue("");
      textareaRef.current?.focus();
    },
    [onPermissionModeChange]
  );

  // Scroll selected item into view
  useEffect(() => {
    if (showModeMenu && menuRef.current) {
      const selectedEl = menuRef.current.querySelector(
        `[data-mode-index="${selectedIndex}"]`
      );
      selectedEl?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, showModeMenu]);

  /** 当前模式的标签 */
  const currentModeLabel = MODE_OPTIONS.find(
    (m) => m.value === permissionMode
  )?.label;

  return (
    <div className="relative border-t border-border bg-background/80 backdrop-blur-sm">
      {/* Mode Selector Menu */}
      {showModeMenu && (
        <div
          ref={menuRef}
          className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border border-border bg-popover shadow-xl overflow-hidden z-50"
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
                  <span className="ml-auto text-[10px] bg-primary text-primary-foreground px-1.5 rounded-full">
                    当前
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
              <kbd className="rounded border border-border px-1">↑↓</kbd>
              <span>选择</span>
              <span>·</span>
              <kbd className="rounded border border-border px-1">Enter</kbd>
              <span>确认</span>
              <span>·</span>
              <kbd className="rounded border border-border px-1">Esc</kbd>
              <span>关闭</span>
            </div>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2 px-4 py-3">
        <div className="relative min-w-0 flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isStreaming
                ? "Waiting for response..."
                : `Type a message... (Ctrl+Enter to send · / 切换模式)`
            }
            disabled={disabled || isStreaming}
            rows={1}
            className={cn(
              "w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5",
              "font-mono text-sm leading-relaxed text-foreground",
              "placeholder:text-muted-foreground/50",
              "transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "max-h-[200px]"
            )}
          />
        </div>

        {isStreaming ? (
          <Button
            variant="destructive"
            size="icon"
            onClick={onStop}
            title="Stop generating"
            className="shrink-0"
          >
            <SquareSlash className="size-4" />
          </Button>
        ) : (
          <Button
            variant="default"
            size="icon"
            onClick={handleSend}
            disabled={!value.trim() || disabled}
            title="Send message"
            className="shrink-0"
          >
            <Send className="size-4" />
          </Button>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 pb-2">
        <span className="text-[0.65rem] text-muted-foreground/40">
          Ctrl+Enter to send
        </span>
        <span className="text-[0.65rem] text-muted-foreground/40 flex items-center gap-1">
          模式:
          <kbd className="rounded border border-border px-1 font-mono text-terminal-cyan">
            {currentModeLabel}
          </kbd>
          <span className="mx-1">·</span>
          输入 <kbd className="rounded border border-border px-1">/</kbd> 切换
        </span>
      </div>
    </div>
  );
}
