"use client";

import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { useState, useCallback, type ComponentPropsWithoutRef } from "react";
import { Check, Copy } from "lucide-react";

function CodeBlock({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"code">) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const isInline = !match;

  const handleCopy = useCallback(() => {
    const text = String(children).replace(/\n$/, "");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [children]);

  if (isInline) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="group/code relative">
      <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity group-hover/code:opacity-100">
        {match && (
          <span className="rounded bg-muted/50 px-1.5 py-0.5 text-[0.65rem] text-muted-foreground">
            {match[1]}
          </span>
        )}
        <button
          onClick={handleCopy}
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Copy code"
        >
          {copied ? (
            <Check className="size-3.5" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>
      </div>
      <code className={className} {...props}>
        {children}
      </code>
    </div>
  );
}

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose-invert max-w-none text-sm leading-relaxed text-foreground [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_li]:marker:text-muted-foreground [&_ol]:list-decimal [&_p]:mb-2 [&_p]:last:mb-0 [&_table]:w-full [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:font-medium [&_ul]:list-disc">
      <ReactMarkdown
        rehypePlugins={[rehypeHighlight]}
        remarkPlugins={[remarkGfm]}
        components={{
          code: CodeBlock,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
