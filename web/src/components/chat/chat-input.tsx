"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ArrowUp, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (content: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

const SLASH_COMMANDS = [
  { command: "/help", description: "Show available commands" },
  { command: "/clear", description: "Clear conversation" },
  { command: "/model", description: "Change model" },
  { command: "/compact", description: "Compact conversation" },
];

export function ChatInput({ onSend, onStop, isStreaming, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredCommands = SLASH_COMMANDS.filter((cmd) =>
    cmd.command.startsWith(input.split(" ")[0] || "")
  );

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [input, adjustHeight]);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;

    setCommandHistory((prev) => [trimmed, ...prev.slice(0, 49)]);
    setHistoryIndex(-1);
    onSend(trimmed);
    setInput("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Autocomplete navigation
      if (showAutocomplete && filteredCommands.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setAutocompleteIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setAutocompleteIndex((prev) =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          return;
        }
        if (e.key === "Tab" || e.key === "Enter") {
          e.preventDefault();
          setInput(filteredCommands[autocompleteIndex].command + " ");
          setShowAutocomplete(false);
          setAutocompleteIndex(0);
          return;
        }
        if (e.key === "Escape") {
          setShowAutocomplete(false);
          return;
        }
      }

      // Enter to send, Shift+Enter for newline
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
        return;
      }

      // Command history navigation
      if (e.key === "ArrowUp" && !input) {
        e.preventDefault();
        if (commandHistory.length > 0) {
          const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex] ?? "");
        }
        return;
      }

      if (e.key === "ArrowDown" && historyIndex >= 0) {
        e.preventDefault();
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(newIndex >= 0 ? commandHistory[newIndex] ?? "" : "");
        return;
      }
    },
    [showAutocomplete, filteredCommands, autocompleteIndex, handleSubmit, input, commandHistory, historyIndex]
  );

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);

    // Show autocomplete for slash commands
    const firstWord = value.split(" ")[0] || "";
    if (firstWord.startsWith("/") && !value.includes(" ", firstWord.length)) {
      setShowAutocomplete(SLASH_COMMANDS.some((cmd) => cmd.command.startsWith(firstWord) && cmd.command !== firstWord));
      setAutocompleteIndex(0);
    } else {
      setShowAutocomplete(false);
    }
  }, []);

  return (
    <div className="relative border-t border-terminal-border bg-terminal-bg">
      {/* Autocomplete dropdown */}
      {showAutocomplete && filteredCommands.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 border border-terminal-border bg-terminal-surface mb-1 mx-4 rounded">
          {filteredCommands.map((cmd, i) => (
            <button
              key={cmd.command}
              className={`flex w-full items-center gap-3 px-3 py-1.5 text-xs transition-colors ${
                i === autocompleteIndex
                  ? "bg-terminal-green/10 text-terminal-green"
                  : "text-muted-foreground hover:bg-terminal-surface/80"
              }`}
              onClick={() => {
                setInput(cmd.command + " ");
                setShowAutocomplete(false);
                textareaRef.current?.focus();
              }}
            >
              <span className="font-medium text-terminal-cyan">{cmd.command}</span>
              <span className="text-terminal-dim">{cmd.description}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 px-4 py-3">
        {/* Prompt prefix */}
        <span className="shrink-0 pb-0.5 text-terminal-green terminal-glow select-none text-sm">
          &gt;
        </span>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Enter command..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-terminal-dim focus:outline-none min-h-[1.5rem] max-h-[200px]"
        />

        {/* Send/Stop button */}
        {isStreaming ? (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onStop}
            className="shrink-0 text-terminal-red hover:text-terminal-red hover:bg-terminal-red/10"
            title="Stop streaming"
          >
            <Square className="size-3" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleSubmit}
            disabled={!input.trim() || disabled}
            className={cn(
              "shrink-0",
              input.trim()
                ? "text-terminal-green hover:text-terminal-green hover:bg-terminal-green/10"
                : "text-terminal-dim"
            )}
            title="Send message"
          >
            <ArrowUp className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

