"use client";

import { User } from "lucide-react";
import type { EnhancedMessage } from "@/hooks/use-chat";

interface UserMessageProps {
  message: EnhancedMessage;
}

export function UserMessage({ message }: UserMessageProps) {
  return (
    <div className="animate-message-in flex items-start gap-3 justify-end">
      <div className="max-w-[80%] rounded-xl rounded-tr-sm border border-terminal-cyan/20 bg-terminal-cyan/5 px-4 py-3 font-mono text-sm leading-relaxed text-foreground">
        {message.content}
      </div>
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-terminal-cyan/15 border border-terminal-cyan/20">
        <User className="size-4 text-terminal-cyan" />
      </div>
    </div>
  );
}
