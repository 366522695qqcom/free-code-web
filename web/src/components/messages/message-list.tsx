"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { EnhancedMessage } from "@/hooks/use-chat";
import { UserMessage } from "./user-message";
import { AssistantMessage } from "./assistant-message";

interface MessageListProps {
  messages: EnhancedMessage[];
  isStreaming: boolean;
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-4"
    >
      <div className="mx-auto max-w-4xl space-y-4">
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            {message.role === "user" ? (
              <UserMessage message={message} />
            ) : (
              <AssistantMessage
                message={message}
                isStreaming={isStreaming}
              />
            )}
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
