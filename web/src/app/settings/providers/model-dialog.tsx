"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckIcon, Loader2 } from "lucide-react";

export interface ModelFormData {
  modelId: string;
  displayName: string;
  type: "chat" | "embedding" | "image";
  capabilities: string[];
  contextWindow: number | undefined;
  maxOutputTokens: number | undefined;
}

interface ModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<ModelFormData>;
  onSave: (data: ModelFormData) => void;
  onTest?: (data: ModelFormData) => Promise<{ success: boolean; error?: string }>;
  providerBaseUrl?: string;
  providerApiKey?: string;
}

export function ModelDialog({
  open,
  onOpenChange,
  initialData,
  onSave,
  onTest,
}: ModelDialogProps) {
  const [modelId, setModelId] = useState(initialData?.modelId || "");
  const [displayName, setDisplayName] = useState(initialData?.displayName || "");
  const [type, setType] = useState<ModelFormData["type"]>(initialData?.type || "chat");
  const [capabilities, setCapabilities] = useState<string[]>(initialData?.capabilities || []);
  const [contextWindow, setContextWindow] = useState<string>(
    initialData?.contextWindow?.toString() || ""
  );
  const [maxOutputTokens, setMaxOutputTokens] = useState<string>(
    initialData?.maxOutputTokens?.toString() || ""
  );
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);

  const handleCapabilityToggle = (cap: string) => {
    setCapabilities((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]
    );
  };

  const handleSave = () => {
    if (!modelId.trim()) return;
    onSave({
      modelId: modelId.trim(),
      displayName: displayName.trim() || "",
      type,
      capabilities,
      contextWindow: contextWindow ? parseInt(contextWindow) : undefined,
      maxOutputTokens: maxOutputTokens ? parseInt(maxOutputTokens) : undefined,
    });
    onOpenChange(false);
  };

  const handleTest = async () => {
    if (!onTest || !modelId.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const result = await onTest({
        modelId: modelId.trim(),
        displayName: displayName.trim(),
        type,
        capabilities,
        contextWindow: contextWindow ? parseInt(contextWindow) : undefined,
        maxOutputTokens: maxOutputTokens ? parseInt(maxOutputTokens) : undefined,
      });
      setTestResult(result);
    } catch {
      setTestResult({ success: false, error: "Test failed" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData?.modelId ? "编辑模型" : "新建模型"}</DialogTitle>
          <DialogDescription>
            配置模型参数和能力信息。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          {/* 模型ID */}
          <div className="grid gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              模型ID <span className="text-terminal-red">*</span>
            </Label>
            <Input
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              placeholder="gpt-4o"
              className="font-mono text-sm"
            />
          </div>

          {/* 显示名 */}
          <div className="grid gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              显示名 <span className="text-muted-foreground/50">(可选)</span>
            </Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="GPT-4o"
              className="text-sm"
            />
          </div>

          {/* 模型类型 */}
          <div className="grid gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">模型类型</Label>
            <Select value={type} onValueChange={(v) => setType(v as ModelFormData["type"])}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chat">聊天</SelectItem>
                <SelectItem value="embedding">嵌入</SelectItem>
                <SelectItem value="image">图像</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 能力复选框 */}
          <div className="grid gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">能力</Label>
            <div className="flex gap-3">
              {["vision", "reasoning", "tool_use"].map((cap) => (
                <button
                  key={cap}
                  type="button"
                  onClick={() => handleCapabilityToggle(cap)}
                  className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                    capabilities.includes(cap)
                      ? "border-terminal-cyan/50 bg-terminal-cyan/10 text-terminal-cyan"
                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span
                    className={`flex size-3.5 items-center justify-center rounded border ${
                      capabilities.includes(cap)
                        ? "border-terminal-cyan bg-terminal-cyan text-background"
                        : "border-muted-foreground/40"
                    }`}
                  >
                    {capabilities.includes(cap) && <CheckIcon className="size-2.5" />}
                  </span>
                  {cap === "vision" ? "视觉" : cap === "reasoning" ? "推理" : "工具使用"}
                </button>
              ))}
            </div>
          </div>

          {/* 上下文窗口 & 最大输出Token */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">上下文窗口</Label>
              <Input
                type="number"
                value={contextWindow}
                onChange={(e) => setContextWindow(e.target.value)}
                placeholder="128000"
                className="text-sm"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">最大输出Token</Label>
              <Input
                type="number"
                value={maxOutputTokens}
                onChange={(e) => setMaxOutputTokens(e.target.value)}
                placeholder="4096"
                className="text-sm"
              />
            </div>
          </div>

          {/* 测试结果 */}
          {testResult && (
            <div
              className={`rounded-md border px-3 py-2 text-xs ${
                testResult.success
                  ? "border-terminal-green/30 bg-terminal-green/5 text-terminal-green"
                  : "border-terminal-red/30 bg-terminal-red/5 text-terminal-red"
              }`}
            >
              {testResult.success ? "✓ 模型测试成功" : `✗ ${testResult.error || "测试失败"}`}
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            取消
          </DialogClose>
          {onTest && (
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={testing || !modelId.trim()}
            >
              {testing ? (
                <Loader2 className="mr-1 size-3.5 animate-spin" />
              ) : null}
              测试模型
            </Button>
          )}
          <Button onClick={handleSave} disabled={!modelId.trim()}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
