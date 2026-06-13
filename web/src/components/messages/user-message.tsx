"use client";

import { motion } from "framer-motion";
import type { EnhancedMessage } from "@/hooks/use-chat";

interface UserMessageProps {
  message: EnhancedMessage;
}

export function UserMessage({ message }: UserMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="flex justify-end px-4"
    >
      <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-brand px-4 py-2.5 text-white">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
      </div>
    </motion.div>
  );
}
