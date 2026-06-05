"use client";

import type { EnhancedMessage } from "@/hooks/use-chat";

interface UserMessageProps {
  message: EnhancedMessage;
}

export function UserMessage({ message }: UserMessageProps) {
  return (
    <div className="py-1 font-mono text-sm leading-relaxed">
      <span className="text-terminal-cyan">&gt; </span>
      <span className="text-foreground">{message.content}</span>
    </div>
  );
}
