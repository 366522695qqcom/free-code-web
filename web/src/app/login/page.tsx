"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [bootLines, setBootLines] = useState<string[]>([]);

  // Boot sequence animation
  useEffect(() => {
    const lines = [
      "free-code v0.1.0",
      "initializing system...",
      "loading modules... ok",
      "establishing secure connection... ok",
      "ready.",
    ];
    let i = 0;
    const timer = setInterval(() => {
      if (i < lines.length) {
        setBootLines((prev) => [...prev, lines[i]]);
        i++;
      } else {
        clearInterval(timer);
      }
    }, 200);
    return () => clearInterval(timer);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        setShowSuccess(true);
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      } else {
        setError(data.error || "ACCESS DENIED");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-terminal-bg p-4 font-mono">
      <div className="w-full max-w-sm">
        {/* Terminal window frame */}
        <div className="border border-terminal-border bg-terminal-surface">
          {/* Title bar */}
          <div className="flex items-center gap-2 border-b border-terminal-border px-3 py-1.5">
            <div className="flex gap-1.5">
              <div className="size-2.5 rounded-full bg-terminal-red/60" />
              <div className="size-2.5 rounded-full bg-terminal-yellow/60" />
              <div className="size-2.5 rounded-full bg-terminal-green/60" />
            </div>
            <span className="text-[0.65rem] text-terminal-dim ml-2">
              free-code — login
            </span>
          </div>

          {/* Terminal content */}
          <div className="p-4 space-y-3">
            {/* Boot sequence */}
            {bootLines.map((line, i) => (
              <div key={i} className="text-xs text-terminal-dim animate-message-in">
                <span className="text-terminal-green">&gt;</span> {line}
              </div>
            ))}

            {showSuccess ? (
              <div className="animate-message-in text-xs text-terminal-green terminal-glow">
                <span className="text-terminal-green">&gt;</span> AUTHENTICATED
                <br />
                <span className="text-terminal-dim">redirecting...</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 pt-2">
                {/* Username field */}
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="username"
                    className="text-xs text-terminal-green shrink-0 terminal-glow"
                  >
                    &gt; Username:
                  </label>
                  <input
                    id="username"
                    type="text"
                    required
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="flex-1 bg-transparent text-xs text-foreground placeholder:text-terminal-dim/50 focus:outline-none border-b border-terminal-border focus:border-terminal-green pb-0.5"
                    placeholder="admin"
                    autoFocus
                  />
                </div>

                {/* Password field */}
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="password"
                    className="text-xs text-terminal-green shrink-0 terminal-glow"
                  >
                    &gt; Password:
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex-1 bg-transparent text-xs text-foreground placeholder:text-terminal-dim/50 focus:outline-none border-b border-terminal-border focus:border-terminal-green pb-0.5"
                    placeholder="••••••••"
                  />
                </div>

                {/* Error message */}
                {error && (
                  <div className="animate-message-in text-xs text-terminal-red">
                    <span className="text-terminal-red">&gt;</span> {error}
                  </div>
                )}

                {/* Submit button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-terminal-green/10 border border-terminal-green/30 text-terminal-green hover:bg-terminal-green/20 text-xs font-mono"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-cursor-blink">▌</span>
                      authenticating...
                    </span>
                  ) : (
                    "> login"
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-2 text-center text-[0.6rem] text-terminal-dim font-mono">
          self-hosted claude code web ui
        </div>
      </div>
    </div>
  );
}
