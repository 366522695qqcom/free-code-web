"use client";

import {
  Settings,
  LogOut,
  ChevronDown,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export function Topbar({
  currentModel,
  onModelChange,
  onSettingsClick,
  onLogout,
  isStreaming,
  customModels = [],
}: TopbarProps) {
  const allModels: EnhancedModelOption[] = customModels.map((m) => ({
    ...m,
    capabilities: (m as EnhancedModelOption).capabilities || [],
  }));

  const modelGroups = allModels.reduce<Record<string, EnhancedModelOption[]>>(
    (acc, model) => {
      if (!acc[model.provider]) acc[model.provider] = [];
      acc[model.provider].push(model);
      return acc;
    },
    {} as Record<string, EnhancedModelOption[]>
  );

  const selectedModel = allModels.find((m) => m.id === currentModel);

  return (
    <div className="flex h-11 items-center justify-between border-b border-border-subtle bg-base/80 px-4 backdrop-blur-sm">
      {/* Left: Model selector */}
      <div className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-sm font-normal text-text-muted transition-colors duration-150 hover:text-brand"
            >
              <Cpu className="size-3.5 text-brand" />
              <span>{selectedModel?.name || currentModel}</span>
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
                    className={currentModel === model.id ? "bg-brand/10 text-brand" : ""}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{model.name}</span>
                      {model.capabilities?.map((cap) => (
                        <span
                          key={cap}
                          className="rounded bg-brand/10 px-1 py-0.5 text-[0.6rem] text-brand"
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
      </div>

      {/* Center: Streaming indicator */}
      <div className="flex items-center">
        {isStreaming && (
          <span className="flex items-center gap-1.5 text-xs">
            <span className="inline-block size-1.5 animate-pulse rounded-full bg-brand" />
            <span className="text-brand/70">Streaming</span>
          </span>
        )}
      </div>

      {/* Right: Settings + Logout */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onSettingsClick}
          title="Settings"
          className="size-8 rounded-lg text-text-muted transition-colors hover:bg-overlay/50 hover:text-text-primary"
        >
          <Settings className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onLogout}
          title="Sign out"
          className="size-8 rounded-lg text-text-muted transition-colors hover:bg-overlay/50 hover:text-text-primary"
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </div>
  );
}
