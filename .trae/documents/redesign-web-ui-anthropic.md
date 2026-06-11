# Web 端全 UI 大改版（Anthropic 极简品牌风）Plan

> **范围**：重设计 web 端 4 个关键页（登录页 / 侧边栏+顶栏 / Chat 消息区 / Provider 卡片），按 Anthropic claude.ai 极简品牌风改造。
> **基调**：Anthropic 品牌橙 `#d97757` 为主色、深棕/灰黑背景、棁色为辅助色、绿/红保留为状态色。
> **主题优先级**：Dark 模式优先优化，浅色模式按 dark 模式反转得到。
> **约束**：karpathy-guidelines "Simplicity First / Surgical Changes / Goal-Driven"；只动 web 端；不引入新依赖；不改核心交互逻辑。

---

## Summary

把当前 web 端从"shadcn/ui 默认灰 + 自定义 terminal-cyan/green/amber/red 极客风"全面切换到 **Anthropic 极简品牌风**：

- **品牌色系统**：保留 4 档状态色（绿/红/橙黄/棁色）做"信号灯"，主操作/激活态/brand header 改用 Anthropic 橙 `#d97757`（浅）/ `#e08769`（深）
- **字体系统**：当前是 Geist Mono（`font-mono` 全局），新版改为 Geist Sans（更现代、更接近 claude.ai 主体）作为正文，Geist Mono 保留给代码块/路径/ID/技术字段
- **圆角系统**：当前 `rounded-md` / `rounded-lg` 混用，新版统一到 `rounded-xl`（卡片）/ `rounded-lg`（输入/按钮）/ `rounded-full`（徽标）
- **间距系统**：保持 4px 网格，不变
- **动画**：在 hover/active/focus 状态加 150ms ease 过渡（卡片上浮 1px + 边框变色）

**4 个重点页面**全部重设计（不是改色，是重新排版 + 视觉重做）：

1. **登录页** `/login`：满屏 radial 渐变背景 + 中心 360×400 卡片 + 顶部 `▌ Free Code` brand header + 输入框 focus 时橙色 ring
2. **侧边栏 + 顶栏**：侧边栏加 `▌` brand logo、session 列表的 `>` 指示器在选中时 brand 橙、Quick Settings 顶栏卡片
3. **Chat 消息区**：assistant 消息气泡加 brand 边框 + hover 上浮、tool use block 加状态点（橙点 = pending / 绿 = done / 红 = error）、空状态加 brand 插图
4. **Provider 卡片**：credit-card 风格，hover 上浮 2px + brand 边框、模型数量徽标

---

## Current State Analysis

### 现有色板

**`web/src/app/globals.css`** 定义：
- `--terminal-green` `oklch(0.72 0.19 155)` — loading / 成功
- `--terminal-cyan` `oklch(0.75 0.15 200)` — 高亮 / icon（**最广用，42 处**）
- `--terminal-amber` `oklch(0.78 0.16 85)` — 警告
- `--terminal-red` `oklch(0.65 0.22 25)` — 错误
- `--brand` `oklch(0.65 0.13 50)` (浅) / `oklch(0.70 0.12 45)` (深) — Anthropic 橙（**已注入但只用于 /settings/providers**）
- 基础 shadcn tokens：--background / --card / --primary / --muted / --border

### 现有字体

**`web/src/app/layout.tsx`**：
- `Geist` Sans → `--font-geist-sans`
- `Geist_Mono` Mono → `--font-geist-mono`
- HTML 上加 `font-sans` 默认（但 chat-area / chat-input / sidebar 强制 `font-mono`）

**问题**：聊天界面是"终端风格"——所有文字 `font-mono`，像在终端里。这与 Anthropic 极简品牌风不符（claude.ai 是 sans-serif 正文 + mono 代码块）。

### 现有 118 处 terminal-* 用色分布

| 颜色 | 处数 | 主要用途 |
|---|---|---|
| terminal-cyan | 42 | Card icon、高亮、active 指示、focus 边 |
| terminal-green | 29 | loading `$` 前缀、连接成功、已添加 |
| terminal-amber | 10 | 警告 |
| terminal-red | 12 | 错误状态 |

### 4 个重点页的现状

1. **`/login` (99 行)**：极简卡片，bg-background + Card，蓝色 ring 焦点，无 brand header，无渐变
2. **`/settings/providers` (826 行)**：左侧 w-52 设置导航 + 右侧 max-w-3xl 列表 + config 面板。Provider 卡片是简单 border + hover
3. **`sidebar.tsx` (339 行)**：w-64，header "Chats" + 4 个 icon 按钮，搜索 + session 列表
4. **`chat-area.tsx` + `messages/`**：底部对齐的纯文本消息流，无气泡，无状态点

