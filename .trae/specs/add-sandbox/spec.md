# 沙箱功能 Spec

## Why

当前 Web 版的工具（BashTool、FileTools、SearchTools）直接在服务端进程内执行，没有任何隔离。这意味着 AI 执行的命令可以访问宿主机的完整文件系统和网络，存在安全风险。参考 Vercel Sandbox（基于 Firecracker microVM 的隔离执行环境），为工具执行添加沙箱模式，使 AI 的终端操作在隔离的 Linux VM 中运行，保护宿主机安全。

## What Changes

- 新增沙箱执行后端，集成 `@vercel/sandbox` SDK，支持在隔离 microVM 中执行 BashTool 和文件操作工具
- 新增沙箱管理器，管理沙箱生命周期（创建/停止/恢复/销毁）
- 修改工具执行层，支持两种执行模式：直接执行（默认，向后兼容）和沙箱执行
- 新增沙箱管理 API（/api/sandbox），支持沙箱的 CRUD 和状态查询
- 新增前端沙箱状态面板，显示当前沙箱状态、资源使用、操作按钮
- 新增沙箱配置项（环境变量控制启用/禁用、运行时选择、资源规格）
- **BREAKING**: 启用沙箱模式后，BashTool 和文件操作工具的执行环境从宿主机变为沙箱 VM，工作目录和可用软件包不同

## Impact

- Affected specs: 工具执行系统（BashTool、FileReadTool、FileWriteTool、FileEditTool、GlobTool、GrepTool）
- Affected code: src/lib/tools/bash.ts, src/lib/tools/file-tools.ts, src/lib/tools/search-tools.ts, src/lib/tools/registry.ts, src/lib/agent-stream.ts, src/app/api/tools/

## ADDED Requirements

### Requirement: 沙箱执行模式

系统 SHALL 支持沙箱执行模式，使 AI 工具在隔离的 Vercel Sandbox microVM 中运行，而非直接在宿主机上执行。

#### Scenario: 启用沙箱模式
- **WHEN** 管理员设置环境变量 `SANDBOX_ENABLED=true`
- **THEN** 所有 BashTool 和文件操作工具在 Vercel Sandbox 中执行
- **AND** 宿主机文件系统和进程不受影响

#### Scenario: 未启用沙箱模式（默认）
- **WHEN** 环境变量 `SANDBOX_ENABLED` 未设置或为 `false`
- **THEN** 工具直接在服务端进程内执行（当前行为，向后兼容）

#### Scenario: 沙箱不可用时降级
- **WHEN** 沙箱模式已启用但 Vercel Sandbox API 不可用（网络错误、认证失败等）
- **THEN** 系统返回错误信息，提示用户沙箱服务不可用
- **AND** 不降级为直接执行（安全优先，避免意外在宿主机执行）

### Requirement: 沙箱生命周期管理

系统 SHALL 管理沙箱的完整生命周期，支持创建、停止、恢复和销毁。

#### Scenario: 创建沙箱
- **WHEN** 用户在沙箱模式下发送第一条消息
- **THEN** 系统自动创建一个 Vercel Sandbox 实例
- **AND** 沙箱使用配置的运行时（默认 node24）和资源规格（默认 2 vCPU / 4GB 内存）
- **AND** 沙箱默认为持久化模式（停止时自动快照，恢复时还原）

#### Scenario: 会话关联沙箱
- **WHEN** 一个聊天会话处于活跃状态
- **THEN** 该会话关联一个沙箱实例，所有工具调用在同一沙箱中执行
- **AND** 沙箱的工作目录 `/vercel/sandbox` 作为工具的默认工作目录

#### Scenario: 停止和恢复沙箱
- **WHEN** 用户点击"停止沙箱"按钮
- **THEN** 沙箱停止运行，文件系统自动快照保存
- **WHEN** 用户点击"恢复沙箱"按钮
- **THEN** 沙箱从快照恢复，保留之前的文件和安装的软件包

