"use client";

import { useEffect, useState } from "react";
import { CheckCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AutoApproveToastProps {
  toolName: string;
  reason: string;
  onClose: () => void;
}

export function AutoApproveToast({ toolName, reason, onClose }: AutoApproveToastProps) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border border-accent-green/20 bg-accent-green/5 px-3 py-2",
        "animate-message-in"
      )}
    >
      <CheckCircle className="mt-0.5 size-3.5 shrink-0 text-accent-green" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs text-accent-green">
            Auto-approved: {toolName}
          </span>
          {reason && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="shrink-0 text-text-muted hover:text-text-primary transition-colors"
            >
              <ChevronDown
                className={cn(
                  "size-3 transition-transform",
                  expanded && "rotate-180"
                )}
              />
            </button>
          )}
        </div>
        {expanded && reason && (
          <p className="mt-1 font-mono text-[11px] text-text-muted">
            {reason}
          </p>
        )}
      </div>
    </div>
  );
}

export interface AutoApproveToastData {
  id: string;
  toolName: string;
  reason: string;
}

interface AutoApproveToastContainerProps {
  toasts: AutoApproveToastData[];
  onRemove: (id: string) => void;
}

export function AutoApproveToastContainer({
  toasts,
  onRemove,
}: AutoApproveToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 px-4 pb-2">
      {toasts.map((toast) => (
        <AutoApproveToast
          key={toast.id}
          toolName={toast.toolName}
          reason={toast.reason}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}