### 不在范围内（karpathy 原则：scope 保持最小）

- ❌ 不动 chat-input 的斜杠命令菜单（已极简）
- ❌ 不动 chat 的 streaming / SSE 逻辑
- ❌ 不动 API routes
- ❌ 不动 sessions / providers 持久化
- ❌ 不动 libSQL schema
- ❌ 不动 CLI 端
- ❌ 不引入 framer-motion / tailwindcss-animate / 新图标库

---

## Proposed Changes

### 变更总览

| # | 文件 | 类型 | 行数 | 范围 |
|---|---|---|---|---|
| 1 | `web/src/app/globals.css` | 重写 tokens | ~150 | 加 brand 色板、调整 background 渐变、focus ring、阴影 |
| 2 | `web/src/app/layout.tsx` | 微调 | ~5 | 移除默认 `font-sans`，让 chat 子布局控制字体 |
| 3 | `web/src/app/login/page.tsx` | **重写** | 99 → ~150 | 满屏渐变 + 中心卡片 + brand header |
| 4 | `web/src/app/settings/providers/page.tsx` | 视觉重做 | 826 → ~900 | credit-card 风格 Provider 卡片 |
| 5 | `web/src/components/layout/sidebar.tsx` | **重写** | 339 → ~400 | brand logo + 选中态 + Quick Settings 卡片 |
| 6 | `web/src/components/chat/chat-area.tsx` | 微调 | — | 加 message-fade-in 动画类（已有 keyframes） |
| 7 | `web/src/components/messages/assistant-message.tsx` | 视觉重做 | 41 → ~80 | 气泡 + 状态点 + hover |
| 8 | `web/src/components/messages/tool-use-block.tsx` | 视觉重做 | 167 → ~200 | 状态点（橙/绿/红） + brand header |
| 9 | `web/src/components/messages/tool-result-block.tsx` | 微调 | 151 → ~170 | 缩进 + brand 左边线 |
| 10 | `web/src/app/mcp/page.tsx` | 微调 | 55 | loading 状态加 brand `$` |
| 11 | `web/src/app/page.tsx` | 微调 | 54 | loading 状态加 brand `$` |
| 12 | `web/src/app/settings/providers/model-dialog.tsx` | 微调 | — | 焦点/边框 brand 化 |
| 13 | `web/src/app/settings/page.tsx` | 微调 | 810 | Card icon cyan → brand |
| 14 | `web/src/components/mcp/mcp-panel.tsx` | 微调 | — | loading 状态 brand |
| 15 | `web/src/components/chat/chat-input.tsx` | 微调 | 836 | focus 边框 brand、placeholder 文字 |

### 变更详情

#### 1. `web/src/app/globals.css` — 重写 token 系统（**核心**）

**新增 / 调整 CSS 变量**：

```css
@theme inline {
  /* ... 保留所有现有 token ... */
  --color-brand: var(--brand);
  --color-brand-soft: var(--brand-soft);   /* NEW: 棁色，浅 5% / 深 8% 透明度 */
  --color-brand-glow: var(--brand-glow);   /* NEW: 焦点光晕，orange 20% opacity */
  --font-sans: var(--font-geist-sans);
  --font-display: var(--font-geist-sans);  /* NEW: 显式定义 */
  --radius-card: 0.875rem;                  /* NEW: 14px 卡片圆角 */
}

:root {
  /* Light mode (浅色，Anthropic 风格白底）*/
  --background: oklch(0.985 0.005 60);     /* 暖白 */
  --card: oklch(1 0 0);
  --brand: oklch(0.65 0.13 50);            /* 品牌橙 #d97757 */
  --brand-soft: oklch(0.65 0.13 50 / 0.08); /* 8% 透明 */
  --brand-glow: oklch(0.65 0.13 50 / 0.18);
  --terminal-cyan: oklch(0.65 0.13 50);    /* 重映射到 brand，保持类名兼容 */
  /* green/red/amber 保留原值 */
}

.dark {
  --background: oklch(0.16 0.005 60);      /* 深棕黑（不是纯黑） */
  --card: oklch(0.20 0.005 60);
  --brand: oklch(0.70 0.12 45);            /* 浅品牌橙 #e08769 */
  --brand-soft: oklch(0.70 0.12 45 / 0.10);
  --brand-glow: oklch(0.70 0.12 45 / 0.22);
  --terminal-cyan: oklch(0.70 0.12 45);    /* 暗模式重映射到 brand */
}
```

