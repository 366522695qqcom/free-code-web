# Tasks

- [x] Task 1: 模型提供商弹窗化 — 将独立页面重构为 Dialog 组件
  - [x] SubTask 1.1: 创建 /workspace/web/src/components/chat/provider-dialog.tsx — 将 providers/page.tsx 的核心逻辑提取为 Dialog 组件，移除左侧导航和页面布局，保留提供商列表、配置面板、模型获取、模型管理
  - [x] SubTask 1.2: 修改 /workspace/web/src/components/chat/chat-input.tsx — 状态栏新增提供商图标按钮（Server icon），点击打开 provider-dialog
  - [x] SubTask 1.3: 修改 /workspace/web/src/components/layout/chat-layout.tsx — 集成 ProviderDialog，传递 customModels 和 onCustomModelsChange 回调

- [x] Task 2: 文件树面板 — 实时会话文件结构展示
  - [x] SubTask 2.1: 创建 /workspace/web/src/hooks/use-file-tree.ts — 从消息流中提取文件操作记录，构建树形数据结构，跟踪新增/修改状态
  - [x] SubTask 2.2: 创建 /workspace/web/src/components/chat/file-tree-panel.tsx — 文件树组件，支持展开/折叠目录，新增/修改标记，点击滚动
  - [x] SubTask 2.3: 修改 /workspace/web/src/components/layout/chat-layout.tsx — 添加文件树面板到聊天区左侧，支持显示/隐藏切换

- [x] Task 3: 增强代码 diff 预览 — 语法高亮和行内 diff
  - [x] SubTask 3.1: 修改 /workspace/web/src/components/chat/diff-view.tsx — highlight.js 语法高亮、行号、增删行着色
  - [x] SubTask 3.2: 修改 /workspace/web/src/components/messages/tool-result-block.tsx — 默认展开 diff、语言标签、复制按钮

- [x] Task 4: @ 文件引用 — 输入框文件路径补全
  - [x] SubTask 4.1: 创建 /workspace/web/src/app/api/files/route.ts — 文件列表 API
  - [x] SubTask 4.2: 修改 /workspace/web/src/components/chat/chat-input.tsx — @ 自动补全
  - [x] SubTask 4.3: 修改 /workspace/web/src/hooks/use-chat.ts — @ 引用解析
  - [x] SubTask 4.4: 创建 /workspace/web/src/app/api/files/content/route.ts — 文件内容 API

- [x] Task 5: 上下文窗口监控 — 状态栏 token 用量显示
  - [x] SubTask 5.1: 修改 /workspace/web/src/hooks/use-chat.ts — contextPercentage 计算
  - [x] SubTask 5.2: 修改 /workspace/web/src/components/chat/chat-input.tsx — 状态栏 ctx: XX% 显示

- [x] Task 6: 补充斜杠命令 — /context、/review、/status
  - [x] SubTask 6.1: 修改 /workspace/web/src/components/layout/chat-layout.tsx — 三个新命令 + /api/status 端点

- [x] Task 7: 验证构建通过
  - [x] SubTask 7.1: npm run build 通过
  - [x] SubTask 7.2: npm run lint 无错误（0 errors, 3 warnings only）

# Task Dependencies

- [Task 1] depends on nothing
- [Task 2] depends on nothing
- [Task 3] depends on nothing
- [Task 4] depends on nothing
- [Task 5] depends on nothing
- [Task 6] depends on [Task 5]
- [Task 7] depends on [Task 1-6]
