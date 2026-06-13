"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
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
import { isTextModel } from "@/lib/providers/filter";

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

  // 小屏自动折叠侧边栏
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && !sidebarCollapsed) {
        setSidebarCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [sidebarCollapsed]);
  const [showFileTree, setShowFileTree] = useState(true);
  const [currentModel, setCurrentModel] = useState("");
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
              if (!isTextModel(model)) continue;  // 新增：过滤掉 image/embedding
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

  // Models are sourced exclusively from configured providers (no built-in fallback)
  const allModels = useMemo(() => customModels, [customModels]);

  const {
    messages,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    clearMessages,
    setMessages,
    setUsage,
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

  // Token used to prevent race conditions when the user clicks multiple
  // sessions in quick succession. Only the most recent fetch is allowed
  // to write to state.
  const sessionLoadTokenRef = useRef(0);

  const handleSelectSession = useCallback(
    (id: string) => {
      // Same session — nothing to do
      if (id === currentSessionId) return;

      // 1. Flip the id so the useChat sync effect clears the old state
      setCurrentSessionId(id);
      // 2. Belt-and-suspenders: also clear here so the UI does not flash
      //    the previous session's messages before the fetch resolves.
      clearMessages();
      // 3. Abort any in-flight stream from the previous session
      stopStreaming();

      // 4. Load the new session's messages (guarded by token)
      const token = ++sessionLoadTokenRef.current;
      fetch(`/api/sessions/${id}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to load session: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (token !== sessionLoadTokenRef.current) return; // superseded
          if (data.messages && Array.isArray(data.messages)) {
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
                  ? (msg.content as Record<string, unknown>[]).map(
                      (block: Record<string, unknown>) => {
                        if (block.type === "text")
                          return { type: "text" as const, text: block.text as string };
                        if (block.type === "thinking")
                          return { type: "thinking" as const, text: block.thinking as string || block.text as string };
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
                        if (block.type === "tool_result")
                          return {
                            type: "tool_result" as const,
                            toolResult: {
                              toolUseId: block.tool_use_id as string,
                              output: block.content as string,
                              isError: block.is_error as boolean,
                            },
                            status: block.is_error ? "error" as const : "done" as const,
                          };
                        return { type: "text" as const, text: "" };
                      }
                    )
                  : undefined,
              })
            );
            setMessages(enhancedMsgs);
          }
          // Restore token usage from the loaded session
          if (data.tokenUsage) {
            const tu = data.tokenUsage as Record<string, unknown>;
            setUsage({
              inputTokens: Number(tu.inputTokens) || 0,
              outputTokens: Number(tu.outputTokens) || 0,
              cacheCreationInputTokens: Number(tu.cacheCreationInputTokens) || 0,
              cacheReadInputTokens: Number(tu.cacheReadInputTokens) || 0,
              cost: Number(tu.cost) || 0,
            });
          } else {
            resetUsage();
          }
        })
        .catch((err) => {
          if (token !== sessionLoadTokenRef.current) return;
          console.error("Failed to load session", err);
          setSystemMessage("无法加载会话消息");
          setTimeout(() => setSystemMessage(null), 5000);
        });
    },
    [
      currentSessionId,
      setCurrentSessionId,
      clearMessages,
      stopStreaming,
      setMessages,
      setUsage,
      resetUsage,
      setSystemMessage,
    ]
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

  // Refs mirror latest model + provider state so handleSend never reads stale closure
  const currentModelRef = useRef(currentModel);
  const customProviderInfoRef = useRef(customProviderInfo);
  useEffect(() => {
    currentModelRef.current = currentModel;
    customProviderInfoRef.current = customProviderInfo;
  }, [currentModel, customProviderInfo]);

  const handleSend = useCallback(
    async (content: string) => {
      const modelId = currentModelRef.current;
      const provider = customProviderInfoRef.current;
      if (!currentSessionId) {
        try {
          await createSession("New Chat");
          await new Promise((r) => setTimeout(r, 100));
          await sendMessage(content, modelId, provider);
        } catch {
          // Error handled in hook
        }
        return;
      }
      await sendMessage(content, modelId, provider);
    },
    [currentSessionId, createSession, sendMessage]
  );

  const handleSlashCommand = useCallback(
    async (command: string, args: string) => {
      switch (command) {
        case "/清空":
          clearMessages();
          setSystemMessage("对话已清空。");
          break;

        case "/帮助": {
          const helpText = [
            "可用命令：",
            "  /清空      — 清空当前对话",
            "  /帮助      — 显示可用命令",
            "  /模型      — 切换模型（如 /模型 claude-sonnet-4）",
            "  /压缩      — 压缩/总结当前对话",
            "  /费用      — 显示当前会话费用",
            "  /工具      — 列出可用工具",
            "  /上下文    — 显示上下文使用情况",
            "  /审查      — 让 AI 审查本会话的代码变更",
            "  /状态      — 显示系统状态",
            "  /权限      — 切换权限模式（默认/规划/接受编辑/全部放行）",
          ].join("\n");
          setSystemMessage(helpText);
          break;
        }

        case "/模型": {
          if (!args.trim()) {
            const modelList = allModels
              .map((m) => `  ${m.id}  (${m.provider})`)
              .join("\n");
            setSystemMessage(`可用模型：\n${modelList}`);
            break;
          }
          // Try to find model by partial match
          const match = allModels.find(
            (m) => m.id === args.trim() || m.name.toLowerCase() === args.trim().toLowerCase()
          );
          if (match) {
            setCurrentModel(match.id);
            setSystemMessage(`已切换到模型 ${match.name}`);
          } else {
            setSystemMessage(`未知模型: ${args.trim()}。输入 /模型 查看可用模型。`);
          }
          break;
        }

        case "/压缩":
          if (currentSessionId && messages.length > 0) {
            setSystemMessage("正在压缩对话...");
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
                  setSystemMessage("对话压缩成功。");
                }
              } else {
                setSystemMessage("压缩失败。");
              }
            } catch {
              setSystemMessage("压缩失败。");
            }
          } else {
            setSystemMessage("没有可压缩的对话。");
          }
          break;

        case "/费用": {
          const { inputTokens, outputTokens, cost } = usage;
          const costStr = cost < 0.01 ? `$${cost.toFixed(4)}` : `$${cost.toFixed(2)}`;
          setSystemMessage(
            `当前会话费用：\n  输入 Token：  ${inputTokens.toLocaleString()}\n  输出 Token： ${outputTokens.toLocaleString()}\n  预估费用： ${costStr}`
          );
          break;
        }

        case "/工具":
          setSystemMessage(
            `可用工具：\n${TOOL_NAMES.map((t) => `  ${t}`).join("\n")}`
          );
          break;

        case "/上下文": {
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
            `上下文使用情况：`,
            `  输入 Token：           ${inputTokens.toLocaleString()}`,
            `  缓存写入 Token：  ${cacheCreationInputTokens.toLocaleString()}`,
            `  缓存读取 Token：      ${cacheReadInputTokens.toLocaleString()}`,
            `  输出 Token：          ${outputTokens.toLocaleString()}`,
            `  输入合计（上下文）：  ${totalInputTokens.toLocaleString()}`,
            `  全部合计：            ${totalTokens.toLocaleString()}`,
            ``,
            `上下文窗口：${ctxPct}% / ${maxContext.toLocaleString()}（${modelName}）`,
            `有效窗口：${effectiveWindow.toLocaleString()} Token`,
            `自动压缩阈值：${autoCompactThreshold.toLocaleString()} Token（剩余 ${warningState.percentLeft}%）`,
          ];

          if (warningState.isAboveWarningThreshold) {
            lines.push(``);
            lines.push(warningState.isAboveAutoCompactThreshold
              ? `⚠ 上下文已超过自动压缩阈值`
              : `⚠ 上下文接近上限`);
          }

          setSystemMessage(lines.join("\n"));
          break;
        }

        case "/审查":
          if (currentSessionId && messages.length > 0) {
            sendMessage(
              "Review the code changes made in this session. Analyze each file modification for potential bugs, style issues, and improvements.",
              currentModel,
              customProviderInfo
            );
          } else {
            setSystemMessage("没有可审查的对话。");
          }
          break;

        case "/状态": {
          const modelName = allModels.find((m) => m.id === currentModel)?.name || currentModel;
          // Fetch status info from API, then display
          fetch("/api/status")
            .then((res) => res.json())
            .then((data) => {
              const sandboxStr = data.sandboxEnabled ? "已启用" : "未启用";
              const mcpCount = data.mcpConnections ?? 0;
              const sessionId = currentSessionId || "无";
              setSystemMessage(
                `系统状态：\n模型：${modelName}\n权限模式：${permissionMode}\n沙箱：${sandboxStr}\nMCP：${mcpCount} 个连接\n会话：${sessionId}`
              );
              setTimeout(() => setSystemMessage(null), 5000);
            })
            .catch(() => {
              const sessionId = currentSessionId || "无";
              setSystemMessage(
                `系统状态：\n模型：${modelName}\n权限模式：${permissionMode}\n沙箱：未知\nMCP：未知\n会话：${sessionId}`
              );
              setTimeout(() => setSystemMessage(null), 5000);
            });
          return; // skip the auto-dismiss below since we handle it in the async callbacks
        }

        default:
          setSystemMessage(`未知命令: ${command}。输入 /帮助 查看可用命令。`);
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
    <div className="flex h-screen overflow-hidden bg-base font-mono">
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
        <div className="flex items-center border-b border-border-subtle px-2 py-1">
          <button
            onClick={() => setShowFileTree(!showFileTree)}
            className={`flex items-center gap-1 font-mono text-xs transition-colors ${
              showFileTree ? "text-accent-cyan" : "text-text-muted/50 hover:text-text-primary"
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
          <div className="px-4 py-1.5 font-mono text-xs text-accent-cyan/70 whitespace-pre-wrap">
            {systemMessage}
          </div>
        )}

        {/* Error bar */}
        {error && (
          <div className="px-4 py-1.5 text-sm text-accent-red font-mono">
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
