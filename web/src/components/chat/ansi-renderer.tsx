"use client";

import { useMemo } from "react";
import AnsiToHtml from "ansi-to-html";

interface AnsiRendererProps {
  content: string;
  className?: string;
}

const ansiConverter = new AnsiToHtml({
  fg: "#9ca3af",
  bg: "transparent",
  newline: true,
  escapeXML: true,
  stream: false,
});

export function AnsiRenderer({ content, className }: AnsiRendererProps) {
  const html = useMemo(() => {
    try {
      return ansiConverter.toHtml(content);
    } catch {
      // Fallback: strip ANSI codes and return plain text
      return content.replace(/\x1b\[[0-9;]*m/g, "");
    }
  }, [content]);

  return (
    <div
      className={`terminal-output ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
