"use client";

import { useMemo } from "react";
import AnsiToHtml from "ansi-to-html";

interface AnsiRendererProps {
  content: string;
  className?: string;
}

const converter = new AnsiToHtml({
  fg: "#d4d4d4",
  bg: "#0d0d0d",
  newline: true,
  escapeXML: true,
  stream: false,
});

export function AnsiRenderer({ content, className }: AnsiRendererProps) {
  const html = useMemo(() => converter.toHtml(content), [content]);

  return (
    <div
      className={`terminal-output ${className || ""}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
