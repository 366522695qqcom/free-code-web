"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Cpu,
  Shield,
  MessageSquare,
  Info,
  Box,
  Plus,
  Trash2,
  AlertTriangle,
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { BrandHeader } from "@/components/ui/brand-header";
import { isTextModel } from "@/lib/providers/filter";

const TOOLS = [
  { id: "bash", name: "Bash", description: "执行 Shell 命令", defaultConfirm: true },
  { id: "write", name: "文件写入", description: "写入文件到磁盘", defaultConfirm: true },
  { id: "edit", name: "文件编辑", description: "编辑已有文件", defaultConfirm: false },
  { id: "webFetch", name: "Web 获取", description: "获取网页内容", defaultConfirm: false },
  { id: "webSearch", name: "Web 搜索", description: "搜索互联网", defaultConfirm: false },
];

const SANDBOX_RUNTIMES = [
  { id: "node26", name: "Node.js 26" },
  { id: "node24", name: "Node.js 24" },
  { id: "node22", name: "Node.js 22" },
  { id: "python3.13", name: "Python 3.13" },
];

const RISK_LEVELS = [
  { id: "low", name: "低" },
  { id: "high", name: "高" },
  { id: "outside-sandbox", name: "沙箱外" },
];

const PERMISSION_TOOLS = [
  { id: "all", name: "所有工具" },
  { id: "bash", name: "Bash" },
  { id: "file_read", name: "文件读取" },
  { id: "file_write", name: "文件写入" },
  { id: "file_edit", name: "文件编辑" },
  { id: "glob", name: "Glob" },
  { id: "grep", name: "Grep" },
];

interface CustomPermissionRule {
  id: string;
  pattern: string;
  riskLevel: string;
  applyToTool: string;
}

function getStoredValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

function setStoredValue<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
}

