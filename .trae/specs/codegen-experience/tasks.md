# Tasks

- [ ] Task 1: 模型提供商弹窗化 — 将独立页面重构为 Dialog 组件
  - [ ] SubTask 1.1: 创建 /workspace/web/src/components/chat/provider-dialog.tsx — 将 providers/page.tsx 的核心逻辑提取为 Dialog 组件，移除左侧导航和页面布局，保留提供商列表、配置面板、模型获取、模型管理
  - [ ] SubTask 1.2: 修改 /workspace/web/src/components/chat/chat-input.tsx — 状态栏新增提供商图标按钮，点击打开 provider-dialog
  - [ ] SubTask 1.3: 修改 /workspace/web/src/components/layout/chat-layout.tsx — 集成 ProviderDialog，传递 customModels 和 onCustomModelsChange 回调

- [ ] Task 2: 文件树面板 — 实时会话文件结构展示
  - [ ] SubTask 2.1: 创建 /workspace/web/src/components/chat/file-tree-panel.tsx — 文件树组件，从工具调用结果中提取文件路径，构建树形结构，支持展开/折叠，新增/修改文件标记
  - [ ] SubTask 2.2: 修改 /workspace/web/src/components/layout/chat-layout.tsx — 添加文件树面板到聊天区左侧，支持显示/隐藏切换
  - [ ] SubTask 2.3: 创建 /workspace/web/src/hooks/use-file-tree.ts — 从消息流中提取文件操作记录，构建文件树数据结构

- [ ] Task 3: 增强代码 diff 预览 — 语法高亮和行内 diff
  - [ ] SubTask 3.1: 修改 /workspace/web/src/components/chat/diff-view.tsx — 增强语法高亮（基于文件扩展名自动检测语言），行号显示，增删行着色
  - [ ] SubTask 3.2: 修改 /workspace/web/src/components/messages/tool-result-block.tsx — 文件编辑结果默认展开 diff 视图，代码块添加语言标签和复制按钮

- [ ] Task 4: 验证构建通过
  - [ ] SubTask 4.1: npm run build 通过
  - [ ] SubTask 4.2: npm run lint 无错误

# Task Dependencies

- [Task 1] depends on nothing — 弹窗化可独立进行
- [Task 2] depends on nothing — 文件树可独立进行
- [Task 3] depends on nothing — diff 增强可独立进行
- [Task 4] depends on [Task 1-3]

# 可并行的任务

- Task 1（弹窗化）、Task 2（文件树）、Task 3（diff 增强）可以完全并行
