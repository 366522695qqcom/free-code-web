"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { BrandHeader } from "@/components/ui/brand-header";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Login failed");
        return;
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-brand-soft p-4">
      <Card className="w-full max-w-[360px] border-border-subtle/60 shadow-card-hover">
        <div className="p-8">
          <div className="mb-6 flex flex-col items-center gap-2">
            <BrandHeader size="lg" subtitle="Self-hosted Claude Code" />
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-medium text-text-muted">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                className="rounded-lg focus-visible:ring-2 focus-visible:ring-brand focus-visible:border-brand transition-all duration-150"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium text-text-muted">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="rounded-lg focus-visible:ring-2 focus-visible:ring-brand focus-visible:border-brand transition-all duration-150"
              />
            </div>
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-accent-red/15/5 px-3 py-2 text-xs text-accent-red">
                {error}
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand text-white hover:bg-brand/90 transition-all duration-150"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
          <p className="mt-6 text-center text-[10px] text-text-muted font-mono">
            Free Code · {new Date().getFullYear()}
          </p>
        </div>
      </Card>
    </div>
  );
}