**关键决策**：`terminal-cyan` 在新版本里**重映射为 brand**（保持类名兼容，不破坏 118 处现有用法）。这是个 surgical change —— cyan 原来用于"高亮/icon"，现在映射到 brand 橙同样语义（"高亮/icon"）。

**新增关键帧**（已有 `message-fade-in` / `collapse-in`）：
```css
@keyframes card-hover-lift {
  from { transform: translateY(0); box-shadow: 0 0 0 transparent; }
  to   { transform: translateY(-2px); box-shadow: 0 8px 24px oklch(0 0 0 / 12%); }
}
.hover\:lift:hover { animation: card-hover-lift 150ms ease-out forwards; }
```

#### 2. `web/src/app/layout.tsx` — 调整默认字体

移除 `html` 的 `font-sans` 依赖（保留 geist 变量），让 chat 子布局（chat-area / chat-input）自己声明字体。原 `className="... font-sans"` 在 `body` 上删除，改为子页面控制。

**理由**：避免全局 font-sans 污染 chat 的"代码感"。

#### 3. `web/src/app/login/page.tsx` — **重写**

**新视觉**：
- 满屏 `bg-gradient-to-br from-background via-background to-brand-soft`
- 中心卡片 `max-w-[360px]`（更窄更精致）
- 顶部 brand header：`<span class="text-brand">▌</span> Free Code` + 副标 "Self-hosted Claude Code"
- 输入框 focus 时 ring-2 ring-brand + border-brand
- 错误状态：red border + red helper text，**不**用 terminal-red
- 提交按钮：`bg-brand text-white hover:bg-brand/90`，loading 时 spinner 替代文字
- 移除当前 `<div class="...bg-card">` 包裹，改用 `shadow-card`（新增 utility） + `border-border/50`

**新文件结构**（简化）：
```tsx
<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-brand-soft p-4">
  <Card className="w-full max-w-[360px] shadow-2xl">
    <BrandHeader /> {/* 抽出共享组件 */}
    <Form ...>
  </Card>
</div>
```

**抽出 `BrandHeader`**（在 `web/src/components/ui/brand-header.tsx`，**NEW**）：
- 接受 `subtitle?: string`、`size?: 'sm' | 'md' | 'lg'`
- `<div class="flex items-center gap-2">`
- `<span class="text-brand font-mono">▌</span>`
- `<h1 class="font-display font-semibold tracking-tight">Free Code</h1>`
- 副标 `<p class="text-sm text-muted-foreground">{subtitle}</p>`

**复用点**：侧边栏顶部、Provider 页 header、Chat 空状态。

#### 4. `web/src/app/settings/providers/page.tsx` — 视觉重做

**Provider 卡片**（行 ~448-505）改为 credit-card 风格：
```tsx
<div className={cn(
  "group relative overflow-hidden rounded-xl border bg-card p-5 transition-all duration-150 cursor-pointer",
  "hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-card-hover",
  isActive ? "border-brand/60 bg-brand-soft shadow-sm" : "border-border"
)}>
  {/* 顶部：name + model count badge */}
  <div className="flex items-center justify-between mb-3">
    <span className="font-display text-base font-semibold">{provider.name}</span>
    <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[0.65rem] font-medium text-brand">
      {provider.models.length} models
    </span>
  </div>
  {/* 中部：baseUrl mono */}
  <p className="font-mono text-xs text-muted-foreground truncate">{provider.baseUrl}</p>
  {/* 底部：icon buttons */}
  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 ...">
    <Edit /> <Trash2 />
  </div>
</div>
```

**`添加提供商` 主按钮** 已在 995beed commit 中改过 brand 色（行 430），保留。

**侧边栏激活项** 已在 995beed commit 中改过（行 401），保留。

**顶部标题** 加 `BrandHeader` 替代当前 `<span>▌</span>` + `<h2>` 手写。

#### 5. `web/src/components/layout/sidebar.tsx` — **重写**

**新结构**（自上而下）：
```
┌─────────────────────────────┐
│ [▌] Free Code          [+]  │  ← BrandHeader + new chat icon
│ ─────────────────────────  │
│ [Search...]                 │
│ ─────────────────────────  │
│ [Quick Settings card]        │  ← NEW: 折叠 6 项设置入口
│ ─────────────────────────  │
│ > Session 1           2h    │  ← active 指示器 brand
│   Session 2           1d    │
│   ...                        │
└─────────────────────────────┘
```