export default function SettingsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [defaultModel, setDefaultModel] = useState("");
  const [providerModels, setProviderModels] = useState<Array<{ id: string; name: string; provider: string }>>([]);
  const [autoTitle, setAutoTitle] = useState(true);
  const [toolConfirmations, setToolConfirmations] = useState<Record<string, boolean>>(() => {
    const defaults: Record<string, boolean> = {};
    TOOLS.forEach((t) => {
      defaults[t.id] = t.defaultConfirm;
    });
    return defaults;
  });

  // Sandbox state
  const [sandboxEnabled, setSandboxEnabled] = useState(false);
  const [sandboxRuntime, setSandboxRuntime] = useState("node24");
  const [sandboxVcpus, setSandboxVcpus] = useState(2);
  const [sandboxMemory, setSandboxMemory] = useState(4);
  const [sandboxTimeout, setSandboxTimeout] = useState(5);
  const [sandboxPersistent, setSandboxPersistent] = useState(true);

  // Custom permission rules
  const [customRules, setCustomRules] = useState<CustomPermissionRule[]>([]);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRulePattern, setNewRulePattern] = useState("");
  const [newRuleRiskLevel, setNewRuleRiskLevel] = useState("low");
  const [newRuleApplyToTool, setNewRuleApplyToTool] = useState("all");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setDefaultModel(getStoredValue("free-code-default-model", ""));
    setAutoTitle(getStoredValue("free-code-auto-title", true));
    setToolConfirmations(
      getStoredValue("free-code-tool-confirmations", Object.fromEntries(TOOLS.map((t) => [t.id, t.defaultConfirm])))
    );
    setSandboxEnabled(getStoredValue("free-code-sandbox-enabled", false));
    setSandboxRuntime(getStoredValue("free-code-sandbox-runtime", "node24"));
    setSandboxVcpus(getStoredValue("free-code-sandbox-vcpus", 2));
    setSandboxMemory(getStoredValue("free-code-sandbox-memory", 4));
    setSandboxTimeout(getStoredValue("free-code-sandbox-timeout", 5));
    setSandboxPersistent(getStoredValue("free-code-sandbox-persistent", true));
    setCustomRules(getStoredValue<CustomPermissionRule[]>("customPermissionRules", []));

    // Fetch configured providers → derive available models
    fetch("/api/providers")
      .then((res) => res.json())
      .then((data) => {
        if (data.providers) {
          const all: Array<{ id: string; name: string; provider: string }> = [];
          for (const p of data.providers) {
            for (const m of p.models || []) {
              if (!isTextModel(m)) continue;  // 新增：过滤掉 image/embedding
              all.push({ id: m.modelId, name: m.displayName || m.modelId, provider: p.name });
            }
          }
          setProviderModels(all);
        }
      })
      .catch(() => {
        // Ignore fetch errors — leave providerModels empty
      });
  }, []);

  const handleDefaultModelChange = (modelId: string | null) => {
    if (modelId) {
      setDefaultModel(modelId);
      setStoredValue("free-code-default-model", modelId);
    }
  };

  const handleAutoTitleChange = (checked: boolean) => {
    setAutoTitle(checked);
    setStoredValue("free-code-auto-title", checked);
  };

  const handleToolConfirmationChange = (toolId: string, checked: boolean) => {
    setToolConfirmations((prev) => {
      const next = { ...prev, [toolId]: checked };
      setStoredValue("free-code-tool-confirmations", next);
      return next;
    });
  };

  const handleSandboxEnabledChange = useCallback((checked: boolean) => {
    setSandboxEnabled(checked);
    setStoredValue("free-code-sandbox-enabled", checked);
  }, []);

  const handleSandboxRuntimeChange = useCallback((value: string | null) => {
    if (value) {
      setSandboxRuntime(value);
      setStoredValue("free-code-sandbox-runtime", value);
    }
  }, []);

  const handleSandboxVcpusChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(32, Math.max(1, parseInt(e.target.value) || 1));
    setSandboxVcpus(val);
    setStoredValue("free-code-sandbox-vcpus", val);
  }, []);

  const handleSandboxMemoryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(64, Math.max(2, parseInt(e.target.value) || 2));
    setSandboxMemory(val);
    setStoredValue("free-code-sandbox-memory", val);
  }, []);

  const handleSandboxTimeoutChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(300, Math.max(1, parseInt(e.target.value) || 1));
    setSandboxTimeout(val);
    setStoredValue("free-code-sandbox-timeout", val);
  }, []);

  const handleSandboxPersistentChange = useCallback((checked: boolean) => {
    setSandboxPersistent(checked);
    setStoredValue("free-code-sandbox-persistent", checked);
  }, []);

  const handleAddRule = useCallback(() => {
    if (!newRulePattern.trim()) return;
    const rule: CustomPermissionRule = {
      id: crypto.randomUUID(),
      pattern: newRulePattern.trim(),
      riskLevel: newRuleRiskLevel,
      applyToTool: newRuleApplyToTool,
    };
    const updated = [...customRules, rule];
    setCustomRules(updated);
    setStoredValue("customPermissionRules", updated);
    setNewRulePattern("");
    setNewRuleRiskLevel("low");
    setNewRuleApplyToTool("all");
    setShowAddRule(false);
  }, [newRulePattern, newRuleRiskLevel, newRuleApplyToTool, customRules]);

  const handleDeleteRule = useCallback((ruleId: string) => {
    const updated = customRules.filter((r) => r.id !== ruleId);
    setCustomRules(updated);
    setStoredValue("customPermissionRules", updated);
  }, [customRules]);

  const handleEditRulePattern = useCallback((ruleId: string, pattern: string) => {
    const updated = customRules.map((r) => (r.id === ruleId ? { ...r, pattern } : r));
    setCustomRules(updated);
    setStoredValue("customPermissionRules", updated);
  }, [customRules]);

  const handleEditRuleRiskLevel = useCallback((ruleId: string, riskLevel: string | null) => {
    if (!riskLevel) return;
    const updated = customRules.map((r) => (r.id === ruleId ? { ...r, riskLevel } : r));
    setCustomRules(updated);
    setStoredValue("customPermissionRules", updated);
  }, [customRules]);

  const handleEditRuleApplyToTool = useCallback((ruleId: string, applyToTool: string | null) => {
    if (!applyToTool) return;
    const updated = customRules.map((r) => (r.id === ruleId ? { ...r, applyToTool } : r));
    setCustomRules(updated);
    setStoredValue("customPermissionRules", updated);
  }, [customRules]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base">
        <div className="text-sm text-text-muted">加载中...</div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
    <div className="min-h-screen bg-base">
      {/* Header */}
      <div className="border-b border-border-subtle bg-base/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => router.push("/")}
            title="返回聊天"
          >
            <ArrowLeft className="size-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        <BrandHeader
          size="lg"
          subtitle="配置你的 Free Code 实例"
          className="mb-6"
        />
        {/* Model Providers */}
        <motion.div whileHover={{ y: -2, boxShadow: "0 8px 24px -4px rgba(16,185,129,0.08)" }} transition={{ duration: 0.15 }}>
        <Card className="border-border-subtle hover:border-brand/20 transition-colors duration-150">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="size-4 text-brand" />
              <CardTitle>模型提供商</CardTitle>
            </div>
            <CardDescription>
              管理自定义模型提供商，连接 OpenAI 兼容 API。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/settings/providers")}
            >
              <Server className="mr-1.5 size-3.5" />
              管理提供商
            </Button>
          </CardContent>
        </Card>
        </motion.div>

        {/* Model Selection */}
        <motion.div whileHover={{ y: -2, boxShadow: "0 8px 24px -4px rgba(16,185,129,0.08)" }} transition={{ duration: 0.15 }}>
        <Card className="border-border-subtle hover:border-brand/20 transition-colors duration-150">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cpu className="size-4 text-brand" />
              <CardTitle>模型</CardTitle>
            </div>
            <CardDescription>
              选择新对话的默认模型。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="default-model">默认模型</Label>
                <Select
                  value={defaultModel}
                  onValueChange={handleDefaultModelChange}
                >
                  <SelectTrigger id="default-model" className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(
                      providerModels.reduce((acc, m) => {
                        (acc[m.provider] ??= []).push(m);
                        return acc;
                      }, {} as Record<string, typeof providerModels>)
                    ).map(([providerName, models]) => (
                      <SelectGroup key={providerName}>
                        <SelectLabel>{providerName}</SelectLabel>
                        {models.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                    {providerModels.length === 0 && (
                      <div className="px-3 py-4 text-center text-xs text-text-muted">
                        还没有文字模型，请先在
                        <a href="/settings/providers" className="text-brand hover:underline mx-1">
                          模型提供商
                        </a>
                        添加 chat 类型模型
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* Sandbox Configuration */}
        <motion.div whileHover={{ y: -2, boxShadow: "0 8px 24px -4px rgba(16,185,129,0.08)" }} transition={{ duration: 0.15 }}>
        <Card className="border-border-subtle hover:border-brand/20 transition-colors duration-150">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Box className="size-4 text-brand" />
              <CardTitle>沙箱</CardTitle>
            </div>
            <CardDescription>
              配置 Vercel Sandbox 以在隔离环境中执行工具。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Enable Sandbox */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sandbox-enabled">启用沙箱</Label>
                  <p className="text-xs text-text-muted">
                    在隔离的 Vercel Sandbox 虚拟机中执行工具
                  </p>
                </div>
                <Switch
                  id="sandbox-enabled"
                  checked={sandboxEnabled}
                  onCheckedChange={handleSandboxEnabledChange}
                />
              </div>

              {sandboxEnabled && (
                <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-3 py-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-yellow-500" />
                    <p className="text-xs text-yellow-500/90">
                      启用沙箱后，工具将在隔离的 Vercel Sandbox 虚拟机中执行。请确保服务器环境变量中 SANDBOX_ENABLED 已设为 true。
                    </p>
                  </div>
                </div>
              )}

              <Separator />

              {/* Runtime */}
              <div className="flex items-center justify-between">
                <Label htmlFor="sandbox-runtime">运行时</Label>
                <Select
                  value={sandboxRuntime}
                  onValueChange={handleSandboxRuntimeChange}
                >
                  <SelectTrigger id="sandbox-runtime" className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SANDBOX_RUNTIMES.map((rt) => (
                      <SelectItem key={rt.id} value={rt.id}>
                        {rt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* vCPUs */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sandbox-vcpus">虚拟 CPU 数</Label>
                  <p className="text-xs text-text-muted">
                    虚拟 CPU 数量（1–32）
                  </p>
                </div>
                <Input
                  id="sandbox-vcpus"
                  type="number"
                  min={1}
                  max={32}
                  value={sandboxVcpus}
                  onChange={handleSandboxVcpusChange}
                  className="w-24 text-right"
                />
              </div>

              <Separator />

              {/* Memory */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sandbox-memory">内存 (GB)</Label>
                  <p className="text-xs text-text-muted">
                    分配内存（2–64 GB）
                  </p>
                </div>
                <Input
                  id="sandbox-memory"
                  type="number"
                  min={2}
                  max={64}
                  value={sandboxMemory}
                  onChange={handleSandboxMemoryChange}
                  className="w-24 text-right"
                />
              </div>

              <Separator />

              {/* Timeout */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sandbox-timeout">超时（分钟）</Label>
                  <p className="text-xs text-text-muted">
                    最大执行时间（1–300 分钟）
                  </p>
                </div>
                <Input
                  id="sandbox-timeout"
                  type="number"
                  min={1}
                  max={300}
                  value={sandboxTimeout}
                  onChange={handleSandboxTimeoutChange}
                  className="w-24 text-right"
                />
              </div>

              <Separator />

              {/* Persistent */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sandbox-persistent">持久化</Label>
                  <p className="text-xs text-text-muted">
                    在工具调用之间保持沙箱存活
                  </p>
                </div>
                <Switch
                  id="sandbox-persistent"
                  checked={sandboxPersistent}
                  onCheckedChange={handleSandboxPersistentChange}
                />
              </div>

              <p className="text-[0.65rem] text-text-muted/50">
                沙箱的启用/禁用由服务器环境变量 SANDBOX_ENABLED 控制。上方的开关反映的是你的客户端偏好设置。
              </p>
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* Tool Permissions */}
        <motion.div whileHover={{ y: -2, boxShadow: "0 8px 24px -4px rgba(16,185,129,0.08)" }} transition={{ duration: 0.15 }}>
        <Card className="border-border-subtle hover:border-brand/20 transition-colors duration-150">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-brand" />
              <CardTitle>工具权限</CardTitle>
            </div>
            <CardDescription>
              配置哪些工具在执行前需要确认。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {TOOLS.map((tool, idx) => (
                <div key={tool.id}>
                  {idx > 0 && <Separator className="mb-4" />}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor={`tool-${tool.id}`}>{tool.name}</Label>
                      <p className="text-xs text-text-muted">
                        {tool.description}
                      </p>
                    </div>
                    <Switch
                      id={`tool-${tool.id}`}
                      checked={toolConfirmations[tool.id] ?? tool.defaultConfirm}
                      onCheckedChange={(checked: boolean) =>
                        handleToolConfirmationChange(tool.id, checked)
                      }
                    />
                  </div>
                </div>
              ))}
              <p className="text-[0.65rem] text-text-muted/50">
                启用后，该工具在每次执行前都会请求确认。
              </p>
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* Custom Permission Rules */}
        <motion.div whileHover={{ y: -2, boxShadow: "0 8px 24px -4px rgba(16,185,129,0.08)" }} transition={{ duration: 0.15 }}>
        <Card className="border-border-subtle hover:border-brand/20 transition-colors duration-150">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-brand" />
              <CardTitle>自定义权限规则</CardTitle>
            </div>
            <CardDescription>
              定义自定义规则以覆盖默认的工具执行风险评估。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customRules.length > 0 ? (
                customRules.map((rule, idx) => (
                  <div key={rule.id}>
                    {idx > 0 && <Separator className="mb-4" />}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-text-muted">匹配模式</Label>
                            <Input
                              value={rule.pattern}
                              onChange={(e) => handleEditRulePattern(rule.id, e.target.value)}
                              className="h-7 text-xs"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-text-muted">风险等级</Label>
                            <Select
                              value={rule.riskLevel}
                              onValueChange={(val) => handleEditRuleRiskLevel(rule.id, val)}
                            >
                              <SelectTrigger className="h-7 w-36 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {RISK_LEVELS.map((rl) => (
                                  <SelectItem key={rl.id} value={rl.id}>
                                    {rl.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-text-muted">适用工具</Label>
                            <Select
                              value={rule.applyToTool}
                              onValueChange={(val) => handleEditRuleApplyToTool(rule.id, val)}
                            >
                              <SelectTrigger className="h-7 w-36 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PERMISSION_TOOLS.map((pt) => (
                                  <SelectItem key={pt.id} value={pt.id}>
                                    {pt.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleDeleteRule(rule.id)}
                          title="删除规则"
                          className="mt-1 shrink-0 text-text-muted hover:text-accent-red"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-text-muted">
                  未定义自定义规则，将使用默认风险评估。
                </p>
              )}

              {showAddRule ? (
                <div className="space-y-3 rounded-lg border border-border-subtle p-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="shrink-0 text-xs text-text-muted">匹配模式</Label>
                      <Input
                        placeholder='e.g., "npm test"'
                        value={newRulePattern}
                        onChange={(e) => setNewRulePattern(e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="shrink-0 text-xs text-text-muted">风险等级</Label>
                      <Select
                        value={newRuleRiskLevel}
                        onValueChange={(val) => { if (val) setNewRuleRiskLevel(val); }}
                      >
                        <SelectTrigger className="h-7 w-36 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RISK_LEVELS.map((rl) => (
                            <SelectItem key={rl.id} value={rl.id}>
                              {rl.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="shrink-0 text-xs text-text-muted">适用工具</Label>
                      <Select
                        value={newRuleApplyToTool}
                        onValueChange={(val) => { if (val) setNewRuleApplyToTool(val); }}
                      >
                        <SelectTrigger className="h-7 w-36 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PERMISSION_TOOLS.map((pt) => (
                            <SelectItem key={pt.id} value={pt.id}>
                              {pt.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={handleAddRule}
                      disabled={!newRulePattern.trim()}
                      className="h-7 text-xs"
                    >
                      保存规则
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowAddRule(false)}
                      className="h-7 text-xs"
                    >
                      取消
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddRule(true)}
                  className="h-7 text-xs"
                >
                  <Plus className="mr-1 size-3" />
                  添加规则
                </Button>
              )}

              <p className="text-[0.65rem] text-text-muted/50">
                自定义规则会覆盖默认风险评估。规则存储在本地，并随工具确认请求一起发送。
              </p>
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* Session Settings */}
        <motion.div whileHover={{ y: -2, boxShadow: "0 8px 24px -4px rgba(16,185,129,0.08)" }} transition={{ duration: 0.15 }}>
        <Card className="border-border-subtle hover:border-brand/20 transition-colors duration-150">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-brand" />
              <CardTitle>会话</CardTitle>
            </div>
            <CardDescription>
              配置会话行为。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-title">自动生成标题</Label>
                <p className="text-xs text-text-muted">
                  根据第一条消息自动生成会话标题。
                </p>
              </div>
              <Switch
                id="auto-title"
                checked={autoTitle}
                onCheckedChange={handleAutoTitleChange}
              />
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* About */}
        <motion.div whileHover={{ y: -2, boxShadow: "0 8px 24px -4px rgba(16,185,129,0.08)" }} transition={{ duration: 0.15 }}>
        <Card className="border-border-subtle hover:border-brand/20 transition-colors duration-150">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="size-4 text-brand" />
              <CardTitle>关于</CardTitle>
            </div>
            <CardDescription>
              应用信息。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-xs text-text-muted">
              <div className="flex justify-between">
                <span>版本</span>
                <span className="text-text-primary">0.1.0</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span>仓库</span>
                <a
                  href="https://github.com/user/free-code"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:underline"
                >
                  GitHub
                </a>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span>许可证</span>
                <span className="text-text-primary">MIT</span>
              </div>
            </div>
          </CardContent>
        </Card>
        </motion.div>
      </div>
    </div>
    </motion.div>
  );
}
