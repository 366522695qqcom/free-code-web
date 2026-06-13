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

  // Models come exclusively from configured providers
  const allModels: EnhancedModelOption[] = customModels.map((m) => ({
    ...m,
    capabilities: (m as EnhancedModelOption).capabilities || [],
  }));

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
    <div className="flex h-11 items-center justify-between border-b border-border-subtle bg-base/80 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        {/* Model selector */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-sm font-normal text-text-muted hover:text-text-primary"
            >
              <Cpu className="size-3.5" />
              <span>{selectedModel?.name || currentModel}</span>
              {selectedModel?.capabilities?.length ? (
                <span className="rounded bg-accent-cyan/10 px-1 py-0.5 text-[0.6rem] text-accent-cyan">
                  {selectedModel.capabilities[0]}
                </span>
              ) : null}
              <ChevronDown className="size-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {customModels.length === 0 && (
              <div className="px-3 py-4 text-center text-[10px] text-text-muted">
                还没有文字模型
              </div>
            )}
            {Object.entries(modelGroups).map(([provider, models], groupIdx) => (
              <div key={provider}>
                {groupIdx > 0 && <DropdownMenuSeparator />}
                <div className="px-2 py-1.5 text-[0.65rem] font-medium uppercase tracking-wider text-text-muted/60">
                  {provider}
                </div>
                {models.map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => onModelChange(model.id)}
                    className={currentModel === model.id ? "bg-overlay" : ""}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{model.name}</span>
                      {model.capabilities?.map((cap) => (
                        <span
                          key={cap}
                          className="rounded bg-accent-cyan/10 px-1 py-0.5 text-[0.6rem] text-accent-cyan"
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
          <span className="flex items-center gap-1.5 text-xs text-accent-cyan">
            <span className="inline-block size-1.5 animate-pulse rounded-full bg-accent-cyan" />
            Streaming
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {username && (
          <span className="text-xs text-text-muted">
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
