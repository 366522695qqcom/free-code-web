# Tasks — 重新设计 Web UI

## Task 1: 注入 Poppins + Lora 字体
替换默认 Geist 字体为 Anthropic 品牌字体（Poppins 标题/UI + Lora 正文），保留 Geist Mono 用于代码。
- [ ] SubTask 1.1: 在 [layout.tsx](file:///workspace/web/src/app/layout.tsx) 中通过 `next/font/google` 加载 Poppins (400, 500, 600, 700) 与 Lora (400, 500, 600)
- [ ] SubTask 1.2: 将字体 CSS 变量绑定到 `<html>` 的 `style`，供 `globals.css` 引用
- [ ] SubTask 1.3: 验证：`npm run build` 通过、`<body>` 计算字体为 Poppins

## Task 2: 重写设计令牌（globals.css）
将 oklch 调色板 + 终端色全部替换为 Anthropic 品牌令牌。
- [ ] SubTask 2.1: 在 `:root` 与 `.dark` 中按 [spec.md](file:///workspace/.trae/specs/redesign-web-ui/spec.md#requirement-品牌设计令牌) 表替换所有颜色变量
- [ ] SubTask 2.2: 删除 `terminal-green/cyan/amber/red` 变量
- [ ] SubTask 2.3: 删除 `cursor-blink`、`pulse-glow` 关键帧与 `.animate-cursor-blink`、`.animate-pulse-glow` 工具类
- [ ] SubTask 2.4: 删除 `.terminal-output` 工具类
- [ ] SubTask 2.5: 调整 highlight.js 配色：keyword 用品牌橙、string 用品牌绿、function 用品牌蓝
- [ ] SubTask 2.6: diff 配色用品牌绿/红 token

## Task 3: 重做登录页
- [ ] SubTask 3.1: 改写 [login/page.tsx](file:///workspace/web/src/app/login/page.tsx)：标题用 Poppins、副标题用 Lora、卡片用品牌色边框与圆角
- [ ] SubTask 3.2: 主按钮应用 `bg-primary text-primary-foreground`（橙色 #d97757）
- [ ] SubTask 3.3: 验证：登录流程仍可走通（提交后跳转 `/`）

## Task 4: 重做主加载态
- [ ] SubTask 4.1: 改写 [page.tsx](file:///workspace/web/src/app/page.tsx) 的 loading 占位：去掉 `$` 前缀与闪烁光标，改为 Poppins 文字 "Loading…" + 简洁 spinner

## Task 5: 重做主布局
- [ ] SubTask 5.1: [chat-layout.tsx](file:///workspace/web/src/components/layout/chat-layout.tsx)：移除根容器 `font-mono`、系统消息去掉 `font-mono` 与 `text-terminal-cyan/70`
- [ ] SubTask 5.2: 顶栏高度 48px、`bg-background`、底边 `border-border`；文件树按钮用 `text-foreground/70 hover:text-foreground`
- [ ] SubTask 5.3: 错误栏颜色用 `--destructive` token

## Task 6: 重做侧边栏
- [ ] SubTask 6.1: [sidebar.tsx](file:///workspace/web/src/components/layout/sidebar.tsx)：移除 `> ` 前缀、移除所有 `text-terminal-*`、移除 `font-mono`
- [ ] SubTask 6.2: 激活项改用 2px 左侧橙色竖条 + `bg-accent/10` 背景
- [ ] SubTask 6.3: 搜索框焦点色改用 `border-primary/40`
- [ ] SubTask 6.4: 右键菜单用 shadcn 圆角风格（替换 0.5px 直角）

## Task 7: 重做聊天核心
- [ ] SubTask 7.1: [chat-input.tsx](file:///workspace/web/src/components/chat/chat-input.tsx)：去掉 `font-mono`、斜杠命令菜单保留极简（无描述），使用 sans 字体
- [ ] SubTask 7.2: [chat-area.tsx](file:///workspace/web/src/components/chat-area.tsx)：移除终端背景装饰，调整消息间距
- [ ] SubTask 7.3: [token-warning.tsx](file:///workspace/web/src/components/chat/token-warning.tsx)：用品牌橙色做警告色
- [ ] SubTask 7.4: [auto-approve-toast.tsx](file:///workspace/web/src/components/chat/auto-approve-toast.tsx)：用 shadcn Toast 风格（圆角 + 阴影）
- [ ] SubTask 7.5: [tool-confirm-dialog.tsx](file:///workspace/web/src/components/chat/tool-confirm-dialog.tsx)：按钮用品牌色
- [ ] SubTask 7.6: [provider-dialog.tsx](file:///workspace/web/src/components/chat/provider-dialog.tsx)：统一圆角与品牌色

## Task 8: 重做消息块
- [ ] SubTask 8.1: [messages/assistant-message.tsx](file:///workspace/web/src/components/messages/assistant-message.tsx)：正文用 Lora，行高 1.7
- [ ] SubTask 8.2: [messages/user-message.tsx](file:///workspace/web/src/components/messages/user-message.tsx)：气泡背景 `--muted`、圆角 1rem
- [ ] SubTask 8.3: [messages/thinking-block.tsx](file:///workspace/web/src/components/messages/thinking-block.tsx)：左侧 2px 蓝色竖条
- [ ] SubTask 8.4: [messages/tool-use-block.tsx](file:///workspace/web/src/components/messages/tool-use-block.tsx) + [tool-result-block.tsx](file:///workspace/web/src/components/messages/tool-result-block.tsx)：卡片化
- [ ] SubTask 8.5: [text-block.tsx](file:///workspace/web/src/components/messages/text-block.tsx)：行内 code 用品牌橙
- [ ] SubTask 8.6: [message-list.tsx](file:///workspace/web/src/components/messages/message-list.tsx)：消息间距 24px、淡入动画保留

## Task 9: 重做二级页面
- [ ] SubTask 9.1: [settings/page.tsx](file:///workspace/web/src/app/settings/page.tsx)：应用品牌令牌
- [ ] SubTask 9.2: [settings/providers/page.tsx](file:///workspace/web/src/app/settings/providers/page.tsx) + [model-dialog.tsx](file:///workspace/web/src/app/settings/providers/model-dialog.tsx)：列表项圆角 + 橙色主按钮
- [ ] SubTask 9.3: [mcp/page.tsx](file:///workspace/web/src/app/mcp/page.tsx) + [components/mcp/*](file:///workspace/web/src/components/mcp)：服务器卡片用 `bg-card` 边框风格

## Task 10: 清理残留
- [ ] SubTask 10.1: 全项目搜索 `terminal-green`、`terminal-cyan`、`terminal-amber`、`terminal-red`、`animate-cursor-blink`、`animate-pulse-glow`、`terminal-output`，全部替换或删除
- [ ] SubTask 10.2: 全项目搜索 `font-mono`（保留在 `<pre>`、`<code>`、DiffView、AnsiRenderer 等代码区），其他位置去除

## Task Dependencies
- Task 2（令牌）依赖 Task 1（字体）完成
- Task 3-9 依赖 Task 1 + Task 2 完成
- Task 10 依赖 Task 3-9 完成

## 验证（在最后并行执行）
- [ ] `cd /workspace/web && npm run build` 通过
- [ ] `npm run lint` 通过
- [ ] `npx vitest run` 通过
- [ ] 浏览器目视检查 `/login`、`/`、`/settings`、`/settings/providers`、`/mcp` 浅色模式
- [ ] 浏览器目视检查以上页面暗色模式
- [ ] 响应式 1280 / 768 / 375 px 不破版
