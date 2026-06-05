# Tasks

- [x] Task 1: 项目脚手架搭建 — 创建 Next.js 项目结构，配置 TypeScript、Tailwind CSS、部署配置
  - [x] SubTask 1.1: 在 /workspace/web/ 下初始化 Next.js 项目（App Router）
  - [x] SubTask 1.2: 配置 Tailwind CSS 和基础 UI 框架（shadcn/ui）
  - [x] SubTask 1.3: 配置 Vercel 部署（vercel.json、环境变量模板）
  - [x] SubTask 1.4: 创建运行时特性开关系统（替代 bun:bundle feature()）
  - [x] SubTask 1.5: 配置 SSE/WebSocket 流式通信基础设施

- [x] Task 2: 后端核心 — LLM API 代理与会话管理
  - [x] SubTask 2.1: 实现 /api/chat 流式端点（SSE），封装 Anthropic/OpenAI API 调用
  - [x] SubTask 2.2: 实现 QueryEngine 核心逻辑为服务端事件驱动模式
  - [x] SubTask 2.3: 实现会话 CRUD API（/api/sessions），内存存储
  - [x] SubTask 2.4: 实现用户认证系统（环境变量 AUTH_USERNAME/AUTH_PASSWORD + httpOnly cookie + 登录页面）
  - [x] SubTask 2.5: 实现模型提供商选择逻辑（Anthropic + OpenAI）

- [x] Task 3: 后端工具执行 — 服务端直接执行
  - [x] SubTask 3.1: 实现 /api/tools/execute 端点，接收工具调用请求
  - [x] SubTask 3.2: 移植 BashTool 为服务端执行（使用子进程 + 超时限制，无需沙箱）
  - [x] SubTask 3.3: 移植 FileEditTool/FileReadTool/FileWriteTool 为服务端文件操作
  - [x] SubTask 3.4: 移植 GlobTool/GrepTool 为服务端搜索
  - [x] SubTask 3.5: 实现工具权限确认流程（前端确认 → 后端执行 → 结果返回）
  - [x] SubTask 3.6: 移植 WebFetchTool/WebSearchTool（可直接在服务端运行）

- [x] Task 4: 前端核心 UI — 聊天界面（终端风格）
  - [x] SubTask 4.1: 实现主布局（侧边栏会话列表 + 主聊天区域）
  - [x] SubTask 4.2: 实现消息列表组件（自动滚动 + 流式追加）
  - [x] SubTask 4.3: 实现消息类型渲染（用户消息、助手回复、工具调用、思考过程）
  - [x] SubTask 4.4: 实现 Markdown 渲染 + 代码高亮（react-markdown + rehype-highlight）
  - [x] SubTask 4.5: 实现输入框组件（多行输入 + 发送按钮 + Ctrl+Enter + 斜杠命令）
  - [x] SubTask 4.6: 实现 SSE 流式接收和实时渲染

- [x] Task 5: 前端交互 — 工具确认与状态显示
  - [x] SubTask 5.1: 实现工具权限确认弹窗（批准/拒绝/始终允许）
  - [x] SubTask 5.2: 实现工具执行状态显示（进行中/完成/失败）
  - [x] SubTask 5.3: 实现 BashTool 输出显示（终端风格 + ANSI 颜色）
  - [x] SubTask 5.4: 实现文件编辑差异显示（diff 视图）
  - [x] SubTask 5.5: 实现成本追踪显示（token 用量 + 费用）

- [x] Task 6: 前端辅助功能
  - [x] SubTask 6.1: 实现会话管理（新建/切换/删除/重命名 + 搜索过滤）
  - [x] SubTask 6.2: 实现斜杠命令系统（/help, /compact, /clear, /model, /cost, /tools）
  - [x] SubTask 6.3: 实现设置页面（模型选择、主题切换、工具权限、关于）
  - [x] SubTask 6.4: 实现暗色/亮色主题切换（dark/light/system 循环）
  - [x] SubTask 6.5: 实现模型选择器（按提供商分组 + 能力标签）

- [x] Task 7: MCP 集成
  - [x] SubTask 7.1: 实现服务端 MCP 服务器管理 API（/api/mcp/servers CRUD + 连接/断开）
  - [x] SubTask 7.2: 实现 MCP 资源浏览 UI（服务器列表、资源列表、工具列表）
  - [x] SubTask 7.3: 实现 MCP 工具调用集成（MCP 工具注册到工具系统、前端调用展示）
