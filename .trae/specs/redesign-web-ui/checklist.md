# Checklist — 重新设计 Web UI

## 品牌令牌
- [ ] `--background` 浅色为 `#faf9f5`、暗色为 `#141413`
- [ ] `--foreground` 浅色为 `#141413`、暗色为 `#faf9f5`
- [ ] `--primary` 为品牌橙 `#d97757`（亮/暗模式一致）
- [ ] `--accent` 为品牌蓝 `#6a9bcc`
- [ ] `--success` 为品牌绿 `#788c5d`
- [ ] `--muted-foreground` 浅色 `#6b6a63`、暗色 `#b0aea5`
- [ ] `--border` 浅色 `#e8e6dc`、暗色 `#2a2926`
- [ ] `--radius` 基线为 `0.75rem`
- [ ] `--font-sans` 解析为 Poppins（含 Arial 回退）
- [ ] `--font-serif` 解析为 Lora（含 Georgia 回退）
- [ ] `--font-mono` 保留为 Geist Mono / ui-monospace

## 已删除的旧内容
- [ ] `--terminal-green/cyan/amber/red` 全部移除
- [ ] `cursor-blink` 关键帧与 `.animate-cursor-blink` 类移除
- [ ] `pulse-glow` 关键帧与 `.animate-pulse-glow` 类移除
- [ ] `.terminal-output` 工具类移除
- [ ] 所有 `text-terminal-*` / `bg-terminal-*` 类名替换为品牌 token

## 登录页（/login）
- [ ] 背景为品牌浅色 `#faf9f5`
- [ ] "Free Code" 标题用 Poppins 24pt 600，颜色 `#141413`
- [ ] 副标题用 Lora 400，颜色 `#6b6a63`
- [ ] 卡片白底 + 1px `#e8e6dc` 边框 + 0.75rem 圆角 + 柔和阴影
- [ ] 主按钮 `bg-primary`（橙色）+ 白字
- [ ] 无 `$` 前缀或终端装饰

## 主加载态（/）
- [ ] 加载占位为 Poppins 文字 "Loading…" + 简洁 spinner
- [ ] 无闪烁光标

## 主布局（chat-layout）
- [ ] 根容器无 `font-mono`
- [ ] 顶栏高度 48px、背景 `--background`、底边 `--border`
- [ ] 文件树按钮用 `text-foreground/70 hover:text-foreground`
- [ ] 错误栏使用 `--destructive`
- [ ] 系统消息（terminal echo）改为品牌色下划线段落，无 `font-mono`

## 侧边栏（sidebar）
- [ ] 无 `> ` 前缀
- [ ] 无 `text-terminal-*` 引用
- [ ] 无 `font-mono`
- [ ] 激活项：2px 左侧橙色竖条 + 浅橙背景
- [ ] 搜索框焦点色 `border-primary/40`
- [ ] 右键菜单用 shadcn 圆角风格
- [ ] 会话项：Poppins 字体、8px 圆角 hover 高亮

## 聊天核心
- [ ] chat-input：斜杠命令菜单保留极简、sans 字体
- [ ] chat-area：无终端背景装饰
- [ ] token-warning：用品牌橙做警告
- [ ] auto-approve-toast：shadcn Toast 风格
- [ ] tool-confirm-dialog：按钮用品牌色
- [ ] provider-dialog：圆角与品牌色

## 消息块
- [ ] assistant-message：Lora 字体、行高 1.7
- [ ] user-message：`bg-muted` 气泡、圆角 1rem
- [ ] thinking-block：左侧 2px 蓝色竖条
- [ ] tool-use-block / tool-result-block：卡片化（bg-card + 1px border + 0.75rem 圆角）
- [ ] 行内 code：背景 `--muted`、颜色 `--primary`、圆角 0.3rem
- [ ] 代码块：暗色背景 `#1c1b1a`，配色按品牌重映射
- [ ] message-list：消息间距 24px、淡入动画保留

## 二级页面
- [ ] /settings：应用品牌令牌
- [ ] /settings/providers：列表项圆角 + 橙色主按钮
- [ ] /mcp：服务器卡片用 bg-card 边框风格

## 构建与测试
- [ ] `npm run build` 通过
- [ ] `npm run lint` 通过
- [ ] `npx vitest run` 通过

## 视觉验收
- [ ] 浅色模式：/login、/、/settings、/settings/providers、/mcp 五个页面目视无终端感
- [ ] 暗色模式：五个页面背景为 `#141413`、文本 `#faf9f5`
- [ ] 1280px 桌面：所有面板完整可见、不破版
- [ ] 768px 平板：侧边栏可折叠、消息区占满
- [ ] 375px 手机：单列布局、不横向滚动

## 保留的功能
- [ ] 登录/登出流程仍正常
- [ ] 会话创建/选择/重命名/删除仍正常
- [ ] 斜杠命令（/clear、/help、/model、/permissions 等）行为不变
- [ ] 工具调用确认弹窗仍工作
- [ ] SSE 流式输出仍正常
- [ ] 权限模式四档切换仍正常
- [ ] Provider 管理仍可增删改
- [ ] MCP 面板仍可连接
