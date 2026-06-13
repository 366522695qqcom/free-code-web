"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ServerList } from "./server-list";
import { AddServerDialog } from "./add-server-dialog";
import { ServerDetail } from "./server-detail";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MCPServerInfo {
  id: string;
  name: string;
  type: "stdio" | "sse";
  status: "disconnected" | "connecting" | "connected" | "error";
  error?: string;
  tools: { name: string; description: string; inputSchema: Record<string, unknown>; serverId: string }[];
  resources: { uri: string; name: string; description?: string; mimeType?: string; serverId: string }[];
}

interface MCPPanelProps {
  onBack?: () => void;
}

export function MCPPanel({ onBack }: MCPPanelProps) {
  const [servers, setServers] = useState<MCPServerInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const fetchServers = useCallback(async () => {
    try {
      const res = await fetch("/api/mcp/servers");
      if (res.ok) {
        const data = await res.json();
        setServers(data.servers || []);
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchServers();
  }, [fetchServers]);

  const handleAdd = async (config: {
    name: string;
    type: "stdio" | "sse";
    command?: string;
    args?: string[];
    url?: string;
    env?: Record<string, string>;
  }) => {
    try {
      const res = await fetch("/api/mcp/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        await fetchServers();
      }
    } catch {
      // Ignore
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/mcp/servers/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (selectedId === id) setSelectedId(null);
        await fetchServers();
      }
    } catch {
      // Ignore
    }
  };

  const handleToggleConnect = async (id: string, action: "connect" | "disconnect") => {
    try {
      const res = await fetch(`/api/mcp/servers/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        await fetchServers();
      }
    } catch {
      // Ignore
    }
  };

  const handleTestTool = async (serverId: string, toolName: string) => {
    try {
      const res = await fetch(`/api/mcp/servers/${serverId}/tools`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolName, args: {} }),
      });

      const data = await res.json();
      // Show result in a simple alert for now
      if (data.output) {
        alert(`Tool result:\n${data.output}`);
      } else if (data.error) {
        alert(`Tool error:\n${data.error}`);
      }
    } catch (err) {
      alert(`Failed to execute tool: ${err}`);
    }
  };

  const handleReadResource = async (serverId: string, uri: string) => {
    try {
      const res = await fetch(`/api/mcp/servers/${serverId}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uri }),
      });

      const data = await res.json();
      if (data.content) {
        alert(`Resource content:\n${data.content}`);
      } else if (data.error) {
        alert(`Resource error:\n${data.error}`);
      }
    } catch (err) {
      alert(`Failed to read resource: ${err}`);
    }
  };

  const selectedServer = servers.find((s) => s.id === selectedId) || null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="flex h-full flex-col bg-base">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3">
        {onBack && (
          <Button variant="ghost" size="icon-xs" onClick={onBack}>
            <ArrowLeft className="size-4" />
          </Button>
        )}
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-brand">$</span>
          <h1 className="text-sm font-medium">MCP Server Management</h1>
        </div>
      </div>

      {/* Main content */}
      <div className="flex min-h-0 flex-1">
        {/* Sidebar — server list */}
        <div className="w-64 shrink-0 border-r border-border-subtle">
          <ServerList
            servers={servers}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAdd={() => setAddDialogOpen(true)}
            onDelete={handleDelete}
            onToggleConnect={handleToggleConnect}
          />
        </div>

        {/* Detail panel */}
        <div className="min-w-0 flex-1">
          <ServerDetail
            server={selectedServer}
            onTestTool={handleTestTool}
            onReadResource={handleReadResource}
          />
        </div>
      </div>

      {/* Add server dialog */}
      <AddServerDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAdd}
      />
    </motion.div>
  );
}