#### Scenario: 销毁沙箱
- **WHEN** 用户点击"销毁沙箱"按钮或删除关联的聊天会话
- **THEN** 沙箱被永久删除，所有快照和数据清除

#### Scenario: 沙箱超时
- **WHEN** 沙箱运行超过配置的超时时间（默认 5 分钟，最大可配置到 45 分钟 Hobby / 5 小时 Pro）
- **THEN** 沙箱自动停止，文件系统快照保存

### Requirement: 沙箱内工具执行

系统 SHALL 将工具调用路由到沙箱内执行，而非宿主机。

#### Scenario: BashTool 在沙箱中执行
- **WHEN** 沙箱模式启用且 LLM 请求执行 BashTool
- **THEN** 命令通过 `sandbox.runCommand()` 在沙箱 VM 中执行
- **AND** 返回沙箱内的 stdout、stderr 和 exit code
- **AND** 命令在沙箱的 `/vercel/sandbox` 工作目录中执行

#### Scenario: FileReadTool 在沙箱中执行
- **WHEN** 沙箱模式启用且 LLM 请求读取文件
- **THEN** 通过 `sandbox.fs.readFile()` 读取沙箱内的文件
- **AND** 文件路径相对于沙箱的 `/vercel/sandbox` 目录

#### Scenario: FileWriteTool 在沙箱中执行
- **WHEN** 沙箱模式启用且 LLM 请求写入文件
- **THEN** 通过 `sandbox.fs.writeFile()` 写入沙箱内的文件
- **AND** 自动创建沙箱内所需的目录

#### Scenario: FileEditTool 在沙箱中执行
- **WHEN** 沙箱模式启用且 LLM 请求编辑文件
- **THEN** 先通过 `sandbox.fs.readFile()` 读取文件，在服务端计算 diff，再通过 `sandbox.fs.writeFile()` 写回

#### Scenario: GlobTool 在沙箱中执行
- **WHEN** 沙箱模式启用且 LLM 请求搜索文件
- **THEN** 通过 `sandbox.runCommand('find')` 或 `sandbox.runCommand('rg')` 在沙箱内搜索

#### Scenario: GrepTool 在沙箱中执行
- **WHEN** 沙箱模式启用且 LLM 请求搜索文件内容
- **THEN** 通过 `sandbox.runCommand('rg')` 在沙箱内搜索

#### Scenario: WebFetchTool 和 WebSearchTool 不受影响
- **WHEN** 沙箱模式启用且 LLM 请求 Web 操作
- **THEN** WebFetchTool 和 WebSearchTool 仍在服务端直接执行（无需沙箱隔离）

### Requirement: 沙箱管理 API

系统 SHALL 提供 REST API 管理沙箱。

#### Scenario: 获取沙箱状态
- **WHEN** 前端请求 `GET /api/sandbox?sessionId=xxx`
- **THEN** 返回沙箱状态（running/stopped/creating/error）、沙箱 ID、运行时、资源规格、创建时间

#### Scenario: 创建沙箱
- **WHEN** 前端请求 `POST /api/sandbox` 且 body 包含 `{ sessionId, runtime?, vCpus?, memory?, persistent? }`
- **THEN** 创建新的 Vercel Sandbox 并关联到指定会话
- **AND** 返回沙箱 ID 和状态

#### Scenario: 停止沙箱
- **WHEN** 前端请求 `POST /api/sandbox/[id]/stop`
- **THEN** 停止沙箱，自动保存快照

#### Scenario: 恢复沙箱
- **WHEN** 前端请求 `POST /api/sandbox/[id]/resume`
- **THEN** 从快照恢复沙箱

#### Scenario: 销毁沙箱
- **WHEN** 前端请求 `DELETE /api/sandbox/[id]`
- **THEN** 永久删除沙箱及其快照

### Requirement: 沙箱前端面板

