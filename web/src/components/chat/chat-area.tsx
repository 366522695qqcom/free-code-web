"use client";

import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import type { EnhancedMessage } from "@/hooks/use-chat";

interface ChatAreaProps {
  messages: EnhancedMessage[];
  isStreaming: boolean;
  onSend: (content: string) => void;
  onStop: () => void;
}

export function ChatArea({ messages, isStreaming, onSend, onStop }: ChatAreaProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="space-y-4 text-center">
          <div className="text-terminal-green text-2xl terminal-glow font-mono">
            free-code
          </div>
          <div className="text-terminal-dim text-xs font-mono">
            v0.1.0 — self-hosted claude code web ui
          </div>
          <div className="mt-8 text-left space-y-1 font-mono text-xs">
            <div className="text-terminal-dim">
              <span className="text-terminal-green">&gt;</span> Ask me anything about code, debugging, or architecture
            </div>
            <div className="text-terminal-dim">
              <span className="text-terminal-green">&gt;</span> Type <span className="text-terminal-cyan">/help</span> for available commands
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2 max-w-md">
            {[
              { cmd: "fix a bug in my code", icon: "🔧" },
              { cmd: "add a new feature", icon: "✨" },
              { cmd: "explain this codebase", icon: "📝" },
              { cmd: "write unit tests", icon: "🧪" },
            ].map((suggestion) => (
              <button
                key={suggestion.cmd}
                className="flex items-center gap-2 border border-terminal-border bg-terminal-surface/30 px-3 py-2 text-xs text-terminal-dim transition-colors hover:bg-terminal-surface/60 hover:text-foreground text-left"
                onClick={() => onSend(suggestion.cmd)}
              >
                <span>{suggestion.icon}</span>
                <span className="truncate">{suggestion.cmd}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <ChatInput onSend={onSend} onStop={onStop} isStreaming={isStreaming} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <MessageList messages={messages} isStreaming={isStreaming} />
      <ChatInput onSend={onSend} onStop={onStop} isStreaming={isStreaming} />
    </div>
  );
}
