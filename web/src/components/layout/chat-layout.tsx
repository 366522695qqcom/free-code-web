"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatArea } from "@/components/chat-area";
import { ToolConfirmDialog } from "@/components/chat/tool-confirm-dialog";
import { CostTracker } from "@/components/chat/cost-tracker";
import { useSessions } from "@/hooks/use-sessions";
import { useChat } from "@/hooks/use-chat";

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
  const [currentModel, setCurrentModel] = useState("claude-sonnet-4-20250514");
  const [username] = useState<string | undefined>();
  const [systemMessage, setSystemMessage] = useState<string | null>(null);
  const router = useRouter();

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
  } = useChat(currentSessionId);

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
          await sendMessage(content, currentModel);
        } catch {
          // Error handled in hook
        }
        return;
      }
      await sendMessage(content, currentModel);
    },
    [currentSessionId, createSession, sendMessage, currentModel]
  );

  const handleSlashCommand = useCallback(
    (command: string, args: string) => {
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
          ].join("\n");
          setSystemMessage(helpText);
          break;
        }

        case "/model": {
          if (!args.trim()) {
            const modelList = AVAILABLE_MODELS
              .map((m) => `  ${m.id}  (${m.provider})`)
              .join("\n");
            setSystemMessage(`Available models:\n${modelList}`);
            break;
          }
          // Try to find model by partial match
          const match = AVAILABLE_MODELS.find(
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
            sendMessage(
              "Please summarize our conversation so far in a concise way, preserving key context and decisions. This is a /compact command - output only the summary.",
              currentModel
            );
            setSystemMessage("Compacting conversation...");
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

        default:
          setSystemMessage(`Unknown command: ${command}. Type /help for available commands.`);
      }

      // Auto-dismiss system message after 5 seconds
      setTimeout(() => setSystemMessage(null), 5000);
    },
    [clearMessages, currentModel, currentSessionId, messages, sendMessage, usage]
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

  return (
    <div className="flex h-screen overflow-hidden bg-background">
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
      />

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <Topbar
          currentModel={currentModel}
          onModelChange={setCurrentModel}
          onSettingsClick={handleSettingsClick}
          onLogout={handleLogout}
          username={username}
          isStreaming={isStreaming}
        />

        {/* Chat area */}
        <ChatArea messages={messages} isStreaming={isStreaming} />

        {/* System message bar (for slash command feedback) */}
        {systemMessage && (
          <div className="border-t border-terminal-cyan/20 bg-terminal-cyan/5 px-4 py-2 font-mono text-xs text-terminal-cyan whitespace-pre-wrap">
            {systemMessage}
          </div>
        )}

        {/* Error bar */}
        {error && (
          <div className="border-t border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Input area */}
        <div className="relative">
          <ChatInput
            onSend={handleSend}
            onStop={stopStreaming}
            onSlashCommand={handleSlashCommand}
            isStreaming={isStreaming}
            disabled={false}
          />
          {/* Cost tracker in the bottom bar */}
          <div className="flex items-center justify-end px-4 pb-1.5">
            <CostTracker usage={usage} />
          </div>
        </div>
      </div>

      {/* Tool confirmation dialog */}
      <ToolConfirmDialog
        confirmation={pendingConfirmation}
        onAllow={handleConfirmAllow}
        onDeny={handleConfirmDeny}
      />
    </div>
  );
}
