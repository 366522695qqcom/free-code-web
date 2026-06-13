"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

interface AddServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (config: {
    name: string;
    type: "stdio" | "sse";
    command?: string;
    args?: string[];
    url?: string;
    env?: Record<string, string>;
  }) => void;
}

export function AddServerDialog({
  open,
  onOpenChange,
  onAdd,
}: AddServerDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"stdio" | "sse">("stdio");
  const [command, setCommand] = useState("");
  const [argsText, setArgsText] = useState("");
  const [url, setUrl] = useState("");
  const [envText, setEnvText] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) return;

    const args = argsText
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    const env: Record<string, string> = {};
    if (envText.trim()) {
      for (const line of envText.trim().split("\n")) {
        const eqIdx = line.indexOf("=");
        if (eqIdx > 0) {
          const key = line.slice(0, eqIdx).trim();
          const val = line.slice(eqIdx + 1).trim();
          if (key) env[key] = val;
        }
      }
    }

    onAdd({
      name: name.trim(),
      type,
      command: type === "stdio" ? command.trim() : undefined,
      args: type === "stdio" && args.length > 0 ? args : undefined,
      url: type === "sse" ? url.trim() : undefined,
      env: Object.keys(env).length > 0 ? env : undefined,
    });

    // Reset form
    setName("");
    setType("stdio");
    setCommand("");
    setArgsText("");
    setUrl("");
    setEnvText("");
    onOpenChange(false);
  };

  const isValid =
    name.trim() &&
    (type === "stdio" ? command.trim() : url.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-elevated border-border-subtle rounded-2xl">
        <DialogHeader>
          <DialogTitle>添加 MCP 服务器</DialogTitle>
          <DialogDescription>
            通过 stdio 或 SSE 传输方式连接 MCP 服务器。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          {/* Name */}
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-text-muted">
              名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My MCP Server"
              className="rounded-md border border-border-subtle bg-base px-3 py-1.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          {/* Type */}
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-text-muted">
              传输类型
            </label>
            <div className="flex gap-2">
              <Button
                variant={type === "stdio" ? "default" : "outline"}
                size="sm"
                onClick={() => setType("stdio")}
                className="flex-1"
              >
                stdio
              </Button>
              <Button
                variant={type === "sse" ? "default" : "outline"}
                size="sm"
                onClick={() => setType("sse")}
                className="flex-1"
              >
                SSE
              </Button>
            </div>
          </div>

          {/* stdio fields */}
          {type === "stdio" && (
            <>
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-text-muted">
                  命令
                </label>
                <input
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="npx @modelcontextprotocol/server-filesystem /path"
                  className="rounded-md border border-border-subtle bg-base px-3 py-1.5 font-mono text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-text-muted">
                  参数 <span className="text-text-muted/50">(空格分隔)</span>
                </label>
                <input
                  type="text"
                  value={argsText}
                  onChange={(e) => setArgsText(e.target.value)}
                  placeholder="/path/to/dir --option value"
                  className="rounded-md border border-border-subtle bg-base px-3 py-1.5 font-mono text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
            </>
          )}

          {/* SSE fields */}
          {type === "sse" && (
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-text-muted">
                服务器 URL
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="http://localhost:3001"
                className="rounded-md border border-border-subtle bg-base px-3 py-1.5 font-mono text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
          )}

          {/* Environment variables */}
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-text-muted">
              环境变量 <span className="text-text-muted/50">(每行 KEY=VALUE)</span>
            </label>
            <textarea
              value={envText}
              onChange={(e) => setEnvText(e.target.value)}
              placeholder={"API_KEY=abc123\nDEBUG=true"}
              rows={3}
              className="rounded-md border border-border-subtle bg-base px-3 py-1.5 font-mono text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            取消
          </DialogClose>
          <Button onClick={handleSubmit} disabled={!isValid}>
            添加服务器
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
