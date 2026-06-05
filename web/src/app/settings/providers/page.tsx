"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Server,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  X,
  Loader2,
  Cpu,
  Palette,
  MessageSquare,
  Box,
  Shield,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModelDialog, type ModelFormData } from "./model-dialog";

interface CustomModel {
  id: string;
  modelId: string;
  displayName?: string;
  type: "chat" | "embedding" | "image";
  capabilities: string[];
  contextWindow?: number;
  maxOutputTokens?: number;
}

interface CustomProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  apiPath: string;
  models: CustomModel[];
  createdAt: string;
  updatedAt: string;
}

interface FetchedModel {
  id: string;
  owned_by?: string;
}

type ConnectionStatus = "idle" | "testing" | "connected" | "error";

const SIDEBAR_ITEMS = [
  { icon: Server, label: "模型提供商", href: "/settings/providers", active: true },
  { icon: Cpu, label: "对话设置", href: "/settings", active: false },
  { icon: Palette, label: "外观", href: "/settings", active: false },
  { icon: Box, label: "沙箱", href: "/settings", active: false },
  { icon: Shield, label: "权限", href: "/settings", active: false },
  { icon: MessageSquare, label: "会话", href: "/settings", active: false },
  { icon: Info, label: "关于", href: "/settings", active: false },
];

