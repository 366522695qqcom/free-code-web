"use client"

import type React from "react"

const TABS = [
  { label: "…wn skill ultraplan error — cli-dev", active: false, bell: true },
  { label: "…ode — ✳ Free Code — cli-dev", active: true, bell: false },
  { label: "…ROGRAM=Apple_Terminal …", active: false, bell: false },
]

function FolderIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2Z" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a6 6 0 0 0-6 6c0 4-1.5 5.5-2 6.5h16c-.5-1-2-2.5-2-6.5a6 6 0 0 0-6-6Zm0 20a3 3 0 0 0 3-3H9a3 3 0 0 0 3 3Z" />
    </svg>
  )
}

export function TerminalWindow({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-4xl overflow-hidden rounded-xl border border-term-border bg-term-bg shadow-2xl shadow-black/60">
      {/* 标题栏 */}
      <div className="relative flex h-10 items-center bg-term-titlebar px-4">
        {/* 红绿灯 */}
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-traffic-red" />
          <span className="h-3 w-3 rounded-full bg-traffic-yellow" />
          <span className="h-3 w-3 rounded-full bg-traffic-green" />
        </div>
        {/* 居中标题 */}
        <div className="pointer-events-none absolute inset-x-0 flex items-center justify-center gap-2 px-24 text-xs font-semibold text-term-text/80">
          <span className="text-term-blue/80">
            <FolderIcon />
          </span>
          <span className="truncate">claude-code — ✳ Free Code — cli-dev — 106×40</span>
        </div>
      </div>

      {/* 标签栏 */}
      <div className="flex items-stretch border-b border-term-border bg-term-titlebar/60 text-xs">
        {TABS.map((tab, i) => (
          <div
            key={i}
            className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 truncate border-r border-term-border px-3 py-2 ${
              tab.active
                ? "bg-term-tab-active text-term-text"
                : "bg-term-tab-inactive text-term-muted"
            }`}
          >
            <span className="truncate">{tab.label}</span>
            {tab.bell && (
              <span className="shrink-0 text-term-muted">
                <BellIcon />
              </span>
            )}
          </div>
        ))}
        <div className="flex items-center justify-center px-3 text-term-muted">+</div>
      </div>

      {/* 终端正文 */}
      <div className="max-h-[78vh] overflow-y-auto px-5 py-4 text-[13px] sm:text-sm">
        {children}
      </div>
    </div>
  )
}
