"use client";

import { useEffect, useState } from "react";
import { MCPPanel } from "@/components/mcp/mcp-panel";
import { useRouter } from "next/navigation";

interface UserInfo {
  username: string;
}

export default function MCPPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        } else {
          router.push("/login");
        }
      })
      .catch(() => {
        router.push("/login");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

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
    <div className="h-screen">
      <MCPPanel onBack={() => router.push("/")} />
    </div>
  );
}
