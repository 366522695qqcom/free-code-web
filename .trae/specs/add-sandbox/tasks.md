# Tasks

- [ ] Task 1: 沙箱核心层 — SandboxManager 和 Vercel Sandbox SDK 集成
  - [ ] SubTask 1.1: 安装 @vercel/sandbox SDK 依赖
  - [ ] SubTask 1.2: 创建 /workspace/web/src/lib/sandbox/manager.ts — SandboxManager 类，管理沙箱生命周期（create/stop/resume/destroy），会话-沙箱映射，内存状态存储
  - [ ] SubTask 1.3: 创建 /workspace/web/src/lib/sandbox/config.ts — 沙箱配置读取（环境变量：SANDBOX_ENABLED, SANDBOX_RUNTIME, SANDBOX_VCPUS, SANDBOX_MEMORY, SANDBOX_TIMEOUT_MS, SANDBOX_PERSISTENT, VERCEL_TOKEN）
  - [ ] SubTask 1.4: 创建 /workspace/web/src/lib/sandbox/types.ts — 沙箱相关类型定义（SandboxInfo, SandboxStatus, SandboxConfig 等）
  - [ ] SubTask 1.5: 创建 /workspace/web/src/lib/sandbox/index.ts — 导出模块入口

- [ ] Task 2: 沙箱工具执行适配 — 修改工具层支持沙箱路由
  - [ ] SubTask 2.1: 修改 /workspace/web/src/lib/tools/registry.ts — ToolExecutor 接口新增 `sandboxCapable?: boolean` 标志和 `executeInSandbox?(params, sandbox): Promise<ToolResult>` 方法
  - [ ] SubTask 2.2: 创建 /workspace/web/src/lib/sandbox/tool-adapter.ts — 沙箱工具适配器，将宿主机工具调用路由到沙箱内执行（BashTool→sandbox.runCommand, FileReadTool→sandbox.fs.readFile, FileWriteTool→sandbox.fs.writeFile, FileEditTool→read+diff+write, GlobTool→sandbox.runCommand('find'), GrepTool→sandbox.runCommand('rg')）
  - [ ] SubTask 2.3: 修改 /workspace/web/src/lib/tools/bash.ts — 添加 `sandboxCapable: true` 和 `executeInSandbox` 方法
  - [ ] SubTask 2.4: 修改 /workspace/web/src/lib/tools/file-tools.ts — 为 FileReadTool/FileWriteTool/FileEditTool 添加 `sandboxCapable: true` 和 `executeInSandbox` 方法
  - [ ] SubTask 2.5: 修改 /workspace/web/src/lib/tools/search-tools.ts — 为 GlobTool/GrepTool 添加 `sandboxCapable: true` 和 `executeInSandbox` 方法
  - [ ] SubTask 2.6: 修改 /workspace/web/src/lib/agent-stream.ts — executeTools 函数根据沙箱模式选择执行路径（sandboxEnabled ? executeInSandbox : execute）

- [ ] Task 3: 沙箱管理 API
  - [ ] SubTask 3.1: 创建 /workspace/web/src/app/api/sandbox/route.ts — GET（获取沙箱状态，支持 ?sessionId= 查询）+ POST（创建沙箱）
  - [ ] SubTask 3.2: 创建 /workspace/web/src/app/api/sandbox/[id]/route.ts — GET（沙箱详情）+ DELETE（销毁沙箱）
  - [ ] SubTask 3.3: 创建 /workspace/web/src/app/api/sandbox/[id]/stop/route.ts — POST（停止沙箱）
  - [ ] SubTask 3.4: 创建 /workspace/web/src/app/api/sandbox/[id]/resume/route.ts — POST（恢复沙箱）
  - [ ] SubTask 3.5: 创建 /workspace/web/src/app/api/sandbox/[id]/snapshot/route.ts — POST（创建快照）

- [ ] Task 4: 前端沙箱面板
  - [ ] SubTask 4.1: 创建 /workspace/web/src/components/sandbox/sandbox-indicator.tsx — 沙箱状态指示器（显示在顶栏，状态图标+沙箱ID）
  - [ ] SubTask 4.2: 创建 /workspace/web/src/components/sandbox/sandbox-panel.tsx — 沙箱管理面板（状态详情、操作按钮、资源信息）
  - [ ] SubTask 4.3: 创建 /workspace/web/src/hooks/use-sandbox.ts — 沙箱管理 hook（状态查询、创建、停止、恢复、销毁）
  - [ ] SubTask 4.4: 修改 /workspace/web/src/components/layout/topbar.tsx — 集成沙箱状态指示器
  - [ ] SubTask 4.5: 修改 /workspace/web/src/components/layout/chat-layout.tsx — 集成沙箱面板

- [ ] Task 5: 配置与文档
  - [ ] SubTask 5.1: 更新 /workspace/web/.env.example — 添加沙箱相关环境变量模板
  - [ ] SubTask 5.2: 更新 /workspace/web/src/app/settings/page.tsx — 添加沙箱配置区域（启用/禁用开关、运行时选择、资源规格）
  - [ ] SubTask 5.3: 验证构建通过（npm run build + npm run lint）

# Task Dependencies

- [Task 2] depends on [Task 1] — 工具适配需要 SandboxManager
- [Task 3] depends on [Task 1] — API 路由需要 SandboxManager
- [Task 4] depends on [Task 3] — 前端面板依赖 API
- [Task 5] depends on [Task 1-4] — 配置和验证依赖所有功能完成

# 可并行的任务

- Task 2 和 Task 3 可以并行（工具适配 vs API 路由，都依赖 Task 1）
- Task 4 的组件开发可以与 Task 2/3 并行（使用 mock 数据）
