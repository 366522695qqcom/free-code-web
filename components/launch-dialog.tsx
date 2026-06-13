"use client"

import { useEffect, useState } from "react"

const OPTIONS = ["启动 ultraplan", "取消"]

export function LaunchDialog() {
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault()
        setSelected((s) => (s === 0 ? 1 : 0))
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <section className="mt-6" aria-label="启动 ultraplan 对话框">
      {/* 顶部蓝色分隔线 */}
      <div className="mb-5 h-px w-full bg-term-blue" aria-hidden="true" />

      <h2 className="font-bold text-term-blue">启动 ultraplan？</h2>

      <p className="mt-4 max-w-3xl text-pretty leading-relaxed text-term-text/85">
        这将在网页端启动一个远程 Claude Code 会话，使用 Opus 起草一份高级计划。该计划
        通常需要 10–30 分钟。在此期间，你的终端仍可正常使用。
      </p>

      <p className="mt-4 text-term-muted">
        条款：
        <a
          href="https://code.claude.com/docs/en/claude-code-on-the-web"
          target="_blank"
          rel="noopener noreferrer"
          className="text-term-muted underline decoration-term-muted/50 underline-offset-2 hover:text-term-blue"
        >
          https://code.claude.com/docs/en/claude-code-on-the-web
        </a>
      </p>

      {/* 选项列表 */}
      <ul className="mt-6 flex flex-col gap-1">
        {OPTIONS.map((label, i) => {
          const active = selected === i
          return (
            <li key={label}>
              <button
                type="button"
                onClick={() => setSelected(i)}
                className={`flex w-full items-center gap-2 text-left transition-colors ${
                  active ? "text-term-blue" : "text-term-text/85 hover:text-term-text"
                }`}
              >
                <span className={active ? "text-term-blue" : "text-transparent"}>›</span>
                <span>
                  {i + 1}. {label}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <p className="mt-6 italic text-term-muted">Enter 确认 · Esc 取消</p>
    </section>
  )
}
