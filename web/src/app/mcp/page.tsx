"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
      <div className="flex min-h-screen items-center justify-center bg-base">
        <div className="flex items-center gap-2 text-text-muted">
          <span className="font-mono text-sm text-accent-green">$</span>
          <span className="font-mono text-sm">Loading...</span>
          <span className="inline-block size-2 animate-cursor-blink bg-accent-green" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="h-screen">
      <MCPPanel onBack={() => router.push("/")} />
    </motion.div>
  );
}