**改动**：
- header 从 `<h2>Chats</h2>` 改为 `<BrandHeader size="sm" />` + 一个 `+` 按钮
- "Chats" 标签移到 session 列表上方
- 加 Quick Settings 卡片（折叠 6 项设置入口 — 模型、主题、沙箱、权限、会话、关于）
- session active 指示器 `text-terminal-cyan` → 已自动映射到 brand（globals.css 改）
- 侧边栏宽度 w-64 → w-72（288px → 略宽以容纳 quick settings 卡片）
- hover/active 加 150ms transition

**注意**：现有 chat-area 引用 `w-64`，需要同步调整 chat-layout.tsx 的侧边栏宽度 prop。

#### 6. `web/src/components/chat/chat-area.tsx` — 微调

加空状态：第一次进入 chat 时显示 `<BrandHeader subtitle="Start a conversation" />` + 一行提示文字（"Type a message or /command"）

#### 7. `web/src/components/messages/assistant-message.tsx` — 视觉重做

**新视觉**：
- 容器：`<div class="group rounded-2xl border border-border bg-card p-4 transition-all duration-150 hover:border-brand/30 hover:shadow-sm">`
- 头部：`<BrandHeader size="sm" />` + timestamp 右侧
- 内容：保留现有 `text-block.tsx` / `thinking-block.tsx` 不变
- avatar：不加（保持极简），靠 brand header 表达

**关键约束**：不要破坏 streaming 的逐字追加逻辑（`use-chat.ts` 的 append）

#### 8. `web/src/components/messages/tool-use-block.tsx` — 视觉重做

**新视觉**：
```tsx
<div className="rounded-lg border border-border bg-card/50 p-3">
  {/* header */}
  <div className="flex items-center gap-2 mb-2">
    {/* 状态点 */}
    <span className={cn(
      "size-2 rounded-full",
      status === "running" && "bg-brand animate-pulse",
      status === "done" && "bg-terminal-green",
      status === "error" && "bg-terminal-red"
    )} />
    <span className="font-mono text-xs text-muted-foreground">{toolName}</span>
  </div>
  {/* input preview（保持现有） */}
</div>
```

**关键约束**：tool name / input 参数渲染保持不变（依赖 react-markdown 的代码块）

#### 9. `web/src/components/messages/tool-result-block.tsx` — 微调

- 容器加左边线 `border-l-2 border-brand/40 pl-3`
- 缩进 + 背景 `bg-card/30`

#### 10-15. 微调清单（保持小范围）

| 文件 | 改动 |
|---|---|
| `mcp/page.tsx`、`page.tsx`、`providers/page.tsx` 的 loading 状态 | `$` 前缀 `text-terminal-green` → 改为 `<span class="text-brand">▌</span>`，更 Anthropic 风 |
| `settings/page.tsx` | 7 个 Card 标题 icon `text-terminal-cyan` → 自动映射到 brand；About 页 GitHub 链接颜色保留 cyan（已映射 brand） |
| `model-dialog.tsx` | focus 边框 `border-terminal-cyan/50` → 已有 cyan → brand 映射 |
| `chat-input.tsx` | 焦点边框 / `text-terminal-cyan/50` 颜色 自动映射（无需手动改） |
| `mcp-panel.tsx` | loading `$` 同上 |

**`terminal-cyan` 重映射为 `brand` 的好处**：所有 `text-terminal-cyan` 自动变 brand 橙，**不需要手动改 42 处**，但视觉上变成"claude.ai 风格"。

---

## Assumptions & Decisions

### A1. terminal-cyan 语义保持不变
**假设**：用户接受"高亮色 = brand 橙"是合理的（cyan 是冷色，brand 橙是暖色，但都表达"高亮"）
**决策**：重映射 `terminal-cyan` 到 `brand`，118 处用法无需手动改
**风险**：如果用户觉得 chat 流中所有高亮变成橙色太抢眼，可以局部回滚（但需要在 plan 之后讨论）

### A2. 字体切换：Mono → Sans（chat 子区域）
**假设**：用户接受"聊天界面用 sans-serif 正文、保留 mono 给代码"的折中
**决策**：login / sidebar header / provider 卡片用 sans-serif；chat-input / chat messages / command prompt / tool 名称 / 路径 / ID 保留 mono
**不破坏**：terminal 风格代码体验（`$` 前缀、模型 ID、文件路径、tool args 仍是 mono）

