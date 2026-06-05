# Tasks

- [ ] Task 1: 项目脚手架搭建 — 创建 Next.js 项目结构，配置 TypeScript、Tailwind CSS、部署配置
  - [ ] SubTask 1.1: 在 /workspace/web/ 下初始化 Next.js 项目（App Router）
  - [ ] SubTask 1.2: 配置 Tailwind CSS 和基础 UI 框架（shadcn/ui）
  - [ ] SubTask 1.3: 配置 Vercel 部署（vercel.json、环境变量模板）
  - [ ] SubTask 1.4: 创建运行时特性开关系统（替代 bun:bundle feature()）
  - [ ] SubTask 1.5: 配置 SSE/WebSocket 流式通信基础设施

- [ ] Task 2: 后端核心 — LLM API 代理与会话管理
  - [ ] SubTask 2.1: 实现 /api/chat 流式端点（SSE），封装 Anthropic/OpenAI/Bedrock/Vertex API 调用
  - [ ] SubTask 2.2: 移植 QueryEngine 核心逻辑为服务端事件驱动模式
  - [ ] SubTask 2.3: 实现会话 CRUD API（/api/sessions），使用 Vercel KV 或内存存储
  - [ ] SubTask 2.4: 实现用户认证系统（API Key 加密存储 + OAuth + httpOnly cookie）
  - [ ] SubTask 2.5: 实现模型提供商选择逻辑（从 CLI 版本移植）

- [ ] Task 3: 后端工具执行 — 服务端沙箱
  - [ ] SubTask 3.1: 实现 /api/tools/execute 端点，接收工具调用请求
  - [ ] SubTask 3.2: 移植 BashTool 为服务端执行（使用子进程 + 超时限制）
  - [ ] SubTask 3.3: 移植 FileEditTool/FileReadTool/FileWriteTool 为服务端文件操作
  - [ ] SubTask 3.4: 移植 GlobTool/GrepTool 为服务端搜索
  - [ ] SubTask 3.5: 实现工具权限确认流程（前端确认 → 后端执行 → 结果返回）
  - [ ] SubTask 3.6: 移植 WebFetchTool/WebSearchTool（可直接在服务端运行）

- [ ] Task 4: 前端核心 UI — 聊天界面
  - [ ] SubTask 4.1: 实现主布局（侧边栏会话列表 + 主聊天区域）
  - [ ] SubTask 4.2: 实现消息列表组件（虚拟滚动 + 流式追加）
  - [ ] SubTask 4.3: 实现消息类型渲染（用户消息、助手回复、工具调用、思考过程）
  - [ ] SubTask 4.4: 实现 Markdown 渲染 + 代码高亮（使用 react-markdown + highlight.js）
  - [ ] SubTask 4.5: 实现输入框组件（多行输入 + 发送按钮 + 快捷键）
  - [ ] SubTask 4.6: 实现 SSE 流式接收和实时渲染

- [ ] Task 5: 前端交互 — 工具确认与状态显示
  - [ ] SubTask 5.1: 实现工具权限确认弹窗（批准/拒绝/始终允许）
  - [ ] SubTask 5.2: 实现工具执行状态显示（进行中/完成/失败）
  - [ ] SubTask 5.3: 实现 BashTool 输出显示（终端风格 + ANSI 颜色）
  - [ ] SubTask 5.4: 实现文件编辑差异显示（diff 视图）
  - [ ] SubTask 5.5: 实现成本追踪显示（token 用量 + 费用）

- [ ] Task 6: 前端辅助功能
  - [ ] SubTask 6.1: 实现会话管理（新建/切换/删除/重命名）
  - [ ] SubTask 6.2: 实现斜杠命令系统（/help, /compact, /clear 等）
  - [ ] SubTask 6.3: 实现设置页面（模型选择、API Key 管理、主题切换）
  - [ ] SubTask 6.4: 实现暗色/亮色主题切换
  - [ ] SubTask 6.5: 实现模型选择器（Opus/Sonnet/Haiku + 多提供商）

- [ ] Task 7: MCP 集成（可选，Phase 2）
  - [ ] SubTask 7.1: 实现服务端 MCP 服务器管理 API
  - [ ] SubTask 7.2: 实现 MCP 资源浏览 UI
  - [ ] SubTask 7.3: 实现 MCP 工具调用集成

# Task Dependencies

- [Task 2] depends on [Task 1] — 后端需要项目脚手架
- [Task 3] depends on [Task 2] — 工具执行依赖 QueryEngine 和 API 基础设施
- [Task 4] depends on [Task 1] — 前端需要项目脚手架
- [Task 4] depends on [Task 2] — 聊天 UI 依赖后端 API
- [Task 5] depends on [Task 3] + [Task 4] — 工具确认 UI 依赖工具执行后端和聊天 UI
- [Task 6] depends on [Task 4] — 辅助功能依赖核心 UI
- [Task 7] depends on [Task 2] + [Task 3] — MCP 依赖后端和工具系统

# 可并行的任务

- Task 1 完成后，Task 2（后端）和 Task 4（前端）可以并行开发
- Task 3 和 Task 5 可以部分并行（工具后端实现 vs 工具 UI 设计）