export default function ProvidersPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<CustomProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form state for adding/editing provider
  const [formName, setFormName] = useState("");
  const [formBaseUrl, setFormBaseUrl] = useState("");
  const [formApiKey, setFormApiKey] = useState("");
  const [formApiPath, setFormApiPath] = useState("/chat/completions");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Connection test
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Fetched models
  const [fetchedModels, setFetchedModels] = useState<FetchedModel[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedFetchedModels, setSelectedFetchedModels] = useState<Set<string>>(new Set());

  // Model dialog
  const [modelDialogOpen, setModelDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<Partial<ModelFormData> | undefined>(undefined);

  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch("/api/providers");
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProviders();
  }, [fetchProviders]);

  const selectedProvider = providers.find((p) => p.id === selectedProviderId) || null;

  const resetForm = () => {
    setFormName("");
    setFormBaseUrl("");
    setFormApiKey("");
    setFormApiPath("/chat/completions");
    setShowApiKey(false);
    setConnectionStatus("idle");
    setConnectionError(null);
    setFetchedModels([]);
    setFetchError(null);
    setSelectedFetchedModels(new Set());
    setIsEditing(false);
  };

  const handleAddProvider = () => {
    resetForm();
    setIsAdding(true);
    setSelectedProviderId(null);
  };

  const handleEditProvider = (provider: CustomProvider) => {
    setFormName(provider.name);
    setFormBaseUrl(provider.baseUrl);
    setFormApiKey(""); // Don't prefill API key (it's masked)
    setFormApiPath(provider.apiPath);
    setShowApiKey(false);
    setConnectionStatus("idle");
    setConnectionError(null);
    setFetchedModels([]);
    setFetchError(null);
    setSelectedFetchedModels(new Set());
    setIsEditing(true);
    setSelectedProviderId(provider.id);
  };

  const handleCancelForm = () => {
    resetForm();
    setIsAdding(false);
    setSelectedProviderId(null);
  };

  const handleSaveProvider = async () => {
    if (!formName.trim() || !formBaseUrl.trim()) return;

    if (isEditing && selectedProviderId) {
      const updates: Record<string, string> = {
        name: formName.trim(),
        baseUrl: formBaseUrl.trim(),
        apiPath: formApiPath.trim(),
      };
      if (formApiKey.trim()) {
        updates.apiKey = formApiKey.trim();
      }
      const res = await fetch(`/api/providers/${selectedProviderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        await fetchProviders();
        setIsEditing(false);
      }
    } else {
      if (!formApiKey.trim()) return;
      const res = await fetch("/api/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          baseUrl: formBaseUrl.trim(),
          apiKey: formApiKey.trim(),
          apiPath: formApiPath.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        await fetchProviders();
        setIsAdding(false);
        resetForm();
        if (data.provider?.id) {
          setSelectedProviderId(data.provider.id);
        }
      }
    }
  };

  const handleDeleteProvider = async (id: string) => {
    const res = await fetch(`/api/providers/${id}`, { method: "DELETE" });
    if (res.ok) {
      if (selectedProviderId === id) {
        setSelectedProviderId(null);
        resetForm();
        setIsAdding(false);
      }
      await fetchProviders();
    }
  };

  const handleTestConnection = async () => {
    // If adding new provider, need to save first or test with form data
    const providerId = selectedProviderId;
    if (!providerId) return;

    setConnectionStatus("testing");
    setConnectionError(null);
    try {
      const res = await fetch(`/api/providers/${providerId}/test`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setConnectionStatus("connected");
      } else {
        setConnectionStatus("error");
        setConnectionError(data.error || "连接失败");
      }
    } catch {
      setConnectionStatus("error");
      setConnectionError("请求失败");
    }
  };

  const handleFetchModels = async () => {
    const providerId = selectedProviderId;
    if (!providerId) return;

    setFetchingModels(true);
    setFetchError(null);
    setFetchedModels([]);
    setSelectedFetchedModels(new Set());

    try {
      const res = await fetch(`/api/providers/${providerId}/models`);
      const data = await res.json();
      if (res.ok) {
        setFetchedModels(data.models || []);
      } else {
        setFetchError(data.error || "获取模型列表失败");
      }
    } catch {
      setFetchError("请求失败");
    } finally {
      setFetchingModels(false);
    }
  };

  const handleToggleFetchedModel = (modelId: string) => {
    setSelectedFetchedModels((prev) => {
      const next = new Set(prev);
      if (next.has(modelId)) {
        next.delete(modelId);
      } else {
        next.add(modelId);
      }
      return next;
    });
  };

  const handleAddSelectedModels = async () => {
    const providerId = selectedProviderId;
    if (!providerId || selectedFetchedModels.size === 0) return;

    for (const modelId of selectedFetchedModels) {
      await fetch(`/api/providers/${providerId}/models/manage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId,
          type: "chat",
          capabilities: [],
        }),
      });
    }

    setSelectedFetchedModels(new Set());
    setFetchedModels([]);
    await fetchProviders();
  };

  const handleNewModel = () => {
    setEditingModel(undefined);
    setModelDialogOpen(true);
  };

  const handleSaveModel = async (data: ModelFormData) => {
    const providerId = selectedProviderId;
    if (!providerId) return;

    await fetch(`/api/providers/${providerId}/models/manage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    await fetchProviders();
  };

  const handleTestModel = async (data: ModelFormData): Promise<{ success: boolean; error?: string }> => {
    const providerId = selectedProviderId;
    if (!providerId || !selectedProvider) return { success: false, error: "未选择提供商" };

    try {
      const baseUrl = selectedProvider.baseUrl.replace(/\/+$/, "");
      const apiPath = selectedProvider.apiPath || "/chat/completions";
      const url = `${baseUrl}${apiPath}`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${formApiKey || "••••••••"}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: data.modelId,
          messages: [{ role: "user", content: "Hi" }],
          max_tokens: 5,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (res.ok) {
        return { success: true };
      }
      const text = await res.text().catch(() => "");
      return { success: false, error: `HTTP ${res.status}: ${text.slice(0, 100)}` };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "测试失败" };
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    const providerId = selectedProviderId;
    if (!providerId) return;

    await fetch(`/api/providers/${providerId}/models/manage?modelId=${encodeURIComponent(modelId)}`, {
      method: "DELETE",
    });
    await fetchProviders();
  };

  const showConfigPanel = isAdding || isEditing || selectedProvider;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="font-mono text-sm text-terminal-green">$</span>
          <span className="font-mono text-sm">Loading...</span>
          <span className="inline-block size-2 animate-cursor-blink bg-terminal-green" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Sidebar */}
      <div className="flex w-52 shrink-0 flex-col border-r border-border bg-background">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => router.push("/")}
            title="返回聊天"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-sm font-medium">设置</h1>
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-0.5 p-2">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                item.active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="size-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6 p-6">
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-terminal-green">$</span>
            <h2 className="text-lg font-medium">模型提供商</h2>
          </div>

          {/* Provider List Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="size-4 text-terminal-cyan" />
                  <CardTitle>已添加服务商</CardTitle>
                </div>
                <Button size="sm" variant="outline" onClick={handleAddProvider}>
                  <Plus className="mr-1 size-3.5" />
                  添加提供商
                </Button>
              </div>
              <CardDescription>
                管理自定义模型提供商，连接 OpenAI 兼容 API。
              </CardDescription>
            </CardHeader>
            <CardContent>
              {providers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Server className="mb-2 size-8 opacity-30" />
                  <p className="text-sm">暂无提供商</p>
                  <p className="text-xs text-muted-foreground/60">
                    点击上方按钮添加第一个模型提供商
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {providers.map((provider) => (
                    <div
                      key={provider.id}
                      className={`flex items-center justify-between rounded-lg border px-4 py-3 transition-colors cursor-pointer ${
                        selectedProviderId === provider.id && !isAdding
                          ? "border-terminal-cyan/30 bg-terminal-cyan/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                      onClick={() => {
                        if (!isAdding) {
                          setSelectedProviderId(provider.id);
                          setIsEditing(false);
                          resetForm();
                          setConnectionStatus("idle");
                          setFetchedModels([]);
                          setFetchError(null);
                        }
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{provider.name}</span>
                          <span className="rounded bg-terminal-cyan/10 px-1.5 py-0.5 text-[0.6rem] text-terminal-cyan">
                            {provider.models.length} 模型
                          </span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground font-mono">
                          {provider.baseUrl}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-3">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditProvider(provider);
                          }}
                          title="编辑"
                        >
                          <Edit className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProvider(provider.id);
                          }}
                          title="删除"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Provider Configuration Section */}
          {showConfigPanel && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Server className="size-4 text-terminal-cyan" />
                  <CardTitle>
                    {isAdding ? "添加提供商" : isEditing ? "编辑提供商" : selectedProvider?.name || "提供商配置"}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Name */}
                  {(isAdding || isEditing) && (
                    <div className="grid gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">名称</Label>
                      <Input
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="My Provider"
                      />
                    </div>
                  )}

                  {/* BaseURL */}
                  <div className="grid gap-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">BaseURL</Label>
                    <Input
                      value={isAdding || isEditing ? formBaseUrl : (selectedProvider?.baseUrl || "")}
                      onChange={(e) => setFormBaseUrl(e.target.value)}
                      placeholder="https://api.openai.com/v1"
                      readOnly={!isAdding && !isEditing}
                      className="font-mono text-sm"
                    />
                  </div>

                  {/* API Key */}
                  <div className="grid gap-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">API Key</Label>
                    <div className="relative">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        value={isAdding || isEditing ? formApiKey : "••••••••"}
                        onChange={(e) => setFormApiKey(e.target.value)}
                        placeholder={isEditing ? "留空则保持不变" : "sk-..."}
                        readOnly={!isAdding && !isEditing}
                        className="pr-9 font-mono text-sm"
                      />
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                        onClick={() => setShowApiKey(!showApiKey)}
                        title={showApiKey ? "隐藏" : "显示"}
                      >
                        {showApiKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </Button>
                    </div>
                  </div>

                  {/* API Path */}
                  <div className="grid gap-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">API路径</Label>
                    <Input
                      value={isAdding || isEditing ? formApiPath : (selectedProvider?.apiPath || "")}
                      onChange={(e) => setFormApiPath(e.target.value)}
                      placeholder="/chat/completions"
                      readOnly={!isAdding && !isEditing}
                      className="font-mono text-sm"
                    />
                  </div>

                  {/* Connection status indicator */}
                  {connectionStatus !== "idle" && (
                    <div
                      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${
                        connectionStatus === "testing"
                          ? "border-terminal-amber/30 bg-terminal-amber/5 text-terminal-amber"
                          : connectionStatus === "connected"
                            ? "border-terminal-green/30 bg-terminal-green/5 text-terminal-green"
                            : "border-terminal-red/30 bg-terminal-red/5 text-terminal-red"
                      }`}
                    >
                      {connectionStatus === "testing" && <Loader2 className="size-3.5 animate-spin" />}
                      {connectionStatus === "connected" && <Check className="size-3.5" />}
                      {connectionStatus === "error" && <X className="size-3.5" />}
                      {connectionStatus === "testing" && "正在测试连接..."}
                      {connectionStatus === "connected" && "连接成功"}
                      {connectionStatus === "error" && (connectionError || "连接失败")}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    {(isAdding || isEditing) && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelForm}
                        >
                          取消
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveProvider}
                          disabled={
                            isAdding
                              ? !formName.trim() || !formBaseUrl.trim() || !formApiKey.trim()
                              : !formName.trim() || !formBaseUrl.trim()
                          }
                        >
                          保存
                        </Button>
                      </>
                    )}
                    {!(isAdding || isEditing) && selectedProviderId && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleTestConnection}
                          disabled={connectionStatus === "testing"}
                        >
                          {connectionStatus === "testing" ? (
                            <Loader2 className="mr-1 size-3.5 animate-spin" />
                          ) : null}
                          测试连接
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleFetchModels}
                          disabled={fetchingModels}
                        >
                          {fetchingModels ? (
                            <Loader2 className="mr-1 size-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="mr-1 size-3.5" />
                          )}
                          获取模型
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleNewModel}
                        >
                          <Plus className="mr-1 size-3.5" />
                          新建模型
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fetched Models Section */}
          {fetchedModels.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <RefreshCw className="size-4 text-terminal-cyan" />
                  <CardTitle>可用模型</CardTitle>
                </div>
                <CardDescription>
                  从提供商 API 获取的模型列表，勾选后点击添加。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {fetchedModels.map((model) => {
                    const alreadyAdded = selectedProvider?.models.some(
                      (m) => m.modelId === model.id
                    );
                    return (
                      <div
                        key={model.id}
                        className={`flex items-center gap-3 rounded-md border px-3 py-2 transition-colors ${
                          alreadyAdded
                            ? "border-border/50 bg-muted/30 opacity-60"
                            : selectedFetchedModels.has(model.id)
                              ? "border-terminal-cyan/30 bg-terminal-cyan/5"
                              : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <button
                          type="button"
                          disabled={alreadyAdded}
                          onClick={() => handleToggleFetchedModel(model.id)}
                          className={`flex size-4 items-center justify-center rounded border transition-colors ${
                            alreadyAdded
                              ? "border-terminal-green bg-terminal-green text-background"
                              : selectedFetchedModels.has(model.id)
                                ? "border-terminal-cyan bg-terminal-cyan text-background"
                                : "border-muted-foreground/40 hover:border-muted-foreground"
                          }`}
                        >
                          {(selectedFetchedModels.has(model.id) || alreadyAdded) && (
                            <Check className="size-3" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <span className="font-mono text-sm">{model.id}</span>
                          {model.owned_by && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({model.owned_by})
                            </span>
                          )}
                        </div>
                        {alreadyAdded && (
                          <span className="text-[0.6rem] text-terminal-green">已添加</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {selectedFetchedModels.size > 0 && (
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      已选择 {selectedFetchedModels.size} 个模型
                    </span>
                    <Button size="sm" onClick={handleAddSelectedModels}>
                      <Plus className="mr-1 size-3.5" />
                      添加选中的模型
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Fetch error */}
          {fetchError && (
            <div className="rounded-lg border border-terminal-red/30 bg-terminal-red/5 px-4 py-3 text-sm text-terminal-red">
              {fetchError}
            </div>
          )}

          {/* Existing Models for selected provider */}
          {selectedProvider && selectedProvider.models.length > 0 && !isAdding && !isEditing && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Cpu className="size-4 text-terminal-cyan" />
                  <CardTitle>已添加模型</CardTitle>
                </div>
                <CardDescription>
                  {selectedProvider.name} 的模型列表。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {selectedProvider.models.map((model) => (
                    <div
                      key={model.id}
                      className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{model.modelId}</span>
                          {model.displayName && (
                            <span className="text-xs text-muted-foreground">
                              ({model.displayName})
                            </span>
                          )}
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[0.6rem] text-muted-foreground">
                            {model.type === "chat" ? "聊天" : model.type === "embedding" ? "嵌入" : "图像"}
                          </span>
                          {model.capabilities.map((cap) => (
                            <span
                              key={cap}
                              className="rounded bg-terminal-cyan/10 px-1.5 py-0.5 text-[0.6rem] text-terminal-cyan"
                            >
                              {cap === "vision" ? "视觉" : cap === "reasoning" ? "推理" : "工具使用"}
                            </span>
                          ))}
                        </div>
                        {(model.contextWindow || model.maxOutputTokens) && (
                          <div className="mt-0.5 flex gap-3 text-[0.65rem] text-muted-foreground">
                            {model.contextWindow && <span>上下文: {model.contextWindow.toLocaleString()}</span>}
                            {model.maxOutputTokens && <span>最大输出: {model.maxOutputTokens.toLocaleString()}</span>}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleDeleteModel(model.id)}
                        title="删除模型"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Model Dialog */}
      <ModelDialog
        open={modelDialogOpen}
        onOpenChange={setModelDialogOpen}
        initialData={editingModel}
        onSave={handleSaveModel}
        onTest={selectedProviderId ? handleTestModel : undefined}
      />
    </div>
  );
}
