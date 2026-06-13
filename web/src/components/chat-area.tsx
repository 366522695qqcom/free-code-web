"use client";

import { MessageList } from "@/components/messages/message-list";
import { BrandHeader } from "@/components/ui/brand-header";
import type { EnhancedMessage } from "@/hooks/use-chat";

interface ChatAreaProps {
  messages: EnhancedMessage[];
  isStreaming: boolean;
}

export function ChatArea({ messages, isStreaming }: ChatAreaProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-md text-center space-y-3">
          <BrandHeader size="lg" subtitle="Start a conversation" />
          <p className="text-sm text-text-muted">
            Type a message or use <kbd className="rounded-md border border-border-subtle bg-overlay px-1.5 py-0.5 font-mono text-xs">/</kbd> for commands
          </p>
        </div>
      </div>
    );
  }

  return <MessageList messages={messages} isStreaming={isStreaming} />;
}