### A3. 圆角统一
**决策**：cards = `rounded-xl` (14px)、inputs/buttons = `rounded-lg` (10px)、badges = `rounded-full`
**理由**：claude.ai / Anthropic 内部工具的常见圆角节奏

### A4. 不引入新依赖
**理由**：karpathy "Simplicity First" + 用户原话"全 UI 换新"重点是视觉，不是引入新能力
**例外**：不引入 framer-motion、tailwindcss-animate；用 globals.css 的 keyframes（已有 3 个 keyframes）

### A5. dark 模式优先
**决策**：dark 模式 token 全部手调；浅色模式基于 oklch 反转（亮度 +15-20%）
**不做**：浅色模式单独设计（工作量翻倍且当前 dark 是 90% 用户场景）

### A6. 不动 streaming / SSE / API routes
**理由**：纯视觉重做，行为不变

### A7. chat-input 的 836 行斜杠命令菜单保留
**理由**：项目规则文档已声明"CC 风格极简原则"——只显示命令名，无描述

### A8. Quick Settings 卡片可折叠
**决策**：默认折叠，点击展开 6 项
**理由**：避免侧边栏过宽

### A9. Provider 卡片 credit-card 风格
**决策**：hover 上浮 2px + 阴影 + 边框变色；选中态 brand 橙边框 + 浅橙背景

### A10. Tool use status 点
**决策**：用 brand 橙（运行中）+ terminal-green（成功）+ terminal-red（失败）
**注意**：不要"绿 = done / 橙 = error"（违反直觉）

---

## Verification

按以下顺序验证（每步通过再进下一步）：

### V1. 类型 + lint
```bash
cd /workspace/web
npm run build
npm run lint
```
**预期**：build 退出码 0，lint 0 errors

### V2. CSS 编译验证
部署后用 curl 抓 `mybiog.us.ci` 的 CSS bundle：
```bash
curl -sS "https://mybiog.us.ci/_next/static/chunks/<hash>.css" \
  | grep -oE "\-\-brand[^;]*|\.text-brand|\.bg-brand|\.bg-brand-soft|hover\\:lift"
```
**预期**：所有 brand token 编译成功

### V3. 4 个重点页视觉
- 打开 `https://mybiog.us.ci/login`：渐变背景、▌ Free Code header、brand 橙输入框 focus
- 登录后打开 `/`：侧边栏有 ▌ Free Code 顶、session 选中态 brand 橙 `>` 指示器
- 发起一条消息：assistant 消息气泡、tool use 状态点
- 打开 `/settings/providers`：Provider 卡片 hover 上浮 + 阴影

### V4. 兼容性
- 添加/编辑/删除 Provider 流程：表单提交正常
- 切换 model：chat-input /model 子菜单工作
- 切换 theme：dark ↔ light 切换后 brand 橙变浅/深
- 已添加终端风格 `$` 前缀在 loading 状态变 brand 橙

### V5. 部署
- 提交并 push 到 main
- Vercel Production deployment `READY` / `PROMOTED`
- `mybiog.us.ci` 已指向新版本

### V6. 回归
- 不破坏现有 4 个 providers 集成测试
- 不破坏 streaming
- 不破坏 sessions 列表

---

## Out of Scope（明确不做）

1. ❌ CLI 端任何 UI 改动
2. ❌ 引入新依赖（framer-motion、tailwindcss-animate、新的 icon 库）
3. ❌ 浅色模式单独设计（基于 dark 模式反转）
4. ❌ 重新设计斜杠命令菜单结构
5. ❌ 重新设计 streaming / SSE 逻辑
6. ❌ 重新设计 sessions / providers 持久化
7. ❌ 改 API routes / libSQL schema
8. ❌ 加暗黑/亮色 mode 切换逻辑（已有 `useTheme` from `next-themes`）
9. ❌ 重新设计 login 鉴权逻辑
10. ❌ 改 MCP / Tools / Permissions 的功能逻辑

---

## Plan Metadata

- **Plan 版本**：v1（最终版）
- **预计改动文件**：15 个（其中 2 个重写、13 个微调/视觉重做）
- **预计代码量**：globals.css ~+80 行、login ~+50 行、providers-page ~+100 行、sidebar ~+80 行、assistant-message ~+40 行、tool-use-block ~+30 行
- **预计构建时间**：build ~30s、lint ~5s
- **预计部署时间**：Vercel ~45s
- **风险点**：A1（cyan → brand 映射）可能过于激进；如果用户不喜欢可局部回滚
- **下一步**：委派 sub-agent 分批执行（先 globals.css + brand-header 组件，再 4 个重点页，最后 10-15 微调）
