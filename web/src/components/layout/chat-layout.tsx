"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FolderTree } from "lucide-react";
import { Sidebar } from "./sidebar";
import { ChatInput } from "@/components/chat/chat-input";
import type { PermissionMode } from "@/components/chat/chat-input";
import { TokenWarning } from "@/components/chat/token-warning";
import { ProviderDialog } from "@/components/chat/provider-dialog";
import { ChatArea } from "@/components/chat-area";
import { ToolConfirmDialog } from "@/components/chat/tool-confirm-dialog";
import { AutoApproveToastContainer } from "@/components/chat/auto-approve-toast";
import { FileTreePanel } from "@/components/chat/file-tree-panel";
import { useSessions } from "@/hooks/use-sessions";
import { useChat } from "@/hooks/use-chat";
import { useFileTree } from "@/hooks/use-file-tree";
import type { ModelOption } from "@/types";
import { calculateTokenWarningState, getAutoCompactThreshold, getEffectiveContextWindowSize, getContextWindowSize } from "@/lib/context";

const AVAILABLE_MODELS = [
  { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", provider: "Anthropic", capabilities: [] as string[] },
  { id: "claude-opus-4-20250514", name: "Claude Opus 4", provider: "Anthropic", capabilities: ["Extended Thinking"] },
  { id: "claude-haiku-3.5-20241022", name: "Claude 3.5 Haiku", provider: "Anthropic", capabilities: [] as string[] },
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", capabilities: [] as string[] },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", capabilities: [] as string[] },
  { id: "o3-mini", name: "o3-mini", provider: "OpenAI", capabilities: ["Reasoning"] },
];

const TOOL_NAMES = [
  "bash", "read", "write", "edit", "multiEdit", "glob", "grep",
  "listDirectory", "webSearch", "webFetch",
];

