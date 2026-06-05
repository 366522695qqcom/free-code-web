"use client";

import { useEffect, useState } from "react";
import { ChatLayout } from "@/components/layout/chat-layout";
import { TooltipProvider } from "@/components/ui/tooltip";

interface UserInfo {
  username: string;
}

export default function Home() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        } else {
          window.location.href = "/login";
        }
      })
      .catch(() => {
        window.location.href = "/login";
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="font-mono text-sm text-terminal-green">$</span>
          <span className="font-mono text-sm">Loading...</span>
          <span className="inline-block size-2 animate-cursor-blink bg-terminal-green" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <TooltipProvider>
      <ChatLayout />
    </TooltipProvider>
  );
}
