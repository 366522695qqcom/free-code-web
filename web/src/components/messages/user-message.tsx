"use client";

import { User } from "lucide-react";
import type { EnhancedMessage } from "@/hooks/use-chat";

interface UserMessageProps {
  message: EnhancedMessage;
}

export function UserMessage({ message }: UserMessageProps) {
  return (
    <div className="animate-message-in flex items-start gap-3 justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary/10 px-4 py-3 text-sm leading-relaxed">
        {message.content}
      </div>
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
        <User className="size-4 text-primary" />
      </div>
    </div>
  );
}
