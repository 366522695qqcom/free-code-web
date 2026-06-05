"use client";

import type { ToolConfirmation } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, Terminal, FileEdit, FilePen, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolConfirmDialogProps {
  confirmation: ToolConfirmation | null;
  onAllow: (toolUseId: string, alwaysAllow?: boolean) => void;
  onDeny: (toolUseId: string) => void;
}

function getRiskColor(level: "low" | "medium" | "high") {
  switch (level) {
    case "low":
      return "text-terminal-green";
    case "medium":
      return "text-terminal-amber";
    case "high":
      return "text-terminal-red";
  }
}

function getRiskBg(level: "low" | "medium" | "high") {
  switch (level) {
    case "low":
      return "bg-terminal-green/10 border-terminal-green/20";
    case "medium":
      return "bg-terminal-amber/10 border-terminal-amber/20";
    case "high":
      return "bg-terminal-red/10 border-terminal-red/20";
  }
}

function formatBashCommand(input: Record<string, unknown>): string {
  if (input.command) return String(input.command);
  return JSON.stringify(input, null, 2);
}

function formatFileEditPreview(input: Record<string, unknown>): {
  filePath: string;
  oldText: string;
  newText: string;
} {
  return {
    filePath: String(input.file_path || input.path || "unknown"),
    oldText: String(input.old_string || ""),
    newText: String(input.new_string || ""),
  };
}

function formatFileWritePreview(input: Record<string, unknown>): {
  filePath: string;
  content: string;
} {
  return {
    filePath: String(input.file_path || input.path || "unknown"),
    content: String(input.content || input.new_string || ""),
  };
}

function ToolIcon({ name }: { name: string }) {
  const lower = name.toLowerCase();
  if (lower.includes("bash") || lower.includes("shell") || lower.includes("exec")) {
    return <Terminal className="size-4 text-terminal-amber" />;
  }
  if (lower.includes("edit")) {
    return <FileEdit className="size-4 text-terminal-amber" />;
  }
  if (lower.includes("write")) {
    return <FilePen className="size-4 text-terminal-amber" />;
  }
  return <Shield className="size-4 text-terminal-amber" />;
}

export function ToolConfirmDialog({
  confirmation,
  onAllow,
  onDeny,
}: ToolConfirmDialogProps) {
  if (!confirmation) return null;

  const isBash =
    confirmation.toolName.toLowerCase().includes("bash") ||
    confirmation.toolName.toLowerCase().includes("shell");
  const isFileEdit = confirmation.toolName.toLowerCase().includes("edit");
  const isFileWrite = confirmation.toolName.toLowerCase().includes("write");

  return (
    <Dialog open={!!confirmation}>
      <DialogContent
        className="sm:max-w-lg border-border/50 bg-popover"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono text-sm">
            <ToolIcon name={confirmation.toolName} />
            <span>Tool Permission Request</span>
          </DialogTitle>
          <DialogDescription className="font-mono text-xs text-muted-foreground">
            The AI wants to execute a tool that requires your permission.
          </DialogDescription>
        </DialogHeader>

        {/* Risk level indicator */}
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2",
            getRiskBg(confirmation.riskLevel)
          )}
        >
          <AlertTriangle className={cn("size-4", getRiskColor(confirmation.riskLevel))} />
          <span className={cn("font-mono text-xs font-medium", getRiskColor(confirmation.riskLevel))}>
            Risk: {confirmation.riskLevel.toUpperCase()}
          </span>
          <span className="ml-auto font-mono text-xs text-muted-foreground">
            {confirmation.toolName}
          </span>
        </div>

        {/* Tool-specific preview */}
        <div className="rounded-lg border border-border/30 bg-black/40 overflow-hidden">
          {isBash && (
            <div className="p-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Terminal className="size-3" />
                <span>Command</span>
              </div>
              <div className="terminal-output text-muted-foreground">
                <span className="text-terminal-green">$ </span>
                {formatBashCommand(confirmation.input)}
              </div>
            </div>
          )}

          {isFileEdit && (() => {
            const { filePath, oldText, newText } = formatFileEditPreview(confirmation.input);
            return (
              <div>
                <div className="flex items-center gap-1.5 border-b border-border/30 px-3 py-1.5">
                  <FileEdit className="size-3 text-terminal-cyan" />
                  <span className="font-mono text-xs text-terminal-cyan truncate">
                    {filePath}
                  </span>
                </div>
                <div className="p-3 space-y-2">
                  {oldText && (
                    <div>
                      <span className="text-xs text-terminal-red font-mono">- old</span>
                      <div className="terminal-output text-terminal-red/80 bg-terminal-red/5 rounded p-1.5 mt-0.5">
                        {oldText.slice(0, 500)}
                        {oldText.length > 500 ? "\n..." : ""}
                      </div>
                    </div>
                  )}
                  {newText && (
                    <div>
                      <span className="text-xs text-terminal-green font-mono">+ new</span>
                      <div className="terminal-output text-terminal-green/80 bg-terminal-green/5 rounded p-1.5 mt-0.5">
                        {newText.slice(0, 500)}
                        {newText.length > 500 ? "\n..." : ""}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {isFileWrite && (() => {
            const { filePath, content } = formatFileWritePreview(confirmation.input);
            return (
              <div>
                <div className="flex items-center gap-1.5 border-b border-border/30 px-3 py-1.5">
                  <FilePen className="size-3 text-terminal-cyan" />
                  <span className="font-mono text-xs text-terminal-cyan truncate">
                    {filePath}
                  </span>
                </div>
                <div className="p-3">
                  <div className="terminal-output text-muted-foreground">
                    {content.slice(0, 500)}
                    {content.length > 500 ? "\n..." : ""}
                  </div>
                </div>
              </div>
            );
          })()}

          {!isBash && !isFileEdit && !isFileWrite && (
            <div className="p-3">
              <div className="terminal-output text-muted-foreground">
                {JSON.stringify(confirmation.input, null, 2).slice(0, 500)}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDeny(confirmation.toolUseId)}
            className="font-mono text-xs"
          >
            Deny
          </Button>
          <Button
            size="sm"
            onClick={() => onAllow(confirmation.toolUseId, true)}
            className="font-mono text-xs bg-terminal-amber/80 hover:bg-terminal-amber text-black"
          >
            Always Allow
          </Button>
          <Button
            size="sm"
            onClick={() => onAllow(confirmation.toolUseId, false)}
            className="font-mono text-xs bg-terminal-green/80 hover:bg-terminal-green text-black"
          >
            Allow
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
