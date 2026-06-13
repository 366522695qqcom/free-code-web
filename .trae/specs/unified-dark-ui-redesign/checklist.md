# Checklist

## 色板 token (Task 1)
- [ ] `globals.css` 新增 `--bg-base: #1e1e1e`
- [ ] `globals.css` 新增 `--bg-elevated: #252525`
- [ ] `globals.css` 新增 `--bg-overlay: #2d2d2d`
- [ ] `globals.css` 新增 `--text-primary: #e0e0e0`
- [ ] `globals.css` 新增 `--text-muted: #8a8a8a`
- [ ] `globals.css` 新增 `--text-subtle: #5a5a5a`
- [ ] `globals.css` 新增 `--border-subtle: #2f2f2f`
- [ ] `globals.css` 新增 `--border-strong: #3a3a3a`
- [ ] `globals.css` 新增 `--accent-yellow: #c0c0a0`
- [ ] `globals.css` 新增 `--accent-cyan: #c0e0e0`
- [ ] `globals.css` 新增 `--accent-green: #60c040`
- [ ] `globals.css` 新增 `--accent-orange: #e0a040`
- [ ] `globals.css` 新增 `--accent-red: #e06040`
- [ ] `globals.css` 新增 `--accent-purple: #6040e0`
- [ ] `@theme inline` 块为 14 个 token 添加 Tailwind 颜色映射
- [ ] 现有 `:root` 浅色变量全部指向暗色值
- [ ] `--primary` 映射到 `--accent-cyan`
- [ ] `--ring` 映射到 `--accent-cyan`
- [ ] `--destructive` 映射到 `--accent-red`

## 强制暗色 (Task 2)
- [ ] `layout.tsx` `<html class="dark">` 硬编码
- [ ] 任何主题切换 UI 已删除
- [ ] `next-themes` / `useTheme` 引用已清理

## 代码高亮 (Task 3)
- [ ] `.hljs-keyword` → `--accent-purple`
- [ ] `.hljs-string` → `--accent-green`
- [ ] `.hljs-number` / `.hljs-type` → `--accent-orange`
- [ ] `.hljs-function` / `.hljs-title` → `--accent-cyan`
- [ ] `.hljs-comment` → `--text-muted`
- [ ] `.hljs-variable` → `--text-primary`
- [ ] `pre` 块背景 `--bg-elevated`
- [ ] 内联代码背景 `--bg-elevated`、文字 `--accent-cyan`

## Diff 高亮 (Task 4)
- [ ] `.diff-add` 用 `--accent-green` 文字 + 15% 背景
- [ ] `.diff-remove` 用 `--accent-red` 文字 + 15% 背景
- [ ] `.diff-header` 用 `--accent-cyan` + 加粗

## 全站页面 (Task 5)
- [ ] `/login` 整页 `bg-base`，卡片 `bg-elevated`
- [ ] `/` 加载态 `bg-base`
- [ ] `/settings` 主体 `bg-base`
- [ ] `/settings/providers` 主体 `bg-base`
- [ ] `/mcp` 主体 `bg-base`

## 按钮 + 输入框 (Task 6)
- [ ] 主按钮 `bg-accent-cyan text-bg-base`
- [ ] 次要按钮 `bg-elevated border-border-strong`
- [ ] 危险按钮 `bg-accent-red/15 text-accent-red`
- [ ] 警告按钮 `bg-accent-orange/15 text-accent-orange`
- [ ] 输入框 focus 态 `border-accent-cyan ring-2 ring-accent-cyan/30`

## 斜杠命令菜单 (Task 7)
- [ ] 命令列表容器 `bg-overlay`
- [ ] 选中项 `bg-accent-cyan/15 text-accent-cyan`
- [ ] 权限子菜单同样色板

## 侧边栏 (Task 8)
- [ ] 默认项 `text-text-muted`
- [ ] hover 态 `text-primary bg-elevated`
- [ ] 激活项左侧 2px 青色竖条
- [ ] 激活项 `bg-accent-cyan/10 text-accent-cyan`
- [ ] 删除按钮 hover `text-accent-red`
- [ ] 新建按钮 `bg-accent-cyan text-bg-base`

## 消息块 (Task 9)
- [ ] 用户消息右对齐 + `bg-elevated` 圆角
- [ ] 助手消息左对齐 + 透明背景
- [ ] 思考块左侧 3px 黄色竖条
- [ ] 思考块 `bg-accent-yellow/5`
- [ ] 工具调用 `border-border-strong` + 工具名 `text-accent-cyan`
- [ ] 状态徽标：成功绿、失败红、进行中黄

## Topbar (Task 10)
- [ ] 单行布局（左：模型；中：会话；右：上下文）
- [ ] 上下文进度条三色（绿/橙/红）
- [ ] 无主题切换 UI

## 弹窗 (Task 11)
- [ ] ToolConfirmDialog `bg-elevated border-border-strong`
- [ ] AutoApproveToast `bg-overlay`
- [ ] 成功 toast 用 `--accent-green`
- [ ] 失败 toast 用 `--accent-red`
- [ ] ProviderDialog `bg-elevated`
- [ ] TokenWarning 警告 `--accent-orange`
- [ ] TokenWarning 错误 `--accent-red`

## 文件树 (Task 12)
- [ ] 容器 `bg-overlay`
- [ ] 分隔线 `--border-subtle`
- [ ] 文件 hover `bg-elevated`
- [ ] 目录文字 `text-text-muted`

## 验证 (Task 13)
- [ ] `npm run build` 通过
- [ ] `npm run lint` 通过
- [ ] `npx vitest run` 通过
- [ ] `/login` 截图：`bg-base` + 青色 CTA
- [ ] `/` 截图：侧边栏激活青色 + Topbar 单行 + 输入框焦点青色
- [ ] 消息流截图：用户/助手/思考/工具视觉清晰
- [ ] 代码块截图：关键字紫/字符串绿/数字橙/函数青/注释灰
- [ ] diff 截图：+ 行绿、- 行红、@@ 头青
- [ ] `/settings` `/settings/providers` `/mcp` 截图：背景一致
