"use client";

import { Terminal } from "lucide-react";
import { MessageList } from "@/components/messages/message-list";
import type { EnhancedMessage } from "@/hooks/use-chat";

interface ChatAreaProps {
  messages: EnhancedMessage[];
  isStreaming: boolean;
}

export function ChatArea({ messages, isStreaming }: ChatAreaProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="flex size-16 items-center justify-center rounded-2xl border border-terminal-cyan/20 bg-terminal-cyan/5">
          <Terminal className="size-8 text-terminal-cyan" />
        </div>
        <h2 className="mt-4 text-lg font-medium text-foreground">
          Free Code
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Self-hosted Claude Code web UI
        </p>
        <p className="mt-2 text-xs text-muted-foreground/60 font-mono">
          Ask me anything about code, debugging, or architecture.
        </p>
        <div className="mt-8 grid max-w-lg grid-cols-2 gap-3">
          {[
            { icon: ">", text: "Fix a bug in my code" },
            { icon: ">", text: "Add a new feature" },
            { icon: ">", text: "Explain this codebase" },
            { icon: ">", text: "Write unit tests" },
          ].map((suggestion) => (
            <div
              key={suggestion.text}
              className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 font-mono text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground hover:border-terminal-cyan/20"
            >
              <span className="text-terminal-green">{suggestion.icon}</span>
              <span>{suggestion.text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <MessageList messages={messages} isStreaming={isStreaming} />;
}
