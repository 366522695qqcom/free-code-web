"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ThinkingBlockProps {
  text: string;
}

export function ThinkingBlock({ text }: ThinkingBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  return (
    <div className="bg-brand/5 border border-brand/10 rounded-xl px-4 py-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 text-left text-text-muted transition-colors hover:text-text-primary"
      >
        <span className="text-accent-orange">{isExpanded ? "▼" : "◌"}</span>
        <span className="truncate text-sm italic">
          {isExpanded ? "Thinking" : "Thinking..."}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-2">
              <p className="whitespace-pre-wrap text-text-muted italic text-sm leading-relaxed">
                {text}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
