"use client";

import {
  Plus,
  Trash2,
  Plug,
  PlugZap,
  Loader2,
  Server,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MCPServerInfo {
  id: string;
  name: string;
  type: "stdio" | "sse";
  status: "disconnected" | "connecting" | "connected" | "error";
  error?: string;
  tools: { name: string; description: string }[];
  resources: { uri: string; name: string }[];
}

interface ServerListProps {
  servers: MCPServerInfo[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onToggleConnect: (id: string, action: "connect" | "disconnect") => void;
}

function StatusIndicator({ status }: { status: MCPServerInfo["status"] }) {
  switch (status) {
    case "connected":
      return (
        <span className="flex items-center gap-1.5 text-xs text-accent-green">
          <span className="inline-block size-2 rounded-full bg-accent-green" />
          Connected
        </span>
      );
    case "connecting":
      return (
        <span className="flex items-center gap-1.5 text-xs text-accent-cyan">
          <Loader2 className="size-3 animate-spin" />
          Connecting
        </span>
      );
    case "error":
      return (
        <span className="flex items-center gap-1.5 text-xs text-accent-red">
          <AlertCircle className="size-3" />
          Error
        </span>
      );
    default:
      return (
        <span className="flex items-center gap-1.5 text-xs text-text-muted">
          <span className="inline-block size-2 rounded-full bg-overlay-foreground/40" />
          Disconnected
        </span>
      );
  }
}

export function ServerList({
  servers,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
  onToggleConnect,
}: ServerListProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle px-3 py-3">
        <h2 className="text-sm font-medium text-text-primary">MCP Servers</h2>
        <Button variant="ghost" size="icon-xs" onClick={onAdd} title="Add server">
          <Plus className="size-4" />
        </Button>
      </div>

      {/* Server list */}
      <div className="flex-1 overflow-y-auto">
        {servers.length === 0 ? (
          <div className="px-3 py-8 text-center text-xs text-text-muted">
            <Server className="mx-auto mb-2 size-8 opacity-30" />
            <p>No MCP servers configured</p>
            <p className="mt-1 text-text-muted/60">
              Click + to add one
            </p>
          </div>
        ) : (
          <div className="space-y-0.5 p-2">
            {servers.map((server) => (
              <div
                key={server.id}
                className={cn(
                  "group flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors cursor-pointer",
                  selectedId === server.id
                    ? "bg-overlay text-text-primary"
                    : "text-text-primary/70 hover:bg-overlay/50 hover:text-text-primary"
                )}
                onClick={() => onSelect(server.id)}
              >
                <Server className="size-3.5 shrink-0 opacity-50" />
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{server.name}</span>
                  <StatusIndicator status={server.status} />
                </div>
                <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleConnect(
                        server.id,
                        server.status === "connected"
                          ? "disconnect"
                          : "connect"
                      );
                    }}
                    title={
                      server.status === "connected" ? "Disconnect" : "Connect"
                    }
                  >
                    {server.status === "connected" ? (
                      <PlugZap className="size-3 text-accent-green" />
                    ) : (
                      <Plug className="size-3 text-text-muted" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(server.id);
                    }}
                    title="Delete server"
                  >
                    <Trash2 className="size-3 text-text-muted hover:text-accent-red" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
