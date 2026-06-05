"use client";

import { MessageList } from "@/components/messages/message-list";
import type { EnhancedMessage } from "@/hooks/use-chat";

interface ChatAreaProps {
  messages: EnhancedMessage[];
  isStreaming: boolean;
}

export function ChatArea({ messages, isStreaming }: ChatAreaProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col justify-end px-4 py-8">
        <div className="font-mono text-sm space-y-1">
          <div>
            <span className="text-terminal-cyan">free-code</span>
            <span className="text-muted-foreground/40"> v0.1.0</span>
          </div>
          <div className="text-muted-foreground/60">
            Self-hosted Claude Code web UI
          </div>
          <div className="mt-4 text-muted-foreground/40">
            Type a message to start. Use <span className="text-terminal-cyan/60">/</span> to switch permission mode.
          </div>
          <div className="mt-3 space-y-0.5 text-muted-foreground/30">
            <div><span className="text-terminal-cyan/40">&gt;</span> Fix a bug in my code</div>
            <div><span className="text-terminal-cyan/40">&gt;</span> Add a new feature</div>
            <div><span className="text-terminal-cyan/40">&gt;</span> Explain this codebase</div>
            <div><span className="text-terminal-cyan/40">&gt;</span> Write unit tests</div>
          </div>
        </div>
      </div>
    );
  }

  return <MessageList messages={messages} isStreaming={isStreaming} />;
}
