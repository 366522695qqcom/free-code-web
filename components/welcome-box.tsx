import { PixelMascot } from "./pixel-mascot"

export function WelcomeBox() {
  return (
    <div className="relative mt-2 rounded-sm border border-term-yellow/70 px-4 pb-5 pt-5 sm:px-6">
      {/* 顶部标题嵌在边框上 */}
      <span className="absolute -top-[0.7em] left-6 bg-term-bg px-2 text-xs text-term-yellow sm:text-sm">
        Free Code v2.1.87-dev.20260331.t152344.shafcf5ab7d
      </span>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto_1fr]">
        {/* 左侧：欢迎 + 吉祥物 */}
        <div className="flex flex-col items-center text-center">
          <p className="font-bold text-term-yellow">欢迎回来，Paolo！</p>
          <div className="my-4">
            <PixelMascot />
          </div>
          <p className="max-w-[22rem] text-pretty leading-relaxed text-term-text/80">
            Opus 4.6（100 万上下文）· Claude Max ·
            <br />
            paolo@gladium.ai 的组织
            <br />
            <span className="text-term-muted">~/Repos/claude-code</span>
          </p>
        </div>

        {/* 中间分隔竖线 */}
        <div className="hidden w-px bg-term-yellow/40 md:block" aria-hidden="true" />

        {/* 右侧：近期动态 / 新功能 */}
        <div className="flex flex-col gap-5 md:pl-2">
          <div>
            <p className="font-bold text-term-yellow">近期动态</p>
            <p className="text-term-text/80">暂无近期动态</p>
          </div>
          <div className="h-px w-full bg-term-yellow/40" aria-hidden="true" />
          <div>
            <p className="font-bold text-term-yellow">新功能</p>
            <p className="text-pretty text-term-text/80">
              查看 Free Code 更新日志了解最新内容
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
