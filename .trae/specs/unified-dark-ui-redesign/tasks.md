# Tasks

## Task 1: 注入截图色板 token ✅
- [x] SubTask 1.1: 在 `web/src/app/globals.css` `:root` 块中新增 14 个截图色板 token
- [x] SubTask 1.2: 在 `@theme inline` 块中为 14 个 token 添加 Tailwind 颜色映射
- [x] SubTask 1.3: 把所有现有 `:root` 浅色变量删除，`:root, .dark` 合并指向暗色值
- [x] SubTask 1.4: 调整 `--primary` / `--ring` / `--destructive` 映射到 `--accent-cyan` / `--accent-red`

## Task 2: 强制暗色主题 ✅
- [x] SubTask 2.1: 修改 `web/src/app/layout.tsx` `<html>` 标签固定 `class="dark"`，删除 `ThemeProvider`
- [x] SubTask 2.2: 删除 `topbar.tsx` 中的 cycleTheme 按钮和 useTheme
- [x] SubTask 2.3: 删除 `settings/page.tsx` 的 "Theme" 卡片和 useTheme

## Task 3: 代码高亮主题重写 ✅
- [x] SubTask 3.1: 在 `globals.css` 重写所有 `.hljs-*` 规则（紫/绿/橙/青/灰）
- [x] SubTask 3.2: 调整 `pre` 块背景为 `--bg-elevated`，边框 `--border-subtle`
- [x] SubTask 3.3: 调整 `code:not(pre code)` 内联代码背景 `--bg-elevated`、文字 `--accent-cyan`

## Task 4: Diff 高亮统一 ✅
- [x] SubTask 4.1: 重写 `.diff-add` 用 `--accent-green` + 15% 背景
- [x] SubTask 4.2: 重写 `.diff-remove` 用 `--accent-red` + 15% 背景
- [x] SubTask 4.3: 重写 `.diff-header` 用 `--accent-cyan` + 加粗

## Task 5: 全站页面容器统一 ✅
- [x] SubTask 5.1: `web/src/app/page.tsx` 加载态容器用 `bg-base`
- [x] SubTask 5.2: `web/src/app/login/page.tsx` 整页 `bg-base`，卡片 `bg-elevated`
- [x] SubTask 5.3: `web/src/app/settings/page.tsx` 主体 `bg-base`
- [x] SubTask 5.4: `web/src/app/mcp/page.tsx` 主体 `bg-base`

## Task 6: 按钮 + 输入框统一 ✅
- [x] SubTask 6.1: 36 个文件中批量替换 `bg-primary text-primary-foreground` → `bg-accent-cyan text-bg-base`
- [x] SubTask 6.2: 输入框 focus 态保留 shadcn 默认（已用 `ring` token 重映射）
- [x] SubTask 6.3: `bg-destructive` 替换为 `bg-accent-red/15 text-accent-red`

## Task 7: 斜杠命令菜单 ✅
- [x] SubTask 7.1: `chat-input.tsx` 命令列表沿用新色板 token
- [x] SubTask 7.2: 选中项高亮统一

## Task 8: 侧边栏会话项 ✅
- [x] SubTask 8.1: `sidebar.tsx` 默认项 `text-text-muted`
- [x] SubTask 8.2: 激活项 `border-l-2 border-accent-cyan bg-accent-cyan/10 text-accent-cyan`
- [x] SubTask 8.3: 删除按钮 hover `text-accent-red`
- [x] SubTask 8.4: 新建按钮用新 token

## Task 9: 消息块渲染 ✅
- [x] SubTask 9.1: `user-message.tsx` 改 `bg-elevated` 圆角
- [x] SubTask 9.2: `assistant-message.tsx` 改透明背景
- [x] SubTask 9.3: `thinking-block.tsx` 黄色竖条 + `bg-accent-yellow/5`
- [x] SubTask 9.4: `tool-use-block.tsx` 青色边框 + 工具名青色
- [x] SubTask 9.5: `tool-result-block.tsx` 终端样式 + 三色状态徽标

## Task 10: Topbar 简化 ✅
- [x] SubTask 10.1: `topbar.tsx` 简化为单行
- [x] SubTask 10.2: 进度条色板已统一
- [x] SubTask 10.3: 主题切换 UI 已删除

## Task 11: 弹窗统一 ✅
- [x] SubTask 11.1: `tool-confirm-dialog.tsx` 容器 `bg-elevated border-border-strong`
- [x] SubTask 11.2: `auto-approve-toast.tsx` 容器 `bg-overlay`，绿/红状态色
- [x] SubTask 11.3: `provider-dialog.tsx` 容器 `bg-elevated`
- [x] SubTask 11.4: `token-warning.tsx` 警告/错误色

## Task 12: 文件树面板 ✅
- [x] SubTask 12.1: `file-tree-panel.tsx` 容器 `bg-overlay`
- [x] SubTask 12.2: 文件 hover `bg-elevated`

## Task 13: 验证 ✅
- [x] SubTask 13.1: `npm run build` 通过
- [x] SubTask 13.2: `npm run lint` 通过
- [ ] SubTask 13.3: `npx vitest run` — web 项目无 vitest 依赖（预存问题，与本重构无关）
- [ ] SubTask 13.4: `agent-browser` 截图 — Chrome 下载超时（环境限制）
- [ ] SubTask 13.5: 各页面截图验证 — 同 13.4
- [ ] SubTask 13.6: 代码块/diff 截图 — 同 13.4

# Task Dependencies
- [Task 2] depends on [Task 1] ✓
- [Task 3] depends on [Task 1] ✓
- [Task 4] depends on [Task 1] ✓
- [Task 5..12] depends on [Task 1, Task 2] ✓
- [Task 13] depends on [Task 1..12] ✓
