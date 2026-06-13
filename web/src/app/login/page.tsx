"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0F172A] p-4 overflow-hidden">
      {/* Animated grid overlay */}
      <div
        className="login-grid pointer-events-none absolute inset-0"
        aria-hidden="true"
      />

      {/* Glassmorphism login card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[400px] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-brand/10"
      >
        <div className="p-10">
          {/* Brand header */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <BrandHeader size="lg" subtitle="Self-hosted Claude Code" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-medium text-text-subtle">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                className="bg-white/5 border-white/10 rounded-xl text-text-subtle placeholder:text-text-subtle focus:border-brand/50 focus:ring-2 focus:ring-brand/20 focus:shadow-[0_0_12px_rgba(16,185,129,0.15)] transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium text-text-subtle">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="bg-white/5 border-white/10 rounded-xl text-text-subtle placeholder:text-text-subtle focus:border-brand/50 focus:ring-2 focus:ring-brand/20 focus:shadow-[0_0_12px_rgba(16,185,129,0.15)] transition-all duration-200"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-accent-red/20 bg-accent-red/10 px-3 py-2 text-xs text-accent-red">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-brand to-emerald-400 py-2.5 text-sm font-medium text-white hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-[10px] text-text-subtle font-mono">
            Free Code · {new Date().getFullYear()}
          </p>
        </div>
      </motion.div>

      {/* Grid animation styles */}
      <style jsx>{`
        .login-grid {
          background-image:
            linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: grid-move 20s linear infinite;
        }
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(40px, 40px); }
        }
      `}</style>
    </div>
  );
}
