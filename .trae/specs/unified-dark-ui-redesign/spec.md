# Web 端全局深色 UI 改造 Spec

## Why
用户提供了 `/workspace/assets/screenshot.png` (1728x1470) 作为目标 UI 参考。像素分析显示其特征：
- 主背景 `#1e1e1e`（深色）
- 主体文字 `#e0e0e0`（浅灰白）
- 黄色调 `#c0c0a0` / `#e0e0a0`（标签/引用/装饰）
- 青色调 `#c0e0e0` / `#80a0c0`（链接/标题/选中）
- 绿色 `#60c040`（成功/就绪）
- 橙色 `#e0a040`（警告/强调）
- 红色 `#e06040`（错误/危险）
- 紫色 `#6040e0`（高亮/特殊标记）

当前 web 端 (`/workspace/web/`) 已有暗色 token 体系（`--background: oklch(0.1 0 0)` ≈ `#1a1a1a`），但浅/暗模式双套、共用 shadcn 默认色板；本 spec 要把**全站统一收敛到截图的暗色调色板**（不再有 light mode），并将所有页面（聊天主页、登录、设置、Provider、MCP、Topbar、Sidebar、消息块、输入框、按钮、代码块、Terminal/Diff 工具结果）按这个色板重新统一外观。

## What Changes
- **强制单一暗色主题**：移除 `:root` 浅色变量，保留 `.dark` 作为唯一主题；`<html>` 不再切换 `light`/`dark` class
- **截图色板 token 化**：在 `globals.css` 中新增 `--bg-base`、`--text-primary`、`--text-muted`、`--accent-yellow`、`--accent-cyan`、`--accent-green`、`--accent-orange`、`--accent-red`、`--accent-purple`，并映射到 Tailwind 工具类
- **去掉 shadcn 默认紫/蓝/青干扰色**：调整 `--primary` / `--ring` 到截图的青色 `#c0e0e0` 派系，移除亮 cyan/blue 装饰
- **代码高亮主题换成截图色板**：`.hljs-*` 类全部用 5 色 accent 系列
- **Diff 高亮**：新增行用绿色、删除行用红色、标题用青色（已部分存在，统一）
- **Terminal 输出（tool result）**：保留 monospace 字体，颜色对齐 accent 系列
- **全站覆盖**：
  - 聊天主页 `src/app/page.tsx` + `src/components/layout/chat-layout.tsx` + `topbar.tsx` + `sidebar.tsx`
  - 消息块 `src/components/messages/*` (assistant/user/text/thinking/tool-use/tool-result)
  - 输入框 `src/components/chat/chat-input.tsx` + 斜杠命令菜单
  - 登录页 `src/app/login/page.tsx`
  - 设置首页 `src/app/settings/page.tsx` + Provider 页 `src/app/settings/providers/page.tsx`
  - MCP 页 `src/app/mcp/page.tsx`
  - 工具结果/确认弹窗 `src/components/chat/tool-confirm-dialog.tsx` + `auto-approve-toast.tsx`
  - 文件树面板 `src/components/chat/file-tree-panel.tsx`
- **不改业务逻辑**、不改 API 路由、不改 hooks
- **不引入新依赖**、不改 Tailwind 配置
- **可访问性**：保留所有交互元素的 focus 可见性（`outline-ring/50`）
- **响应式**：保留现有断点和 grid/flex 布局

**BREAKING**: 无（视觉重构，不影响 API/数据契约）

