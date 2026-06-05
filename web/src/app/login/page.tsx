import { Button } from "@/components/ui/button";
import { feature } from "@/lib/features";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Free Code
          </h1>
          <p className="text-sm text-muted-foreground">
            Self-hosted Claude Code web UI
          </p>
        </div>

        <form className="space-y-4" action="/api/auth/login" method="POST">
          <div className="space-y-2">
            <label
              htmlFor="username"
              className="text-sm font-medium text-foreground"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              autoComplete="username"
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="admin"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-foreground"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>

        {feature("ULTRAPLAN") && (
          <p className="text-center text-xs text-muted-foreground">
            🧠 ULTRAPLAN mode enabled
          </p>
        )}
      </div>
    </div>
  );
}