export function ChatLayout() {
  const {
    sessions,
    currentSessionId,
    isLoading,
    setCurrentSessionId,
    createSession,
    deleteSession,
    renameSession,
  } = useSessions();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showFileTree, setShowFileTree] = useState(true);
  const [currentModel, setCurrentModel] = useState("claude-sonnet-4-20250514");
  const [permissionMode, setPermissionMode] = useState<PermissionMode>("default");
  const [systemMessage, setSystemMessage] = useState<string | null>(null);
  const [customModels, setCustomModels] = useState<ModelOption[]>([]);
  const [modelProviderMap, setModelProviderMap] = useState<Record<string, { providerId: string; baseUrl: string; apiKey: string; apiPath: string }>>({});
  const [customProviderInfo, setCustomProviderInfo] = useState<{ providerId: string; baseUrl: string; apiKey: string; apiPath: string } | null>(null);
  const [providerDialogOpen, setProviderDialogOpen] = useState(false);
  const router = useRouter();

  // Fetch custom providers and models on mount
  const refreshCustomModels = useCallback(() => {
    fetch("/api/providers")
      .then((res) => res.json())
      .then((data) => {
        if (data.providers) {
          const models: ModelOption[] = [];
          const providerMap: Record<string, { providerId: string; baseUrl: string; apiKey: string; apiPath: string }> = {};
          for (const provider of data.providers) {
            for (const model of provider.models || []) {
              // capabilities 可能是对象 {vision, reasoning, toolUse} 或字符串数组
              let caps: string[] = [];
              if (Array.isArray(model.capabilities)) {
                caps = model.capabilities;
              } else if (model.capabilities && typeof model.capabilities === "object") {
                caps = Object.entries(model.capabilities)
                  .filter(([, v]) => v === true)
                  .map(([k]) => k);
              }
              models.push({
                id: model.modelId,
                name: model.displayName || model.modelId,
                provider: provider.name,
                capabilities: caps,
              });
              providerMap[model.modelId] = {
                providerId: provider.id,
                baseUrl: provider.baseUrl,
                apiKey: provider.apiKey,
                apiPath: provider.apiPath,
              };
            }
          }
          setCustomModels(models);
          setModelProviderMap(providerMap);
        }
      })
      .catch(() => {
        // Ignore fetch errors
      });
  }, []);

  useEffect(() => {
    refreshCustomModels();
  }, [refreshCustomModels]);

  // Merge built-in and custom models for /model command
  const allModels = useMemo(() => [...AVAILABLE_MODELS, ...customModels], [customModels]);

  const {
    messages,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    clearMessages,
    setMessages,
    pendingConfirmation,
    confirmTool,
    usage,
    autoApproveToasts,
    removeAutoApproveToast,
    contextPercentage,
    resetUsage,
  } = useChat(currentSessionId, permissionMode, currentModel);

  const { tree: fileTree } = useFileTree(messages);

  const handleFileClick = useCallback((filePath: string) => {
    // Find the first tool-use block that references this file path and scroll to it
    const sanitizedPath = filePath.replace(/[^a-zA-Z0-9-_]/g, "_");
    const elements = document.querySelectorAll(`[id^="tool-${sanitizedPath}"]`);
    if (elements.length > 0) {
      elements[0].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  const handleSelectSession = useCallback(
    (id: string) => {
      setCurrentSessionId(id);
      fetch(`/api/sessions/${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.messages) {
            const enhancedMsgs = data.messages.map(
              (msg: Record<string, unknown>, idx: number) => ({
                id: `msg-${idx}`,
                role: msg.role as "user" | "assistant",
                content:
                  typeof msg.content === "string"
                    ? msg.content
                    : Array.isArray(msg.content)
                      ? msg.content
                          .filter(
                            (b: Record<string, unknown>) => b.type === "text"
                          )
                          .map((b: Record<string, unknown>) => b.text)
                          .join("")
                      : "",
                timestamp: new Date(
                  msg.timestamp as string
                ).getTime(),
                contentBlocks: Array.isArray(msg.content)
                  ? data.messages.map(
                      (block: Record<string, unknown>) => {
                        if (block.type === "text")
                          return { type: "text" as const, text: block.text as string };
                        if (block.type === "thinking")
                          return { type: "thinking" as const, text: block.thinking as string };
                        if (block.type === "tool_use")
                          return {
                            type: "tool_use" as const,
                            toolUse: {
                              id: block.id as string,
                              name: block.name as string,
                              input: block.input as Record<string, unknown>,
                            },
                            status: "done" as const,
                          };
                        return { type: "text" as const, text: "" };
                      }
                    )
                  : undefined,
              })
            );
            setMessages(enhancedMsgs);
          }
        })
        .catch(() => {
          // Ignore load errors
        });
    },
    [setCurrentSessionId, setMessages]
  );

  const handleCreateSession = useCallback(async () => {
    try {
      await createSession("New Chat");
    } catch {
      // Error handled in hook
    }
  }, [createSession]);

  const handleDeleteSession = useCallback(
    async (id: string) => {
      await deleteSession(id);
      if (currentSessionId === id) {
        clearMessages();
      }
    },
    [deleteSession, currentSessionId, clearMessages]
  );

  const handleSend = useCallback(
    async (content: string) => {
      if (!currentSessionId) {
        try {
          await createSession("New Chat");
          await new Promise((r) => setTimeout(r, 50));
          await sendMessage(content, currentModel, customProviderInfo);
        } catch {
          // Error handled in hook
        }
        return;
      }
      await sendMessage(content, currentModel, customProviderInfo);
    },
    [currentSessionId, createSession, sendMessage, currentModel, customProviderInfo]
  );

  const handleSlashCommand = useCallback(
    async (command: string, args: string) => {
      switch (command) {
        case "/clear":
          clearMessages();
          setSystemMessage("Chat cleared.");
          break;

        case "/help": {
          const helpText = [
            "Available commands:",
            "  /clear    — Clear the current chat",
            "  /help     — Show available commands",
            "  /model    — Switch model (e.g., /model claude-opus-4-6)",
            "  /compact  — Compact/summarize conversation",
            "  /cost     — Show current session cost",
            "  /tools    — List available tools",
            "  /context  — Show context usage details",
            "  /review   — Ask AI to review code changes in this session",
            "  /status   — Show system status",
          ].join("\n");
          setSystemMessage(helpText);
          break;
        }

        case "/model": {
          if (!args.trim()) {
            const modelList = allModels
              .map((m) => `  ${m.id}  (${m.provider})`)
              .join("\n");
            setSystemMessage(`Available models:\n${modelList}`);
            break;
          }
          // Try to find model by partial match
          const match = allModels.find(
            (m) => m.id === args.trim() || m.name.toLowerCase() === args.trim().toLowerCase()
          );
          if (match) {
            setCurrentModel(match.id);
            setSystemMessage(`Model switched to ${match.name}`);
          } else {
            setSystemMessage(`Unknown model: ${args.trim()}. Type /model to see available models.`);
          }
          break;
        }

        case "/compact":
          if (currentSessionId && messages.length > 0) {
            setSystemMessage("Compacting conversation...");
            try {
              const messagesPayload = messages.map((m) => ({
                role: m.role,
                content: m.contentBlocks
                  ? m.contentBlocks
                      .filter((b) => b.type === "text")
                      .map((b) => b.text || "")
                      .join("")
                  : m.content,
              }));
              const res = await fetch("/api/compact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: messagesPayload, model: currentModel }),
              });
              if (res.ok) {
                const data = await res.json();
                if (data.compactedMessages) {
                  setMessages(
                    data.compactedMessages.map((msg: { id: string; role: string; content: string; timestamp: number }, idx: number) => ({
                      id: msg.id || `msg-${idx}`,
                      role: msg.role as "user" | "assistant",
                      content: msg.content,
                      timestamp: msg.timestamp || Date.now(),
                    }))
                  );
                  resetUsage();
                  setSystemMessage("Conversation compacted successfully.");
                }
              } else {
                setSystemMessage("Compaction failed.");
              }
            } catch {
              setSystemMessage("Compaction failed.");
            }
          } else {
            setSystemMessage("No conversation to compact.");
          }
          break;

        case "/cost": {
          const { inputTokens, outputTokens, cost } = usage;
          const costStr = cost < 0.01 ? `$${cost.toFixed(4)}` : `$${cost.toFixed(2)}`;
          setSystemMessage(
            `Session cost:\n  Input tokens:  ${inputTokens.toLocaleString()}\n  Output tokens: ${outputTokens.toLocaleString()}\n  Estimated cost: ${costStr}`
          );
          break;
        }

        case "/tools":
          setSystemMessage(
            `Available tools:\n${TOOL_NAMES.map((t) => `  ${t}`).join("\n")}`
          );
          break;

        case "/context": {
          const { inputTokens, outputTokens, cacheCreationInputTokens, cacheReadInputTokens } = usage;
          const totalInputTokens = inputTokens + cacheCreationInputTokens + cacheReadInputTokens;
          const totalTokens = totalInputTokens + outputTokens;
          const modelName = allModels.find((m) => m.id === currentModel)?.name || currentModel;
          const maxContext = getContextWindowSize(currentModel);
          const ctxPct = contextPercentage.toFixed(1);

          const warningState = calculateTokenWarningState(totalInputTokens, currentModel);
          const autoCompactThreshold = getAutoCompactThreshold(currentModel);
          const effectiveWindow = getEffectiveContextWindowSize(currentModel);

          const lines = [
            `Context Usage:`,
            `  Input tokens:           ${inputTokens.toLocaleString()}`,
            `  Cache creation tokens:  ${cacheCreationInputTokens.toLocaleString()}`,
            `  Cache read tokens:      ${cacheReadInputTokens.toLocaleString()}`,
            `  Output tokens:          ${outputTokens.toLocaleString()}`,
            `  Total input (context):  ${totalInputTokens.toLocaleString()}`,
            `  Total (all):            ${totalTokens.toLocaleString()}`,
            ``,
            `Context window: ${ctxPct}% of ${maxContext.toLocaleString()} (${modelName})`,
            `Effective window: ${effectiveWindow.toLocaleString()} tokens`,
            `Auto-compact at: ${autoCompactThreshold.toLocaleString()} tokens (${warningState.percentLeft}% remaining)`,
          ];

          if (warningState.isAboveWarningThreshold) {
            lines.push(``);
            lines.push(warningState.isAboveAutoCompactThreshold
              ? `⚠ Context exceeds auto-compact threshold`
              : `⚠ Context approaching limit`);
          }

          setSystemMessage(lines.join("\n"));
          break;
        }

        case "/review":
          if (currentSessionId && messages.length > 0) {
            sendMessage(
              "Review the code changes made in this session. Analyze each file modification for potential bugs, style issues, and improvements.",
              currentModel,
              customProviderInfo
            );
          } else {
            setSystemMessage("No conversation to review.");
          }
          break;

        case "/status": {
          const modelName = allModels.find((m) => m.id === currentModel)?.name || currentModel;
          // Fetch status info from API, then display
          fetch("/api/status")
            .then((res) => res.json())
            .then((data) => {
              const sandboxStr = data.sandboxEnabled ? "enabled" : "disabled";
              const mcpCount = data.mcpConnections ?? 0;
              const sessionId = currentSessionId || "none";
              setSystemMessage(
                `System Status:\nModel: ${modelName}\nPermission: ${permissionMode}\nSandbox: ${sandboxStr}\nMCP: ${mcpCount} connection${mcpCount !== 1 ? "s" : ""}\nSession: ${sessionId}`
              );
              setTimeout(() => setSystemMessage(null), 5000);
            })
            .catch(() => {
              const sessionId = currentSessionId || "none";
              setSystemMessage(
                `System Status:\nModel: ${modelName}\nPermission: ${permissionMode}\nSandbox: unknown\nMCP: unknown\nSession: ${sessionId}`
              );
              setTimeout(() => setSystemMessage(null), 5000);
            });
          return; // skip the auto-dismiss below since we handle it in the async callbacks
        }

        default:
          setSystemMessage(`Unknown command: ${command}. Type /help for available commands.`);
      }

      // Auto-dismiss system message after 5 seconds
      setTimeout(() => setSystemMessage(null), 5000);
    },
    [clearMessages, currentModel, currentSessionId, messages, sendMessage, usage, allModels, contextPercentage, permissionMode, setMessages, resetUsage, customProviderInfo]
  );

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }, []);

  const handleSettingsClick = useCallback(() => {
    router.push("/settings");
  }, [router]);

  const handleConfirmAllow = useCallback(
    (toolUseId: string, alwaysAllow?: boolean) => {
      confirmTool(toolUseId, true, alwaysAllow);
    },
    [confirmTool]
  );

  const handleConfirmDeny = useCallback(
    (toolUseId: string) => {
      confirmTool(toolUseId, false);
    },
    [confirmTool]
  );

  // Resolve model display name
  const currentModelName = allModels.find((m) => m.id === currentModel)?.name || currentModel;

  // Calculate total input token usage for token warning
  const totalInputTokens = usage.inputTokens + usage.cacheCreationInputTokens + usage.cacheReadInputTokens;

  return (
    <div className="flex h-screen overflow-hidden bg-background font-mono">
      {/* Sidebar */}
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        isLoading={isLoading}
        isCollapsed={sidebarCollapsed}
        onSelectSession={handleSelectSession}
        onCreateSession={handleCreateSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={renameSession}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onSettingsClick={handleSettingsClick}
        onLogout={handleLogout}
      />

      {/* Main content — continuous terminal session */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar with file tree toggle */}
        <div className="flex items-center border-b border-border px-2 py-1">
          <button
            onClick={() => setShowFileTree(!showFileTree)}
            className={`flex items-center gap-1 font-mono text-xs transition-colors ${
              showFileTree ? "text-terminal-cyan" : "text-muted-foreground/50 hover:text-foreground"
            }`}
            title={showFileTree ? "Hide file tree" : "Show file tree"}
          >
            <FolderTree className="size-3.5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* File tree panel */}
          {showFileTree && (
            <FileTreePanel tree={fileTree} onFileClick={handleFileClick} />
          )}

          {/* Chat area */}
          <ChatArea messages={messages} isStreaming={isStreaming} />
        </div>

        {/* System message — terminal echo line */}
        {systemMessage && (
          <div className="px-4 py-1.5 font-mono text-xs text-terminal-cyan/70 whitespace-pre-wrap">
            {systemMessage}
          </div>
        )}

        {/* Error bar */}
        {error && (
          <div className="px-4 py-1.5 text-sm text-destructive font-mono">
            {error}
          </div>
        )}

        {/* Token warning */}
        <TokenWarning tokenUsage={totalInputTokens} model={currentModel} />

        {/* Input area */}
        <div className="relative mt-auto">
          {/* Auto-approve toasts */}
          <AutoApproveToastContainer
            toasts={autoApproveToasts}
            onRemove={removeAutoApproveToast}
          />
          <ChatInput
            onSend={handleSend}
            onStop={stopStreaming}
            onSlashCommand={handleSlashCommand}
            isStreaming={isStreaming}
            disabled={false}
            permissionMode={permissionMode}
            onPermissionModeChange={setPermissionMode}
            currentModelName={currentModelName}
            currentModelId={currentModel}
            usage={usage}
            contextPercentage={contextPercentage}
            onProviderDialogOpen={() => setProviderDialogOpen(true)}
            models={allModels}
            onModelSelect={(modelId) => {
              setCurrentModel(modelId);
              if (modelProviderMap[modelId]) {
                setCustomProviderInfo(modelProviderMap[modelId]);
              } else {
                setCustomProviderInfo(null);
              }
              const modelName = allModels.find((m) => m.id === modelId)?.name || modelId;
              setSystemMessage(`Model switched to ${modelName}`);
              setTimeout(() => setSystemMessage(null), 3000);
            }}
          />
        </div>
      </div>

      {/* Tool confirmation dialog */}
      <ToolConfirmDialog
        confirmation={pendingConfirmation}
        onAllow={handleConfirmAllow}
        onDeny={handleConfirmDeny}
      />

      {/* Provider management dialog */}
      <ProviderDialog
        open={providerDialogOpen}
        onOpenChange={setProviderDialogOpen}
        onProvidersChange={refreshCustomModels}
      />
    </div>
  );
}