## Impact
- **Affected specs**:
  - [redesign-cli-ui-web](file:///workspace/.trae/specs/redesign-cli-ui-web/spec.md)（已被本 spec 取代/扩展）
- **Affected code**:
  - [web/src/app/globals.css](file:///workspace/web/src/app/globals.css) — 新增色板 token、重写浅色/暗色块
  - [web/src/app/layout.tsx](file:///workspace/web/src/app/layout.tsx) — 强制 `html class="dark"`
  - [web/tailwind config（通过 globals.css @theme inline）](file:///workspace/web/src/app/globals.css#L7-L59)
  - 所有 `web/src/components/**/*.tsx` — 类名对齐新 token
  - 所有 `web/src/app/**/page.tsx` — 强制暗色容器
- **新增文件**: 无
- **删除/简化**: 移除 `:root` 浅色 token 块（保留 fallback 给 SSR hydration 兼容）

## ADDED Requirements

### Requirement: 截图色板 token
系统 SHALL 在 [globals.css](file:///workspace/web/src/app/globals.css) 中新增以下 token（与截图色板一一对应）：

```css
:root, .dark {
  --bg-base: #1e1e1e;          /* 主背景 */
  --bg-elevated: #252525;      /* 卡片/弹窗/输入框 */
  --bg-overlay: #2d2d2d;       /* 浮层/侧边栏 */
  --text-primary: #e0e0e0;     /* 主体文字 */
  --text-muted: #8a8a8a;       /* 次要文字 */
  --text-subtle: #5a5a5a;      /* 占位/禁用 */
  --border-subtle: #2f2f2f;    /* 分隔线 */
  --border-strong: #3a3a3a;    /* 输入框边框 */
  --accent-yellow: #c0c0a0;    /* 标签/引用/装饰 */
  --accent-cyan: #c0e0e0;      /* 链接/选中/标题 */
  --accent-green: #60c040;     /* 成功/就绪 */
  --accent-orange: #e0a040;    /* 警告/强调 */
  --accent-red: #e06040;       /* 错误/危险 */
  --accent-purple: #6040e0;    /* 特殊高亮 */
}
```

并在 `@theme inline` 块映射 Tailwind 工具类（`bg-base`、`bg-elevated`、`bg-overlay`、`text-primary`、`text-muted`、`text-accent-yellow` 等 12 个新色类）。

#### Scenario: 渲染色板
- **WHEN** 任何页面加载
- **THEN** 全站背景显示 `#1e1e1e`，主体文字 `#e0e0e0`，5 个 accent 色与截图色板一致

### Requirement: 强制暗色主题
系统 SHALL 在 [layout.tsx](file:///workspace/web/src/app/layout.tsx) `<html>` 标签上默认添加 `class="dark"`，且不允许通过 toggle 切换 light 模式（删除相关 UI 控件）。

#### Scenario: 始终暗色
- **WHEN** 用户首次访问任何页面
- **THEN** `<html class="dark">`，背景为 `--bg-base`

### Requirement: 移除 shadcn 浅色 token
系统 SHALL 在 [globals.css](file:///workspace/web/src/app/globals.css) 中：
- 保留 `:root` 块但**所有颜色变量指向暗色值**（防 SSR 闪烁）
- 删除 `light/dark` toggle 相关代码（如有）
- 调整 `--primary` 为 `--accent-cyan` 派系、`--ring` 为 `--accent-cyan`、`--destructive` 为 `--accent-red`

#### Scenario: 无浅色模式
- **WHEN** 用户尝试切换主题
- **THEN** 不存在切换控件；只有暗色可用

### Requirement: 代码块语法高亮重写
系统 SHALL 替换 `.hljs-*` 全部规则使用新 5 色 accent：
- 关键字/类名 → `--accent-purple`
- 字符串/文档标签 → `--accent-green`
- 数字/类型/内置函数 → `--accent-orange`
- 函数/标题 → `--accent-cyan`
- 注释/引用 → `--text-muted`
- 变量/属性 → `--text-primary`

#### Scenario: 代码块渲染
- **WHEN** 聊天中出现代码块
- **THEN** 关键字紫色、字符串绿色、数字橙色、函数青色、注释灰色，与截图一致

### Requirement: Diff 高亮统一
系统 SHALL 在 [globals.css](file:///workspace/web/src/app/globals.css) 中重写 `.diff-add` / `.diff-remove` / `.diff-header`：
- 新增 → 文字 `--accent-green`、背景 `--accent-green` 15% 透明
- 删除 → 文字 `--accent-red`、背景 `--accent-red` 15% 透明
- 头 → 文字 `--accent-cyan`、加粗

#### Scenario: diff 视图
- **WHEN** 工具结果显示 diff
- **THEN** + 行绿底、- 行红底、@@ 头青色加粗

### Requirement: 全站页面容器统一
所有页面（chat、login、settings、providers、mcp）根容器 SHALL 使用 `bg-base text-primary`，且 `<main>` 内容区域去掉 `bg-card` 之类的浅色类，替换为 `bg-elevated` 或透明 `bg-base`。

#### Scenario: 跨页面一致性
- **WHEN** 用户从聊天主页跳到 settings、mcp、login 再跳回
- **THEN** 所有页面背景统一为 `#1e1e1e`，无亮色闪烁

### Requirement: 按钮 + 主色调
- 主操作按钮（"发送"、"添加"、"保存"、"测试连接"）：`bg-accent-cyan text-bg-base hover:bg-accent-cyan/80`
- 次要按钮：`bg-elevated text-primary border-border-strong hover:bg-overlay`
- 危险按钮（"删除"、"拒绝"）：`bg-accent-red/15 text-accent-red hover:bg-accent-red/25`
- 警告按钮（"重试"、"强制"）：`bg-accent-orange/15 text-accent-orange hover:bg-accent-orange/25`

#### Scenario: 主按钮渲染
- **WHEN** 用户看到任何主操作按钮
- **THEN** 背景青色 `#c0e0e0`、文字深色 `#1e1e1e`

### Requirement: 输入框 + 焦点态
所有 `<input>` / `<textarea>` SHALL 使用 `bg-elevated border-border-strong text-primary placeholder:text-text-subtle`，focus 时 `border-accent-cyan ring-2 ring-accent-cyan/30`。

#### Scenario: 输入框
- **WHEN** 用户点击输入框
- **THEN** 边框变青色、出现 2px 青色光晕

### Requirement: 斜杠命令菜单
`src/components/chat/chat-input.tsx` 内的命令列表 SHALL 用 `bg-overlay border-border-strong`，选中项 `bg-accent-cyan/15 text-accent-cyan`。

#### Scenario: 命令菜单
- **WHEN** 用户输入 `/` 弹出命令列表
- **THEN** 选中项青色高亮

### Requirement: 侧边栏会话项
`src/components/layout/sidebar.tsx` 中会话列表项 SHALL：
- 默认 `text-text-muted hover:text-primary hover:bg-elevated`
- 激活（当前会话）`bg-accent-cyan/10 text-accent-cyan border-l-2 border-accent-cyan`
- 删除按钮 hover `text-accent-red`

#### Scenario: 激活会话
- **WHEN** 用户点击某会话
- **THEN** 该项左侧 2px 青色竖条 + 淡青背景 + 青色文字

### Requirement: 消息块渲染
- 用户消息：右对齐 + `bg-elevated` 圆角 + 文字 `text-primary`
- 助手消息：左对齐 + 透明背景 + 文字 `text-primary`
- 思考块：左侧 3px `--accent-yellow` 竖条 + 半透明 `bg-accent-yellow/5` + 文字 `text-muted`
- 工具调用：单色边框 `border-border-strong` + 工具名 `text-accent-cyan` + 状态徽标（成功绿、失败红、进行中黄）

#### Scenario: 消息流
- **WHEN** 用户滚动聊天
- **THEN** 用户/助手/思考/工具消息视觉清晰可分

### Requirement: Topbar 简化
`src/components/layout/topbar.tsx` 简化为单行：
- 左：模型名（`text-primary`）+ Provider 名称（`text-text-muted` 小字）
- 中：会话标题（`text-primary`，超长截断）
- 右：上下文百分比进度条（用 `--accent-green` / `--accent-orange` / `--accent-red` 三色随用量切换）
- 移除任何主题切换按钮

#### Scenario: topbar 渲染
- **WHEN** 用户进入聊天主页
- **THEN** 顶部仅一行：模型 + 会话 + 上下文

### Requirement: 登录页深色化
`src/app/login/page.tsx` SHALL 使用：
- 整页 `bg-base`
- 登录卡片 `bg-elevated` + 1px `border-border-strong`
- Logo/标题用 `--accent-cyan`
- 输入框按 Requirement 8
- 登录按钮按 Requirement 7

#### Scenario: 登录页
- **WHEN** 未登录用户访问 `/login`
- **THEN** 页面纯暗色，CTA 按钮青色

## MODIFIED Requirements
无业务需求变更，纯视觉重构

## REMOVED Requirements
### Requirement: 浅色模式切换
**Reason**: 用户截图是单一暗色主题，不需要 light mode
**Migration**: 移除 light/dark toggle UI；所有 CSS 变量统一指向暗色值

### Requirement: shadcn 默认 primary 蓝/紫
**Reason**: 与截图色板不一致
**Migration**: 替换为 `--accent-cyan` / `--accent-purple` 系列

## 验证标准
1. `cd /workspace/web && npm run build` 通过
2. `cd /workspace/web && npm run lint` 通过
3. `cd /workspace/web && npx vitest run` 通过
4. 访问 `/login`：`bg-base` 深色，登录按钮青色
5. 登录后进入 `/`：侧边栏激活会话青色竖条，Topbar 单行，输入框焦点青色
6. 发送消息后：用户消息右对齐灰底、助手消息左对齐透明、思考块黄色竖条、工具调用青色边框
7. 触发 diff 工具：`+` 行绿底、`-` 行红底、`@@` 青色加粗
8. 触发代码块：关键字紫、字符串绿、数字橙、函数青、注释灰
9. 跳转到 `/settings/providers`、`/mcp`、`/settings`：背景统一 `#1e1e1e`
10. DevTools 检查：`<html class="dark">`，所有 token 与本 spec 一致

## 不做的事
- 不改任何 API 路由（`/api/chat`、`/api/providers` 等）
- 不改任何 hooks 逻辑（`use-chat`、`use-sessions`、`use-file-tree`）
- 不改工具注册表（`lib/tools/registry.ts`）
- 不改业务流（消息发送、模型切换、权限切换）
- 不引入新依赖
- 不动 `tailwind.config.*`（如有）——所有 token 通过 `globals.css @theme inline` 注入
- 不做响应式断点改动
- 不做 A11y 增强（保持现有 `outline-ring/50`）
- 不写 Vitest 新测试（重构纯视觉，由手工/浏览器验收）
