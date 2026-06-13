// 顶部构建命令的输出回放
export function TerminalOutput() {
  return (
    <div className="space-y-1 leading-relaxed">
      <p>
        <span className="text-term-text">[paolo@Mac claude-code % </span>
        <span className="text-term-text">npm run build:dev:full</span>
      </p>

      <p className="text-term-muted">
        &gt; claude-code-source-snapshot@2.1.87 build:dev:full
      </p>
      <p className="text-term-muted">
        &gt; bun run ./scripts/build.ts --dev --feature-set=dev-full
      </p>

      <div className="h-2" />

      <p>
        <span className="text-term-yellow">{"  [328ms]   "}</span>
        <span className="text-term-green">minify</span>
        <span className="text-term-text">{"  -33.24 MB "}</span>
        <span className="text-term-muted">(estimate)</span>
      </p>
      <p>
        <span className="text-term-yellow">{"  [2.939s]  "}</span>
        <span className="text-term-green">bundle</span>
        <span className="text-term-text">{"  5684 modules"}</span>
      </p>
      <p>
        <span className="text-term-yellow">{"  [328ms]   "}</span>
        <span className="text-term-green">compile</span>
        <span className="text-term-purple font-bold">{"  ./cli-dev"}</span>
      </p>
      <p className="text-term-text">Built ./cli-dev</p>
      <p>
        <span className="text-term-text">[paolo@Mac claude-code % </span>
        <span className="text-term-text">./cli-dev</span>
      </p>
    </div>
  )
}
