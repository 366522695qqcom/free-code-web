"use client";

import { useEffect, useRef } from "react";
import type { EnhancedMessage } from "@/hooks/use-chat";
import { MessageItem } from "./message-item";

interface MessageListProps {
  messages: EnhancedMessage[];
  isStreaming: boolean;
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <div className="mx-auto max-w-3xl space-y-4">
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            isStreaming={isStreaming}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
