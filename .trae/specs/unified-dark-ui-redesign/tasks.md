# Tasks

## Task 1: 注入截图色板 token
- [ ] SubTask 1.1: 在 `web/src/app/globals.css` `:root` 块中新增 12 个截图色板 token（`--bg-base`、`--bg-elevated`、`--bg-overlay`、`--text-primary`、`--text-muted`、`--text-subtle`、`--border-subtle`、`--border-strong`、`--accent-yellow`、`--accent-cyan`、`--accent-green`、`--accent-orange`、`--accent-red`、`--accent-purple`）
- [ ] SubTask 1.2: 在 `@theme inline` 块中为 12 个 token 添加 Tailwind 颜色映射（`--color-bg-base`、`--color-accent-yellow` 等），让 `bg-base` / `text-accent-cyan` 等工具类可用
- [ ] SubTask 1.3: 把所有现有 `:root` 浅色变量改写为指向暗色值（防 SSR 闪烁），删除 `.dark` 块中重复定义
- [ ] SubTask 1.4: 调整 `--primary` / `--ring` / `--destructive` 映射到 `--accent-cyan` / `--accent-red`

## Task 2: 强制暗色主题
- [ ] SubTask 2.1: 修改 `web/src/app/layout.tsx` `<html>` 标签固定 `class="dark"`，删除 `suppressHydrationWarning` 之外的主题切换代码
- [ ] SubTask 2.2: 搜索全代码库删除任何主题 toggle UI（`theme-toggle.tsx`、`<ThemeToggle>` 使用等）
- [ ] SubTask 2.3: 删除 `next-themes` / `useTheme` 引用（如果有）

## Task 3: 代码高亮主题重写
- [ ] SubTask 3.1: 在 `globals.css` 重写所有 `.hljs-*` 规则：
  - keyword/literal/class → `--accent-purple`
  - string/template → `--accent-green`
  - number/built_in/type → `--accent-orange`
  - function/title → `--accent-cyan`
  - comment/quote → `--text-muted`
  - variable/attr → `--text-primary`
- [ ] SubTask 3.2: 调整 `pre` 块背景为 `--bg-elevated`，边框 `--border-subtle`
- [ ] SubTask 3.3: 调整 `code:not(pre code)` 内联代码背景 `--bg-elevated`、文字 `--accent-cyan`

## Task 4: Diff 高亮统一
- [ ] SubTask 4.1: 重写 `.diff-add` 用 `--accent-green` 文字 + 15% 背景
- [ ] SubTask 4.2: 重写 `.diff-remove` 用 `--accent-red` 文字 + 15% 背景
- [ ] SubTask 4.3: 重写 `.diff-header` 用 `--accent-cyan` + 加粗

## Task 5: 全站页面容器统一
- [ ] SubTask 5.1: `web/src/app/page.tsx` 加载态容器用 `bg-base`
- [ ] SubTask 5.2: `web/src/app/login/page.tsx` 整页 `bg-base`，卡片 `bg-elevated border border-border-strong`
- [ ] SubTask 5.3: `web/src/app/settings/page.tsx`、`web/src/app/settings/providers/page.tsx` 主体 `bg-base`，去掉 `bg-card` 浅色
- [ ] SubTask 5.4: `web/src/app/mcp/page.tsx` 主体 `bg-base`

## Task 6: 按钮 + 输入框统一
- [ ] SubTask 6.1: 创建 `web/src/components/ui/button-variants.ts`（如不存在），定义 4 种 variant 类（primary/secondary/danger/warning）
- [ ] SubTask 6.2: 全站搜索 `bg-primary text-primary-foreground`，按 spec 替换为 `bg-accent-cyan text-bg-base` 或对应 variant
- [ ] SubTask 6.3: 全站搜索 `<Input>` 组件，确保 focus 态为 `border-accent-cyan ring-2 ring-accent-cyan/30`
- [ ] SubTask 6.4: 全站搜索 `bg-destructive`，按 spec 改为 `bg-accent-red/15 text-accent-red`

