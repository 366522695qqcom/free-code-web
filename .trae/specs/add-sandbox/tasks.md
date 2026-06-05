# Tasks

- [ ] Task 1: 权限分级系统 — 核心逻辑与风险判定
  - [ ] SubTask 1.1: 创建 /workspace/web/src/lib/permissions/types.ts — 权限等级类型定义（RiskLevel: low/high/outside-sandbox, PermissionRule, PermissionDecision）
  - [ ] SubTask 1.2: 创建 /workspace/web/src/lib/permissions/risk-assessor.ts — 风险评估器，根据工具名和参数判定风险等级（BashTool 命令模式匹配、文件操作工具分级、用户自定义规则覆盖）
  - [ ] SubTask 1.3: 创建 /workspace/web/src/lib/permissions/rules.ts — 默认权限规则定义（低风险命令白名单、高风险命令模式、沙箱外命令模式）
  - [ ] SubTask 1.4: 创建 /workspace/web/src/lib/permissions/index.ts — 导出模块入口，提供 `assessRisk(toolName, params, sandboxEnabled)` 函数

- [ ] Task 2: 沙箱核心层 — SandboxManager 和 Vercel Sandbox SDK 集成
  - [ ] SubTask 2.1: 安装 @vercel/sandbox SDK 依赖
  - [ ] SubTask 2.2: 创建 /workspace/web/src/lib/sandbox/manager.ts — SandboxManager 类，管理沙箱生命周期（create/stop/resume/destroy），会话-沙箱映射，内存状态存储
  - [ ] SubTask 2.3: 创建 /workspace/web/src/lib/sandbox/config.ts — 沙箱配置读取（环境变量：SANDBOX_ENABLED, SANDBOX_RUNTIME, SANDBOX_VCPUS, SANDBOX_MEMORY, SANDBOX_TIMEOUT_MS, SANDBOX_PERSISTENT, VERCEL_TOKEN）
  - [ ] SubTask 2.4: 创建 /workspace/web/src/lib/sandbox/types.ts — 沙箱相关类型定义（SandboxInfo, SandboxStatus, SandboxConfig 等）
  - [ ] SubTask 2.5: 创建 /workspace/web/src/lib/sandbox/index.ts — 导出模块入口

- [ ] Task 3: 沙箱工具执行适配 — 修改工具层支持沙箱路由和权限分级
  - [ ] SubTask 3.1: 修改 /workspace/web/src/lib/tools/registry.ts — ToolExecutor 接口新增 `sandboxCapable?: boolean` 标志和 `executeInSandbox?(params, sandbox): Promise<ToolResult>` 方法
  - [ ] SubTask 3.2: 创建 /workspace/web/src/lib/sandbox/tool-adapter.ts — 沙箱工具适配器，将宿主机工具调用路由到沙箱内执行
  - [ ] SubTask 3.3: 修改 /workspace/web/src/lib/tools/bash.ts — 添加 `sandboxCapable: true` 和 `executeInSandbox` 方法
  - [ ] SubTask 3.4: 修改 /workspace/web/src/lib/tools/file-tools.ts — 为 FileReadTool/FileWriteTool/FileEditTool 添加 `sandboxCapable: true` 和 `executeInSandbox` 方法
  - [ ] SubTask 3.5: 修改 /workspace/web/src/lib/tools/search-tools.ts — 为 GlobTool/GrepTool 添加 `sandboxCapable: true` 和 `executeInSandbox` 方法
  - [ ] SubTask 3.6: 修改 /workspace/web/src/lib/agent-stream.ts — executeTools 函数集成权限分级：调用 assessRisk() 判定风险等级，低风险直接执行，高风险触发确认流程，沙箱外执行触发特殊确认

- [ ] Task 4: 沙箱管理 API
  - [ ] SubTask 4.1: 创建 /workspace/web/src/app/api/sandbox/route.ts — GET（获取沙箱状态，支持 ?sessionId= 查询）+ POST（创建沙箱）
  - [ ] SubTask 4.2: 创建 /workspace/web/src/app/api/sandbox/[id]/route.ts — GET（沙箱详情）+ DELETE（销毁沙箱）
  - [ ] SubTask 4.3: 创建 /workspace/web/src/app/api/sandbox/[id]/stop/route.ts — POST（停止沙箱）
  - [ ] SubTask 4.4: 创建 /workspace/web/src/app/api/sandbox/[id]/resume/route.ts — POST（恢复沙箱）
  - [ ] SubTask 4.5: 创建 /workspace/web/src/app/api/sandbox/[id]/snapshot/route.ts — POST（创建快照）

- [ ] Task 5: 前端权限确认增强
  - [ ] SubTask 5.1: 修改 /workspace/web/src/components/chat/tool-confirm-dialog.tsx — 增强确认弹窗：区分高风险（黄色标签）和沙箱外执行（红色边框+警告），显示执行环境标签，沙箱外执行不提供"始终允许"
  - [ ] SubTask 5.2: 创建 /workspace/web/src/components/chat/auto-approve-toast.tsx — 低风险操作自动放行提示（轻量 toast，3 秒消失）
  - [ ] SubTask 5.3: 修改 /workspace/web/src/hooks/use-chat.ts — 集成权限分级：处理 risk_level 字段，低风险自动放行+toast，高风险弹出确认，沙箱外执行弹出特殊确认
  - [ ] SubTask 5.4: 修改 /workspace/web/src/components/layout/chat-layout.tsx — 集成自动放行 toast

- [ ] Task 6: 配置、设置页面与验证
  - [ ] SubTask 6.1: 更新 /workspace/web/.env.example — 添加沙箱相关环境变量模板
  - [ ] SubTask 6.2: 更新 /workspace/web/src/app/settings/page.tsx — 添加沙箱配置区域和自定义权限规则管理
  - [ ] SubTask 6.3: 验证构建通过（npm run build + npm run lint）

# Task Dependencies

- [Task 2] depends on nothing — 沙箱核心层可独立开发
- [Task 1] depends on nothing — 权限分级可独立开发
- [Task 3] depends on [Task 1] + [Task 2] — 工具适配需要权限分级和 SandboxManager
- [Task 4] depends on [Task 2] — API 路由需要 SandboxManager
- [Task 5] depends on [Task 3] — 前端依赖后端权限分级
- [Task 6] depends on [Task 1-5] — 配置和验证依赖所有功能完成

# 可并行的任务

- Task 1（权限分级）和 Task 2（沙箱核心）可以并行开发
- Task 4（API 路由）可与 Task 3（工具适配）并行
