"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ArrowLeft,
  Cpu,
  Palette,
  Shield,
  MessageSquare,
  Info,
  Box,
  Plus,
  Trash2,
  AlertTriangle,
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

const MODELS = [
  { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", provider: "Anthropic" },
  { id: "claude-opus-4-20250514", name: "Claude Opus 4", provider: "Anthropic" },
  { id: "claude-haiku-3.5-20241022", name: "Claude 3.5 Haiku", provider: "Anthropic" },
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI" },
  { id: "o3-mini", name: "o3-mini", provider: "OpenAI" },
];

const TOOLS = [
  { id: "bash", name: "Bash", description: "Execute shell commands", defaultConfirm: true },
  { id: "write", name: "File Write", description: "Write files to disk", defaultConfirm: true },
  { id: "edit", name: "File Edit", description: "Edit existing files", defaultConfirm: false },
  { id: "webFetch", name: "Web Fetch", description: "Fetch web content", defaultConfirm: false },
  { id: "webSearch", name: "Web Search", description: "Search the web", defaultConfirm: false },
];

const SANDBOX_RUNTIMES = [
  { id: "node26", name: "Node.js 26" },
  { id: "node24", name: "Node.js 24" },
  { id: "node22", name: "Node.js 22" },
  { id: "python3.13", name: "Python 3.13" },
];

const RISK_LEVELS = [
  { id: "low", name: "Low" },
  { id: "high", name: "High" },
  { id: "outside-sandbox", name: "Outside Sandbox" },
];

const PERMISSION_TOOLS = [
  { id: "all", name: "All Tools" },
  { id: "bash", name: "Bash" },
  { id: "file_read", name: "File Read" },
  { id: "file_write", name: "File Write" },
  { id: "file_edit", name: "File Edit" },
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
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [defaultModel, setDefaultModel] = useState("claude-sonnet-4-20250514");
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
    setDefaultModel(getStoredValue("free-code-default-model", "claude-sonnet-4-20250514"));
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
  }, []);

  const handleDefaultModelChange = (modelId: string | null) => {
    if (modelId) {
      setDefaultModel(modelId);
      setStoredValue("free-code-default-model", modelId);
    }
  };

  const handleThemeChange = (value: string | null) => {
    if (value) setTheme(value);
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => router.push("/")}
            title="Back to chat"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-sm font-medium">Settings</h1>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        {/* Model Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cpu className="size-4 text-terminal-cyan" />
              <CardTitle>Model</CardTitle>
            </div>
            <CardDescription>
              Choose the default model for new conversations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="default-model">Default Model</Label>
                <Select
                  value={defaultModel}
                  onValueChange={handleDefaultModelChange}
                >
                  <SelectTrigger id="default-model" className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Anthropic</SelectLabel>
                      {MODELS.filter((m) => m.provider === "Anthropic").map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>OpenAI</SelectLabel>
                      {MODELS.filter((m) => m.provider === "OpenAI").map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theme */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="size-4 text-terminal-cyan" />
              <CardTitle>Theme</CardTitle>
            </div>
            <CardDescription>
              Customize the appearance of the application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="theme-select">Color Theme</Label>
              <Select
                value={theme || "dark"}
                onValueChange={handleThemeChange}
              >
                <SelectTrigger id="theme-select" className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sandbox Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Box className="size-4 text-terminal-cyan" />
              <CardTitle>Sandbox</CardTitle>
            </div>
            <CardDescription>
              Configure Vercel Sandbox for isolated tool execution.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Enable Sandbox */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sandbox-enabled">Enable Sandbox</Label>
                  <p className="text-xs text-muted-foreground">
                    Execute tools in an isolated Vercel Sandbox VM
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
                      Enabling sandbox will execute tools in an isolated Vercel Sandbox VM. Make sure SANDBOX_ENABLED is set to true in your server environment variables.
                    </p>
                  </div>
                </div>
              )}

              <Separator />

              {/* Runtime */}
              <div className="flex items-center justify-between">
                <Label htmlFor="sandbox-runtime">Runtime</Label>
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
                  <Label htmlFor="sandbox-vcpus">vCPUs</Label>
                  <p className="text-xs text-muted-foreground">
                    Number of virtual CPUs (1–32)
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
                  <Label htmlFor="sandbox-memory">Memory (GB)</Label>
                  <p className="text-xs text-muted-foreground">
                    Allocated memory (2–64 GB)
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
                  <Label htmlFor="sandbox-timeout">Timeout (minutes)</Label>
                  <p className="text-xs text-muted-foreground">
                    Maximum execution time (1–300 min)
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
                  <Label htmlFor="sandbox-persistent">Persistent</Label>
                  <p className="text-xs text-muted-foreground">
                    Keep sandbox alive between tool calls
                  </p>
                </div>
                <Switch
                  id="sandbox-persistent"
                  checked={sandboxPersistent}
                  onCheckedChange={handleSandboxPersistentChange}
                />
              </div>

              <p className="text-[0.65rem] text-muted-foreground/50">
                Sandbox enable/disable is controlled by the SANDBOX_ENABLED server environment variable. The switch above reflects your client-side preference.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tool Permissions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-terminal-cyan" />
              <CardTitle>Tool Permissions</CardTitle>
            </div>
            <CardDescription>
              Configure which tools require confirmation before execution.
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
                      <p className="text-xs text-muted-foreground">
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
              <p className="text-[0.65rem] text-muted-foreground/50">
                When enabled, the tool will ask for confirmation before each execution.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Custom Permission Rules */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-terminal-cyan" />
              <CardTitle>Custom Permission Rules</CardTitle>
            </div>
            <CardDescription>
              Define custom rules to override default risk assessments for tool execution.
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
                            <Label className="text-xs text-muted-foreground">Pattern</Label>
                            <Input
                              value={rule.pattern}
                              onChange={(e) => handleEditRulePattern(rule.id, e.target.value)}
                              className="h-7 text-xs"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">Risk Level</Label>
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
                            <Label className="text-xs text-muted-foreground">Apply to Tool</Label>
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
                          title="Delete rule"
                          className="mt-1 shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">
                  No custom rules defined. Default risk assessments will be used.
                </p>
              )}

              {showAddRule ? (
                <div className="space-y-3 rounded-lg border border-border p-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="shrink-0 text-xs text-muted-foreground">Pattern</Label>
                      <Input
                        placeholder='e.g., "npm test"'
                        value={newRulePattern}
                        onChange={(e) => setNewRulePattern(e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="shrink-0 text-xs text-muted-foreground">Risk Level</Label>
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
                      <Label className="shrink-0 text-xs text-muted-foreground">Apply to Tool</Label>
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
                      Save Rule
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowAddRule(false)}
                      className="h-7 text-xs"
                    >
                      Cancel
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
                  Add Rule
                </Button>
              )}

              <p className="text-[0.65rem] text-muted-foreground/50">
                Custom rules override default risk assessments. Rules are stored locally and sent with tool confirmation requests.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Session Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-terminal-cyan" />
              <CardTitle>Session</CardTitle>
            </div>
            <CardDescription>
              Configure session behavior.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-title">Auto-generate titles</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically generate session titles from the first message.
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

        {/* About */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="size-4 text-terminal-cyan" />
              <CardTitle>About</CardTitle>
            </div>
            <CardDescription>
              Application information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Version</span>
                <span className="text-foreground">0.1.0</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span>Repository</span>
                <a
                  href="https://github.com/user/free-code"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-terminal-cyan hover:underline"
                >
                  GitHub
                </a>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span>License</span>
                <span className="text-foreground">MIT</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
