"use client";

import { MarkdownRenderer } from "@/components/markdown-renderer";

interface TextBlockProps {
  text: string;
}

export function TextBlock({ text }: TextBlockProps) {
  if (!text) return null;

  return <MarkdownRenderer content={text} />;
}
