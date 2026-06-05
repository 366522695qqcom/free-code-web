"use client";

import {
  Settings,
  LogOut,
  ChevronDown,
  Cpu,
  Sun,
  Moon,
  Monitor,
  Server,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import type { ModelOption } from "@/types";

interface TopbarProps {
  currentModel: string;
  onModelChange: (model: string) => void;
  onSettingsClick: () => void;
  onLogout: () => void;
  username?: string;
  isStreaming: boolean;
  customModels?: ModelOption[];
}

interface EnhancedModelOption extends ModelOption {
  capabilities?: string[];
}

const BUILT_IN_MODELS: EnhancedModelOption[] = [
  { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", provider: "Anthropic", capabilities: [] },
  { id: "claude-opus-4-20250514", name: "Claude Opus 4", provider: "Anthropic", capabilities: ["Extended Thinking"] },
  { id: "claude-haiku-3.5-20241022", name: "Claude 3.5 Haiku", provider: "Anthropic", capabilities: [] },
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", capabilities: [] },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", capabilities: [] },
  { id: "o3-mini", name: "o3-mini", provider: "OpenAI", capabilities: ["Reasoning"] },
];

function ThemeIcon({ theme }: { theme: string | undefined }) {
  switch (theme) {
    case "light":
      return <Sun className="size-4" />;
    case "dark":
      return <Moon className="size-4" />;
    default:
      return <Monitor className="size-4" />;
  }
}

export function Topbar({
  currentModel,
  onModelChange,
  onSettingsClick,
  onLogout,
  username,
  isStreaming,
  customModels = [],
}: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  // Merge built-in and custom models
  const allModels: EnhancedModelOption[] = [
    ...BUILT_IN_MODELS,
    ...customModels.map((m) => ({
      ...m,
      capabilities: (m as EnhancedModelOption).capabilities || [],
    })),
  ];

  // Group models by provider
  const modelGroups = allModels.reduce<Record<string, EnhancedModelOption[]>>(
    (acc, model) => {
      if (!acc[model.provider]) acc[model.provider] = [];
      acc[model.provider].push(model);
      return acc;
    },
    {} as Record<string, EnhancedModelOption[]>
  );

  const selectedModel = allModels.find((m) => m.id === currentModel);

  const cycleTheme = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("system");
    else setTheme("dark");
  };

  return (
    <div className="flex h-11 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        {/* Model selector */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-sm font-normal text-muted-foreground hover:text-foreground"
            >
              <Cpu className="size-3.5" />
              <span>{selectedModel?.name || currentModel}</span>
              {selectedModel?.capabilities?.length ? (
                <span className="rounded bg-terminal-cyan/10 px-1 py-0.5 text-[0.6rem] text-terminal-cyan">
                  {selectedModel.capabilities[0]}
                </span>
              ) : null}
              <ChevronDown className="size-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {Object.entries(modelGroups).map(([provider, models], groupIdx) => (
              <div key={provider}>
                {groupIdx > 0 && <DropdownMenuSeparator />}
                <div className="px-2 py-1.5 text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground/60">
                  {provider}
                </div>
                {models.map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => onModelChange(model.id)}
                    className={currentModel === model.id ? "bg-accent" : ""}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{model.name}</span>
                      {model.capabilities?.map((cap) => (
                        <span
                          key={cap}
                          className="rounded bg-terminal-cyan/10 px-1 py-0.5 text-[0.6rem] text-terminal-cyan"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {isStreaming && (
          <span className="flex items-center gap-1.5 text-xs text-terminal-cyan">
            <span className="inline-block size-1.5 animate-pulse rounded-full bg-terminal-cyan" />
            Streaming
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {username && (
          <span className="text-xs text-muted-foreground">
            {username}
          </span>
        )}
        <Separator orientation="vertical" className="h-4" />
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={cycleTheme}
          title={`Theme: ${theme || "system"} (click to cycle)`}
        >
          <ThemeIcon theme={theme} />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => router.push("/mcp")}
          title="MCP Servers"
        >
          <Server className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onSettingsClick}
          title="Settings"
        >
          <Settings className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onLogout}
          title="Sign out"
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </div>
  );
}
