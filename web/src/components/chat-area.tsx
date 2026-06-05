"use client";

import { Bot, Sparkles } from "lucide-react";
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
        <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
          <Bot className="size-8 text-muted-foreground" />
        </div>
        <h2 className="mt-4 text-lg font-medium text-foreground">
          How can I help you?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask me anything about code, debugging, or architecture.
        </p>
        <div className="mt-8 grid max-w-lg grid-cols-2 gap-3">
          {[
            { icon: "🔧", text: "Fix a bug in my code" },
            { icon: "✨", text: "Add a new feature" },
            { icon: "📝", text: "Explain this codebase" },
            { icon: "🧪", text: "Write unit tests" },
          ].map((suggestion) => (
            <div
              key={suggestion.text}
              className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            >
              <span>{suggestion.icon}</span>
              <span>{suggestion.text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <MessageList messages={messages} isStreaming={isStreaming} />;
}
