"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Server,
  Cpu,
  Palette,
  Box,
  Shield,
  MessageSquare,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const SIDEBAR_ITEMS = [
  { icon: Cpu, label: "对话设置", href: "/settings" },
  { icon: Server, label: "模型提供商", href: "/settings/providers" },
  { icon: Palette, label: "外观", href: "/settings" },
  { icon: Box, label: "沙箱", href: "/settings" },
  { icon: Shield, label: "权限", href: "/settings" },
  { icon: MessageSquare, label: "会话", href: "/settings" },
  { icon: Info, label: "关于", href: "/settings" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

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
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = item.href === "/settings/providers"
              ? pathname === "/settings/providers"
              : pathname === "/settings" && item.href === "/settings";
            return (
              <button
                key={item.label}
                onClick={() => router.push(item.href)}
                className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="size-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
