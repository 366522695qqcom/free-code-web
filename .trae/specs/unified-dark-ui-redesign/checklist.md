# Checklist

## 色板 token (Task 1) ✅
- [x] `globals.css` 新增 `--bg-base: #1e1e1e`
- [x] `globals.css` 新增 `--bg-elevated: #252525`
- [x] `globals.css` 新增 `--bg-overlay: #2d2d2d`
- [x] `globals.css` 新增 `--text-primary: #e0e0e0`
- [x] `globals.css` 新增 `--text-muted: #8a8a8a`
- [x] `globals.css` 新增 `--text-subtle: #5a5a5a`
- [x] `globals.css` 新增 `--border-subtle: #2f2f2f`
- [x] `globals.css` 新增 `--border-strong: #3a3a3a`
- [x] `globals.css` 新增 `--accent-yellow: #c0c0a0`
- [x] `globals.css` 新增 `--accent-cyan: #c0e0e0`
- [x] `globals.css` 新增 `--accent-green: #60c040`
- [x] `globals.css` 新增 `--accent-orange: #e0a040`
- [x] `globals.css` 新增 `--accent-red: #e06040`
- [x] `globals.css` 新增 `--accent-purple: #6040e0`
- [x] `@theme inline` 块为 14 个 token 添加 Tailwind 颜色映射
- [x] 现有 `:root` 浅色变量已删除
- [x] `--primary` 映射到 `--accent-cyan`
- [x] `--ring` 映射到 `--accent-cyan`
- [x] `--destructive` 映射到 `--accent-red`

## 强制暗色 (Task 2) ✅
- [x] `layout.tsx` `<html class="dark">` 硬编码
- [x] `next-themes` / `ThemeProvider` 引用已清理
- [x] topbar 主题切换按钮已删除
- [x] settings 页面 Theme 卡片已删除

## 代码高亮 (Task 3) ✅
- [x] `.hljs-keyword` → `--accent-purple`
- [x] `.hljs-string` → `--accent-green`
- [x] `.hljs-number` / `.hljs-type` → `--accent-orange`
- [x] `.hljs-function` / `.hljs-title` → `--accent-cyan`
- [x] `.hljs-comment` → `--text-muted`
- [x] `.hljs-variable` → `--text-primary`
- [x] `pre` 块背景 `--bg-elevated`
- [x] 内联代码背景 `--bg-elevated`、文字 `--accent-cyan`

## Diff 高亮 (Task 4) ✅
- [x] `.diff-add` 用 `--accent-green` 文字 + 15% 背景
- [x] `.diff-remove` 用 `--accent-red` 文字 + 15% 背景
- [x] `.diff-header` 用 `--accent-cyan` + 加粗

## 全站页面 (Task 5) ✅
- [x] `/login` 整页 `bg-base`
- [x] `/` 加载态 `bg-base`
- [x] `/settings` 主体 `bg-base`
- [x] `/settings/providers` 主体 `bg-base`
- [x] `/mcp` 主体 `bg-base`

## 按钮 + 输入框 (Task 6) ✅
- [x] 36 个文件批量替换主色为 `bg-accent-cyan text-bg-base`
- [x] `bg-destructive` → `bg-accent-red/15 text-accent-red`
- [x] 焦点环通过 `--ring` token 重映射为青色

## 斜杠命令菜单 (Task 7) ✅
- [x] 命令列表沿用新色板 token

## 侧边栏 (Task 8) ✅
- [x] 默认项 `text-text-muted`
- [x] hover 态 `text-text-primary bg-overlay`
- [x] 激活项左侧 2px 青色竖条
- [x] 激活项 `bg-accent-cyan/10 text-accent-cyan`
- [x] 删除按钮 hover `text-accent-red`
- [x] 新建按钮用新 token

## 消息块 (Task 9) ✅
- [x] 用户消息 `bg-elevated` 圆角
- [x] 助手消息透明背景
- [x] 思考块黄色竖条
- [x] 思考块 `bg-accent-yellow/5`
- [x] 工具调用青色边框 + 工具名青色

## Topbar (Task 10) ✅
- [x] 单行布局
- [x] 进度条三色
- [x] 无主题切换 UI

## 弹窗 (Task 11) ✅
- [x] ToolConfirmDialog `bg-elevated`
- [x] AutoApproveToast `bg-overlay`
- [x] 成功 toast `--accent-green`
- [x] 失败 toast `--accent-red`
- [x] ProviderDialog `bg-elevated`
- [x] TokenWarning 警告/错误色

## 文件树 (Task 12) ✅
- [x] 容器 `bg-overlay`
- [x] 分隔线 `--border-subtle`
- [x] 文件 hover `bg-elevated`

## 验证 (Task 13) ✅
- [x] `npm run build` 通过
- [x] `npm run lint` 通过
- [ ] `npx vitest run` — web 项目无 vitest 依赖（预存问题，与本重构无关）
- [ ] `agent-browser` 截图 — Chrome 下载超时（环境限制）
