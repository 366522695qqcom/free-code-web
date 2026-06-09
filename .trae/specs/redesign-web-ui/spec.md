# 重新设计 Web UI Spec

## Why
当前 CC Web UI 走"终端/赛博朋克"风格（深色背景 + 等宽字体 + terminal-green/cyan 强调色），视觉观感偏工具化、缺乏品牌感。需要用 Anthropic 官方品牌色与字体体系重做视觉层，保留全部功能、替换皮肤，让界面在保留 CC 极简原则的同时具备"anthropic 风格"的精致感。

## What Changes
- **替换设计令牌**：将 [globals.css](file:///workspace/web/src/app/globals.css) 中的 oklch 调色板与终端色替换为 Anthropic 品牌色（Dark `#141413` / Light `#faf9f5` / Orange `#d97757` / Blue `#6a9bcc` / Green `#788c5d` / Mid Gray `#b0aea5` / Light Gray `#e8e6dc`）
- **替换字体**：引入 Poppins（标题/UI）+ Lora（正文）作为首选字体，保留 Geist 作为回退；通过 [layout.tsx](file:///workspace/web/src/app/layout.tsx) 注入
- **重构全局样式**：去掉 "Loading…$" 等终端装饰、cursor-blink、pulse-glow 等动画；保留功能性动效（消息淡入、折叠展开）
- **重做登录页**：[login/page.tsx](file:///workspace/web/src/app/login/page.tsx) 改用品牌色品牌化（橙色品牌点缀 + 温暖米色背景）
- **重做主布局**：[chat-layout.tsx](file:///workspace/web/src/components/layout/chat-layout.tsx) 去除 `font-mono` 全局类，使用 sans/serif 混排；侧边栏、顶栏、文件树、聊天区用更克制的留白和圆角
- **重做侧边栏**：[sidebar.tsx](file:///workspace/web/src/components/layout/sidebar.tsx) 去掉 `> ` 终端前缀、terminal-cyan 强调色、`font-mono`、0.5 倍的幽灵图标；用 Poppins + 橙色品牌点缀
- **重做消息渲染**：[messages/](file:///workspace/web/src/components/messages) 各块（user/assistant/thinking/tool-use/tool-result）调整行高、代码块配色、行内 code 颜色
- **重做对话框**：[provider-dialog.tsx](file:///workspace/web/src/components/chat/provider-dialog.tsx)、[tool-confirm-dialog.tsx](file:///workspace/web/src/components/chat/tool-confirm-dialog.tsx)、[add-server-dialog.tsx](file:///workspace/web/src/components/mcp/add-server-dialog.tsx) 统一品牌化（圆角、间距、品牌色）
- **设置页与 MCP 页**：[settings/](file:///workspace/web/src/app/settings) + [mcp/](file:///workspace/web/src/app/mcp) 应用同样令牌
- **保留**：所有功能逻辑（hooks、API、SSE、auth、sandbox、permissions）完全不动；只改视觉层与样式类名

## Impact
- **Affected specs**: 无（纯视觉重做）
- **Affected code**:
  - `web/src/app/globals.css` — 重新设计令牌
  - `web/src/app/layout.tsx` — 字体注入
  - `web/src/app/login/page.tsx` — 登录页样式
  - `web/src/app/page.tsx` — Loading 状态文案与样式
  - `web/src/app/settings/page.tsx` + `settings/providers/*` + `mcp/page.tsx` — 同步应用
  - `web/src/components/layout/{chat-layout,sidebar,topbar}.tsx` — 布局组件
  - `web/src/components/chat/{chat-input,chat-area,*}.tsx` — 聊天核心
  - `web/src/components/messages/*` — 消息块
  - `web/src/components/mcp/*` — MCP 面板
  - `web/src/components/ui/*` — shadcn 基础组件（仅检查是否需要令牌更新）
- **New files**: 无（仅修改现有文件）
- **删除/简化**: 删除 `terminal-*` 系列 CSS 变量、cursor-blink/pulse-glow 动画、`.terminal-output` 工具类（除非仍需使用）

## ADDED Requirements

### Requirement: 品牌设计令牌
系统 SHALL 在 [globals.css](file:///workspace/web/src/app/globals.css) 中定义以下 CSS 变量，浅色为默认、深色为 `.dark` 覆盖：

| 令牌 | Light 模式 | Dark 模式 | 用途 |
|---|---|---|---|
| `--background` | `#faf9f5` | `#141413` | 页面背景 |
| `--foreground` | `#141413` | `#faf9f5` | 主文本 |
| `--card` | `#ffffff` | `#1c1b1a` | 卡片背景 |
| `--muted-foreground` | `#6b6a63` | `#b0aea5` | 次级文本 |
| `--border` | `#e8e6dc` | `#2a2926` | 边框 |
| `--primary` | `#d97757` | `#d97757` | 主操作（品牌橙） |
| `--accent` | `#6a9bcc` | `#6a9bcc` | 次强调（蓝） |
| `--success` | `#788c5d` | `#788c5d` | 成功/正反馈（绿） |
| `--font-sans` | `'Poppins', system-ui, sans-serif` | 同 | UI/标题 |
| `--font-serif` | `'Lora', Georgia, serif` | 同 | 正文/卡片 |
| `--font-mono` | `'Geist Mono', ui-monospace, monospace` | 同 | 代码/标识 |
| `--radius` | `0.75rem` | 同 | 圆角基线 |

**严禁保留**：`--terminal-green/cyan/amber/red`、`--chart-1..5` 原值（用品牌色重新映射）。

#### Scenario: 浅色模式正确应用
- **WHEN** 用户访问 `/` 且系统未启用暗色
- **THEN** 页面背景为 `#faf9f5`，主文本为 `#141413`，主按钮使用 `#d97757`

#### Scenario: 暗色模式正确应用
- **WHEN** `<html class="dark">` 或 next-themes 切换到 dark
- **THEN** 背景 `#141413`，文本 `#faf9f5`，主按钮保持 `#d97757`

### Requirement: 字体注入
系统 SHALL 在 [layout.tsx](file:///workspace/web/src/app/layout.tsx) 中通过 `next/font/google`（或本地 fonts）注入 Poppins 与 Lora，CSS 变量分别为 `--font-sans-poppins` 与 `--font-serif-lora`，并赋给 `globals.css` 的 `--font-sans` / `--font-serif`。

#### Scenario: 字体加载成功
- **WHEN** 浏览器加载 `/`
- **THEN** `<body>` 计算后的 `font-family` 在标题元素上解析为 Poppins（带 Arial 回退），在正文元素上解析为 Lora（带 Georgia 回退）

### Requirement: 登录页品牌化
系统 SHALL 重新设计 [login/page.tsx](file:///workspace/web/src/app/login/page.tsx)：
- 背景使用品牌浅色 `#faf9f5`
- 卡片使用白色 + 1px `#e8e6dc` 边框 + `0.75rem` 圆角 + 柔和阴影
- "Free Code" 标题使用 Poppins 24pt、字重 600、颜色 `#141413`
- 副标题使用 Lora、字重 400、颜色 `#6b6a63`
- 主按钮背景 `#d97757`、文字 `#ffffff`、圆角 0.625rem
- 移除 "Loading..." 终端装饰（如果有）

#### Scenario: 登录成功
- **WHEN** 用户输入正确凭据并点击 Sign in
- **THEN** 跳转到 `/`，所有视觉令牌与新品牌一致

### Requirement: 主布局去终端化
系统 SHALL 重构 [chat-layout.tsx](file:///workspace/web/src/components/layout/chat-layout.tsx)：
- 移除根容器 `font-mono` 类
- 顶栏使用 `--border` 边框、`#faf9f5` 背景
- 文件树按钮去掉 `text-terminal-cyan` 替换为 `text-foreground/70 hover:text-foreground`
- 错误栏使用 `--destructive` token（保持）
- 系统消息（terminal echo line）改为品牌色 `--accent`（蓝）下划线段落，去掉 `font-mono`

#### Scenario: 顶栏样式
- **WHEN** 渲染 chat-layout
- **THEN** 顶栏高度 48px、背景 `--background`、底边 `--border`

### Requirement: 侧边栏去终端化
系统 SHALL 重构 [sidebar.tsx](file:///workspace/web/src/components/layout/sidebar.tsx)：
- 移除 `> ` 前缀指示器
- 移除 `text-terminal-cyan/50` 搜索框焦点色，替换为 `border-primary/40`
- 移除 `font-mono`，统一 Poppins
- 会话项使用 8px 圆角 hover 高亮（`bg-muted`）
- 激活项使用 `bg-accent/10` + 左侧 2px `--primary` 竖条
- 右键菜单使用 shadcn 圆角风格（不再 0.5px 直角）

#### Scenario: 切换会话
- **WHEN** 用户点击侧边栏会话
- **THEN** 激活项视觉反馈为左侧橙色竖条 + 浅橙背景（无终端 >）

### Requirement: 消息块品牌化
系统 SHALL 调整 [components/messages/*](file:///workspace/web/src/components/messages)：
- 用户消息气泡：`bg-muted`、`text-foreground`、圆角 1rem、左下小三角保留/移除二选一（默认保留）
- 助手消息：纯文本无气泡
- 思考块（thinking）：`bg-muted/50` + 左侧 2px 蓝色 `--accent` 竖条
- 工具调用块：`bg-card` + 1px `--border` 边框 + 圆角 0.75rem
- 行内 code：背景 `--muted`、颜色 `--primary`（品牌橙）、圆角 0.3rem
- 代码块：背景 `#1c1b1a`（暗色）/ `#141413`（浅色）、高亮配色按品牌映射

#### Scenario: 渲染助手消息
- **WHEN** 流式接收 thinking + text 块
- **THEN** thinking 块左侧蓝色竖条可见、text 块正文使用 Lora 字体

### Requirement: 移除终端残留
系统 SHALL 移除/替换以下内容：
- `Loading...` 状态的 `$` 前缀与闪烁光标 → 简单 spinner 或文字 "Loading…"
- `cursor-blink`、`pulse-glow` 关键帧 → 删除（保留功能性 fade-in）
- `.terminal-output` 工具类 → 删除（无使用方）
- 所有 `text-terminal-*`、`bg-terminal-*` 类名 → 替换为品牌 token

#### Scenario: 加载态
- **WHEN** `/api/auth/me` 拉取中
- **THEN** 页面中央显示一个柔和 spinner + 文字 "Loading…"，无终端装饰

## MODIFIED Requirements
无（这是新视觉重做，不修改既有功能行为）

## REMOVED Requirements
无（功能完整保留，仅替换皮肤层）

## 验证标准

按 [karpathy-guidelines](file:///data/user/skills/karpathy-guidelines) 的"Goal-Driven Execution"原则：
1. `cd /workspace/web && npm run build` 必须通过
2. `npm run lint` 必须通过
3. `npx vitest run` 必须通过
4. 在浏览器目视检查以下路径的视觉差异：
   - `/login` — 品牌化登录卡
   - `/` — 加载态 + 主布局
   - `/settings`、`/settings/providers`、`/mcp` — 二级页面
5. 切换 `<html class="dark">` 测试暗色模式
6. 响应式：1280px / 768px / 375px 三个断点不破版

## 不做的事（按 karpathy-guidelines "Simplicity First"）
- 不重写 hooks、API、状态管理
- 不引入新依赖（next/font/google 自带）
- 不调整 chat-input 的斜杠命令逻辑
- 不修改 SSE 流式协议
- 不重命名文件、不调整目录结构
- 不在登录页加注册/找回密码流程
- 不实现暗色/浅色自动切换（沿用 next-themes 已有机制即可）