## Task 7: 斜杠命令菜单
- [ ] SubTask 7.1: `web/src/components/chat/chat-input.tsx` 命令列表容器改 `bg-overlay border-border-strong`
- [ ] SubTask 7.2: 选中项 `bg-accent-cyan/15 text-accent-cyan`
- [ ] SubTask 7.3: 权限子菜单 / 模型子菜单用同样色板

## Task 8: 侧边栏会话项
- [ ] SubTask 8.1: `web/src/components/layout/sidebar.tsx` 默认项 `text-text-muted hover:text-primary hover:bg-elevated`
- [ ] SubTask 8.2: 激活项 `bg-accent-cyan/10 text-accent-cyan border-l-2 border-accent-cyan`
- [ ] SubTask 8.3: 删除按钮 hover `text-accent-red`
- [ ] SubTask 8.4: "新建会话" 按钮 `bg-accent-cyan text-bg-base`

## Task 9: 消息块渲染
- [ ] SubTask 9.1: `web/src/components/messages/user-message.tsx` 改 `bg-elevated` 圆角右对齐
- [ ] SubTask 9.2: `web/src/components/messages/assistant-message.tsx` 改透明背景
- [ ] SubTask 9.3: `web/src/components/messages/thinking-block.tsx` 左侧 3px `--accent-yellow` 竖条 + `bg-accent-yellow/5` + `text-muted`
- [ ] SubTask 9.4: `web/src/components/messages/tool-use-block.tsx` `border-border-strong` + 工具名 `text-accent-cyan` + 状态徽标（绿/红/黄）
- [ ] SubTask 9.5: `web/src/components/messages/tool-result-block.tsx` 复用 `.terminal-output` 样式，状态徽标三色

## Task 10: Topbar 简化
- [ ] SubTask 10.1: `web/src/components/layout/topbar.tsx` 简化为单行（已接近完成）
- [ ] SubTask 10.2: 上下文进度条用 `--accent-green` (0-50%) / `--accent-orange` (50-80%) / `--accent-red` (80-100%) 三色
- [ ] SubTask 10.3: 移除任何主题切换 UI

## Task 11: 弹窗统一
- [ ] SubTask 11.1: `web/src/components/chat/tool-confirm-dialog.tsx` 容器 `bg-elevated border-border-strong`
- [ ] SubTask 11.2: `web/src/components/chat/auto-approve-toast.tsx` 容器 `bg-overlay`，成功 `--accent-green`、失败 `--accent-red`
- [ ] SubTask 11.3: `web/src/components/chat/provider-dialog.tsx` 容器 `bg-elevated`
- [ ] SubTask 11.4: `web/src/components/chat/token-warning.tsx` 警告用 `--accent-orange`、错误用 `--accent-red`

## Task 12: 文件树面板
- [ ] SubTask 12.1: `web/src/components/chat/file-tree-panel.tsx` 容器 `bg-overlay`，分隔线 `--border-subtle`
- [ ] SubTask 12.2: 文件 hover `bg-elevated`，目录文字 `text-text-muted`

## Task 13: 验证
- [ ] SubTask 13.1: `cd /workspace/web && npm run build` 通过
- [ ] SubTask 13.2: `cd /workspace/web && npm run lint` 通过
- [ ] SubTask 13.3: `cd /workspace/web && npx vitest run` 通过
- [ ] SubTask 13.4: 用 `agent-browser` 打开 `https://mybiog.us.ci/login` 截图，确认 `bg-base` + 青色 CTA
- [ ] SubTask 13.5: 登录后访问 `/`、`/settings`、`/settings/providers`、`/mcp`，分别截图确认色板一致
- [ ] SubTask 13.6: 发送包含代码块、diff 的消息，确认高亮颜色对齐 spec

# Task Dependencies
- [Task 2] depends on [Task 1]（必须先有 token 才能用）
- [Task 3] depends on [Task 1]
- [Task 4] depends on [Task 1]
- [Task 5..12] depends on [Task 1, Task 2]
- [Task 13] depends on [Task 1..12]
