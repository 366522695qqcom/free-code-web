export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Free Code
        </h1>
        <p className="text-muted-foreground">
          Self-hosted Claude Code web UI
        </p>
        <a
          href="/login"
          className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          Sign in
        </a>
      </div>
    </div>
  );
}
