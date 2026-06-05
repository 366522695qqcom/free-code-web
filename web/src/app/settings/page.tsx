"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ArrowLeft, Cpu, Palette, Shield, MessageSquare, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setDefaultModel(getStoredValue("free-code-default-model", "claude-sonnet-4-20250514"));
    setAutoTitle(getStoredValue("free-code-auto-title", true));
    setToolConfirmations(
      getStoredValue("free-code-tool-confirmations", Object.fromEntries(TOOLS.map((t) => [t.id, t.defaultConfirm])))
    );
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
