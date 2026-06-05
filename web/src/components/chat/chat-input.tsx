"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  type KeyboardEvent,
} from "react";
import { Send, SquareSlash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SlashCommand {
  command: string;
  description: string;
  usage?: string;
}

interface ChatInputProps {
  onSend: (content: string) => void;
  onStop: () => void;
  onSlashCommand: (command: string, args: string) => void;
  isStreaming: boolean;
  disabled?: boolean;
}

const SLASH_COMMANDS: SlashCommand[] = [
  { command: "/clear", description: "Clear the current chat", usage: "/clear" },
  { command: "/help", description: "Show available commands", usage: "/help" },
  { command: "/model", description: "Switch model", usage: "/model <name>" },
  { command: "/compact", description: "Compact/summarize conversation", usage: "/compact" },
  { command: "/cost", description: "Show current session cost", usage: "/cost" },
  { command: "/tools", description: "List available tools", usage: "/tools" },
];

export function ChatInput({
  onSend,
  onStop,
  onSlashCommand,
  isStreaming,
  disabled,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [showSlashMenu, setShowSlashMenu] = useState(false);
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

  // Detect slash commands
  useEffect(() => {
    if (value.startsWith("/") && !value.includes(" ")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowSlashMenu(true);
      setSelectedIndex(0);
    } else {
      setShowSlashMenu(false);
    }
  }, [value]);

  const filteredCommands = SLASH_COMMANDS.filter((c) =>
    c.command.startsWith(value)
  );

  // Reset selected index when filtered list changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIndex(0);
  }, [filteredCommands.length]);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;

    // Handle slash commands
    if (trimmed.startsWith("/")) {
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

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, onSend, onSlashCommand]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (showSlashMenu && filteredCommands.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          const cmd = filteredCommands[selectedIndex];
          setValue(cmd.command + " ");
          setShowSlashMenu(false);
          textareaRef.current?.focus();
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setShowSlashMenu(false);
          return;
        }
      }

      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend, showSlashMenu, filteredCommands, selectedIndex]
  );

  const handleSlashCommandClick = useCallback(
    (command: string) => {
      setValue(command + " ");
      setShowSlashMenu(false);
      textareaRef.current?.focus();
    },
    []
  );

  // Scroll selected item into view
  useEffect(() => {
    if (showSlashMenu && menuRef.current) {
      const selectedEl = menuRef.current.querySelector(
        `[data-command-index="${selectedIndex}"]`
      );
      selectedEl?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, showSlashMenu]);

  return (
    <div className="relative border-t border-border bg-background/80 backdrop-blur-sm">
      {/* Slash command menu */}
      {showSlashMenu && filteredCommands.length > 0 && (
        <div
          ref={menuRef}
          className="absolute bottom-full left-4 mb-1 w-80 rounded-lg border border-border bg-popover p-1 shadow-lg"
        >
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Commands
          </div>
          {filteredCommands.map((cmd, idx) => (
            <button
              key={cmd.command}
              data-command-index={idx}
              onClick={() => handleSlashCommandClick(cmd.command)}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                idx === selectedIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              )}
            >
              <span className="font-mono text-terminal-cyan text-xs">
                {cmd.command}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">
                {cmd.description}
              </span>
            </button>
          ))}
          <div className="border-t border-border mt-1 pt-1 px-2 py-1 text-[0.6rem] text-muted-foreground/50">
            <kbd className="rounded border border-border px-0.5">↑↓</kbd> navigate
            <span className="mx-1">·</span>
            <kbd className="rounded border border-border px-0.5">Tab</kbd> autocomplete
            <span className="mx-1">·</span>
            <kbd className="rounded border border-border px-0.5">Esc</kbd> close
          </div>
        </div>
      )}

      <div className="flex items-end gap-2 px-4 py-3">
        <div className="relative min-w-0 flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isStreaming ? "Waiting for response..." : "Type a message... (Ctrl+Enter to send)"
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

      <div className="flex items-center justify-between px-4 pb-2">
        <span className="text-[0.65rem] text-muted-foreground/40">
          Ctrl+Enter to send · Type / for commands
        </span>
      </div>
    </div>
  );
}