系统 SHALL 在前端提供沙箱状态面板，显示当前沙箱信息和操作按钮。

#### Scenario: 沙箱状态显示
- **WHEN** 沙箱模式启用
- **THEN** 在聊天界面顶部或侧边栏显示沙箱状态指示器
- **AND** 显示：状态图标（running=绿色、stopped=灰色、creating=黄色）、沙箱 ID、运行时、已用时间

#### Scenario: 沙箱操作按钮
- **WHEN** 用户点击沙箱状态指示器
- **THEN** 展开沙箱面板，显示操作按钮：停止、恢复、销毁、新建
- **AND** 显示资源使用信息（vCPU、内存、磁盘）

#### Scenario: 沙箱未配置提示
- **WHEN** 沙箱模式未启用（SANDBOX_ENABLED != true）
- **THEN** 不显示沙箱面板，工具在宿主机直接执行（当前行为）

### Requirement: 沙箱配置

系统 SHALL 支持通过环境变量配置沙箱行为。

#### Scenario: 配置沙箱运行时
- **WHEN** 管理员设置 `SANDBOX_RUNTIME=node24`（可选值：node26, node24, node22, python3.13）
- **THEN** 新创建的沙箱使用指定运行时

#### Scenario: 配置沙箱资源
- **WHEN** 管理员设置 `SANDBOX_VCPUS=2` 和 `SANDBOX_MEMORY=4`
- **THEN** 新创建的沙箱使用指定资源规格

#### Scenario: 配置沙箱超时
- **WHEN** 管理员设置 `SANDBOX_TIMEOUT_MS=300000`（5 分钟）
- **THEN** 沙箱在无活动超过指定时间后自动停止

#### Scenario: 配置沙箱持久化
- **WHEN** 管理员设置 `SANDBOX_PERSISTENT=true`（默认）
- **THEN** 沙箱停止时自动快照，恢复时还原文件系统

#### Scenario: 配置沙箱认证
- **WHEN** 应用部署在 Vercel 上
- **THEN** 自动使用 Vercel OIDC token 认证（无需额外配置）
- **WHEN** 应用部署在非 Vercel 环境
- **THEN** 使用 `VERCEL_TOKEN` 环境变量提供的 access token 认证

### Requirement: 沙箱快照管理

系统 SHALL 支持沙箱快照的创建和恢复，用于跳过重复的环境初始化。

#### Scenario: 自动快照
- **WHEN** 持久化沙箱停止时
- **THEN** 系统自动创建快照保存文件系统状态

#### Scenario: 手动快照
- **WHEN** 用户请求创建快照 `POST /api/sandbox/[id]/snapshot`
- **THEN** 系统创建命名快照，可用于后续恢复

#### Scenario: 从快照创建沙箱
- **WHEN** 用户创建新沙箱时指定 `snapshotId`
- **THEN** 新沙箱从快照恢复，跳过环境初始化步骤

## MODIFIED Requirements

### Requirement: 工具执行

CLI 版本工具在本地进程内直接执行。Web 版 SHALL 支持两种执行模式：
1. **直接执行模式**（默认）：工具在服务端进程内执行，与当前行为一致
2. **沙箱执行模式**（SANDBOX_ENABLED=true）：工具在 Vercel Sandbox microVM 中执行，与宿主机完全隔离

工具注册表 SHALL 支持为每个工具指定执行环境（host 或 sandbox），BashTool 和文件操作工具标记为 `sandboxCapable: true`。

### Requirement: 工具确认流程

沙箱模式下，由于工具在隔离环境中执行，BashTool 的确认流程 SHALL 根据沙箱状态调整：
- 沙箱内执行时，风险等级自动降低（因为不影响宿主机）
- 但仍保留确认机制，防止沙箱内执行恶意网络请求等

## REMOVED Requirements

无移除的需求。沙箱功能是增量添加，完全向后兼容。
