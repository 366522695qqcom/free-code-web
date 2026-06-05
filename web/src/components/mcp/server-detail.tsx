"use client";

import { useState } from "react";
import {
  Server,
  Wrench,
  FileText,
  Play,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MCPToolInfo {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  serverId: string;
}

interface MCPResourceInfo {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  serverId: string;
}

interface MCPServerDetail {
  id: string;
  name: string;
  type: "stdio" | "sse";
  status: "disconnected" | "connecting" | "connected" | "error";
  error?: string;
  tools: MCPToolInfo[];
  resources: MCPResourceInfo[];
}

interface ServerDetailProps {
  server: MCPServerDetail | null;
  onTestTool: (serverId: string, toolName: string) => void;
  onReadResource: (serverId: string, uri: string) => void;
}

function ToolCard({
  tool,
  serverId,
  onTest,
}: {
  tool: MCPToolInfo;
  serverId: string;
  onTest: (serverId: string, toolName: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const properties = (tool.inputSchema?.properties || {}) as Record<
    string,
    { type?: string; description?: string }
  >;
  const required = (tool.inputSchema?.required || []) as string[];

  return (
    <div className="rounded-lg border border-border bg-background/50 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Wrench className="size-3 shrink-0 text-terminal-cyan" />
            <span className="truncate font-mono text-sm font-medium">
              {tool.name}
            </span>
          </div>
          {tool.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {tool.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setExpanded(!expanded)}
            title="Show schema"
          >
            {expanded ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onTest(serverId, tool.name)}
            title="Test tool"
          >
            <Play className="size-3" />
          </Button>
        </div>
      </div>

      {expanded && Object.keys(properties).length > 0 && (
        <div className="mt-2 space-y-1 border-t border-border pt-2">
          <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground/60">
            Parameters
          </p>
          {Object.entries(properties).map(([key, schema]) => (
            <div key={key} className="flex items-start gap-2 text-xs">
              <span className="font-mono text-terminal-green">{key}</span>
              {schema.type && (
                <span className="text-muted-foreground/60">
                  ({schema.type})
                </span>
              )}
              {required.includes(key) && (
                <span className="text-destructive">*</span>
              )}
              {schema.description && (
                <span className="text-muted-foreground">
                  — {schema.description}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResourceItem({
  resource,
  serverId,
  onRead,
}: {
  resource: MCPResourceInfo;
  serverId: string;
  onRead: (serverId: string, uri: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-2">
      <FileText className="size-3 shrink-0 text-terminal-green" />
      <div className="min-w-0 flex-1">
        <span className="block truncate font-mono text-sm">{resource.name}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {resource.uri}
        </span>
      </div>
      {resource.mimeType && (
        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[0.6rem] text-muted-foreground">
          {resource.mimeType}
        </span>
      )}
      <Button
        variant="ghost"
        size="xs"
        onClick={() => onRead(serverId, resource.uri)}
        title="Read resource"
      >
        Read
      </Button>
    </div>
  );
}

export function ServerDetail({
  server,
  onTestTool,
  onReadResource,
}: ServerDetailProps) {
  if (!server) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Server className="mx-auto mb-2 size-10 opacity-20" />
          <p className="text-sm">Select a server to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Server className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">{server.name}</h2>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[0.6rem] text-muted-foreground">
            {server.type}
          </span>
        </div>
        {server.error && (
          <div className="mt-2 flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="mt-0.5 size-3 shrink-0" />
            <span>{server.error}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Tools section */}
        <div>
          <h3 className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
            <Wrench className="size-3" />
            Tools ({server.tools.length})
          </h3>
          {server.tools.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {server.status === "connected"
                ? "No tools available"
                : "Connect to see available tools"}
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              {server.tools.map((tool) => (
                <ToolCard
                  key={tool.name}
                  tool={tool}
                  serverId={server.id}
                  onTest={onTestTool}
                />
              ))}
            </div>
          )}
        </div>

        {/* Resources section */}
        <div>
          <h3 className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
            <FileText className="size-3" />
            Resources ({server.resources.length})
          </h3>
          {server.resources.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {server.status === "connected"
                ? "No resources available"
                : "Connect to see available resources"}
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              {server.resources.map((resource) => (
                <ResourceItem
                  key={resource.uri}
                  resource={resource}
                  serverId={server.id}
                  onRead={onReadResource}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
