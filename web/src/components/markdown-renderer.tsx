"use client";

import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { useState, useCallback, type ComponentPropsWithoutRef } from "react";
import { Check, Copy } from "lucide-react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs text-text-muted hover:text-brand transition-colors duration-150"
    >
      {copied ? (
        <>
          <Check className="size-3" />
          <span>已复制!</span>
        </>
      ) : (
        <>
          <Copy className="size-3" />
          <span>复制</span>
        </>
      )}
    </button>
  );
}

function CodeBlock({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"code">) {
  const match = /language-(\w+)/.exec(className || "");
  const isInline = !match;
  const language = match ? match[1] : null;

  if (isInline) {
    return (
      <code
        className="bg-brand/10 text-brand px-1.5 py-0.5 rounded-md text-[0.85em] font-mono"
        {...props}
      >
        {children}
      </code>
    );
  }

  return (
    <FencedCodeBlock className={className} language={language} {...props}>
      {children}
    </FencedCodeBlock>
  );
}

function FencedCodeBlock({
  className,
  language,
  children,
  ...props
}: ComponentPropsWithoutRef<"code"> & { language: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const codeText = String(children).replace(/\n$/, "");
  const lineCount = codeText.split("\n").length;
  const isLong = lineCount > 20;
  const displayCode =
    isLong && !expanded
      ? codeText.split("\n").slice(0, 20).join("\n") + "\n..."
      : codeText;

  return (
    <div className="my-3 rounded-xl border border-border-subtle overflow-hidden shadow-sm">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-overlay/50 px-4 py-2 border-b border-border-subtle">
        <span className="text-xs font-mono text-text-subtle">
          {language || "代码"}
        </span>
        <CopyButton text={codeText} />
      </div>
      {/* Code content */}
      <pre className="!m-0 !rounded-none !border-0 bg-elevated !p-4">
        <code className={className} {...props}>
          {displayCode}
        </code>
      </pre>
      {/* Expand/collapse button */}
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-2 text-xs text-brand hover:text-brand/80 transition-colors border-t border-border-subtle"
        >
          {expanded ? "收起" : `展开全部 ${lineCount} 行`}
        </button>
      )}
    </div>
  );
}

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose-invert max-w-none text-sm leading-relaxed text-text-primary [&_a]:text-accent-cyan [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-accent-cyan/30 [&_a:hover]:decoration-accent-cyan [&_blockquote]:border-l-2 [&_blockquote]:border-accent-orange/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-text-muted [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:text-text-primary [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-text-primary [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-accent-cyan [&_li]:marker:text-accent-green [&_ol]:list-decimal [&_p]:mb-2 [&_p]:last:mb-0 [&_strong]:text-text-primary [&_table]:w-full [&_td]:border [&_td]:border-border-subtle [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-border-subtle [&_th]:px-2 [&_th]:py-1 [&_th]:font-medium [&_th]:text-text-primary [&_ul]:list-disc">
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
