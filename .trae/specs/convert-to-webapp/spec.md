# free-code Web 应用改造 Spec

## Why

free-code 当前是纯 CLI 应用（Bun + Ink/React 终端 UI），无法在浏览器中使用。将其改造为可部署到 Vercel 的全栈 Web 应用，可以让用户无需安装 Bun 即可通过浏览器使用 Claude Code 的核心功能。

## What Changes

- 新增 Next.js 前端项目，复用现有 React 组件逻辑，将 Ink 终端 UI 替换为浏览器 UI
- 新增 Next.js API Routes 后端，封装 LLM API 调用、工具执行、会话管理等
- 将 QueryEngine 核心逻辑适配为服务端流式 API
- 将 120+ 终端 UI 组件替换/改造为 Web UI 组件
- 将文件系统操作（BashTool、FileEditTool 等）迁移到服务端执行
- 新增 WebSocket/SSE 流式通信层
- 新增用户认证系统（基于现有 OAuth 逻辑）
- **BREAKING**: 终端专属功能（Vim 模式、终端快捷键、原生音频）在 Web 版中不可用

## Impact

- Affected specs: REPL 交互循环、工具执行系统、权限系统、会话管理、MCP 集成
- Affected code: src/screens/REPL.tsx, src/QueryEngine.ts, src/commands.ts, src/tools.ts, src/components/, src/hooks/, src/services/, src/utils/api.ts, src/utils/auth.ts

## 困难与风险

### 困难 1: Ink → Web UI 的全面重写（工作量最大）

Ink 是终端渲染框架，使用 `<Box>`, `<Text>` 等 Ink 专有组件，与浏览器 DOM 完全不兼容。120+ 组件全部需要重写。Ink 的 `useInput`、`useStdin`、`useFocus` 等 hooks 也无法在浏览器中使用。

**影响范围**: src/components/ (120+ 文件), src/screens/, src/hooks/ (100+ 文件)
**难度**: 高 — 不是简单移植，而是基于相同业务逻辑的全新实现

### 困难 2: 工具执行需要服务端沙箱

BashTool、FileEditTool、FileReadTool、FileWriteTool 等工具直接操作文件系统和 shell，在浏览器中无法执行。必须在服务端提供沙箱环境执行这些操作，并通过 API 通信。

**影响范围**: src/tools/BashTool/, src/tools/FileEditTool/, src/tools/FileReadTool/, src/tools/FileWriteTool/, src/tools/GlobTool/, src/tools/GrepTool/
**难度**: 高 — 需要设计安全的服务端沙箱（Docker/gVisor），防止任意代码执行风险

### 困难 3: 流式响应与长时间运行的工具调用

QueryEngine 的查询循环是同步阻塞式的：发送消息 → 等待 LLM 响应 → 执行工具 → 再发送。Web 版需要将这个循环拆分为异步流式 API，支持 SSE/WebSocket 推送中间状态。

**影响范围**: src/QueryEngine.ts, src/query.ts
**难度**: 中高 — 核心循环需要重新设计为事件驱动模式

### 困难 4: 会话持久化与状态同步

当前会话状态存储在本地文件系统（sessionStorage.ts），Web 版需要使用数据库（如 Vercel KV/Postgres）存储会话，并处理多标签页/多设备同步。

**影响范围**: src/utils/sessionStorage.ts, src/utils/sessionState.ts, src/state/
**难度**: 中 — 架构变化但逻辑可复用

### 困难 5: MCP 服务器集成

MCP 服务器当前在本地进程内运行（stdio/SSE transport），Web 版需要将 MCP 服务器移到服务端或通过代理连接。

**影响范围**: src/services/mcp/, src/tools/ListMcpResourcesTool/, src/tools/ReadMcpResourceTool/
**难度**: 中 — 需要重新设计 MCP 连接架构

### 困难 6: 认证与安全

Web 版暴露在公网，需要：用户认证、API Key 安全存储（不能暴露到前端）、CSRF 防护、速率限制等。当前 CLI 的认证逻辑（本地 API Key / OAuth）需要全面改造。

**影响范围**: src/utils/auth.ts, src/utils/authPortable.ts, src/bridge/jwtUtils.ts
**难度**: 中 — 可复用 OAuth 逻辑，但需要增加 Web 安全层

### 困难 7: 特性标志系统适配

88 个编译时特性标志（`bun:bundle` 的 `feature()`）在 Next.js 中不可用。需要替换为运行时特性开关（如环境变量 + Next.js public runtime config）。

**影响范围**: 几乎所有文件都使用 feature() 检查
**难度**: 中 — 需要全局替换，但逻辑简单

### 困难 8: 终端专属功能无法移植

以下功能依赖终端环境，在 Web 版中无法直接实现：
- Vim 输入模式 (VimTextInput.tsx)
- 终端快捷键系统 (keybindings/)
- 原生音频捕获 (VOICE_MODE)
- 原生剪贴板图片 (NATIVE_CLIPBOARD_IMAGE)
- 终端主题检测 (systemTheme.ts)
- tmux/worktree 集成

**难度**: 低 — 这些功能在 Web 版中降级或替代即可

## ADDED Requirements

### Requirement: Web 前端应用

系统 SHALL 提供基于 Next.js 的 Web 前端应用，复现 CLI 版本的核心 UI 布局和交互体验。

#### Scenario: 用户访问 Web 应用
- **WHEN** 用户在浏览器中打开应用 URL
- **THEN** 显示聊天界面，包含消息列表、输入框和工具状态显示

#### Scenario: 用户发送消息
- **WHEN** 用户在输入框中输入消息并提交
- **THEN** 消息发送到后端 API，LLM 响应通过 SSE 流式返回并实时显示

#### Scenario: 工具执行确认
- **WHEN** LLM 请求执行需要确认的工具（如 BashTool）
- **THEN** 前端显示权限确认对话框，用户批准后工具在服务端执行

### Requirement: 后端 API 服务

系统 SHALL 提供 Next.js API Routes 后端，封装 LLM API 调用和工具执行。

#### Scenario: 流式聊天 API
- **WHEN** 前端发送聊天请求
- **THEN** 后端调用 LLM API，通过 SSE 流式返回响应内容（包括思考过程、工具调用、文本回复）

#### Scenario: 工具执行 API
- **WHEN** LLM 请求执行工具
- **THEN** 后端在沙箱环境中执行工具，返回执行结果

### Requirement: 会话管理

系统 SHALL 支持会话的创建、恢复和持久化。

#### Scenario: 创建新会话
- **WHEN** 用户点击"新建会话"
- **THEN** 创建新的聊天会话，清空消息历史

#### Scenario: 恢复历史会话
- **WHEN** 用户从会话列表选择历史会话
- **THEN** 加载该会话的完整消息历史并显示

### Requirement: 用户认证

系统 SHALL 提供用户认证功能，保护 API Key 不暴露到前端。

#### Scenario: API Key 登录
- **WHEN** 用户输入 API Key
- **THEN** Key 存储在服务端加密存储中，前端仅持有会话 token

#### Scenario: OAuth 登录
- **WHEN** 用户通过 OAuth 登录
- **THEN** 认证 token 存储在服务端，前端通过 httpOnly cookie 维持会话

### Requirement: Vercel 部署

系统 SHALL 可部署到 Vercel 平台。

#### Scenario: 一键部署
- **WHEN** 用户将代码推送到 GitHub 仓库并连接 Vercel
- **THEN** 应用自动构建和部署，无需额外配置

### Requirement: 运行时特性开关

系统 SHALL 使用运行时特性开关替代编译时 feature() 标志。

#### Scenario: 启用实验特性
- **WHEN** 管理员通过环境变量启用某个特性
- **THEN** 对应功能在前端和后端同时生效，无需重新构建

## MODIFIED Requirements

### Requirement: 消息渲染

CLI 版本使用 Ink `<Text>` 组件渲染 ANSI 彩色文本。Web 版 SHALL 使用 HTML/CSS 渲染 Markdown 和代码高亮，保留消息类型（用户消息、助手回复、工具调用、思考过程等）的视觉区分。

### Requirement: 工具执行

CLI 版本工具在本地进程内直接执行。Web 版 SHALL 通过服务端 API 执行工具，前端仅显示执行状态和结果。BashTool 等文件系统工具 MUST 在服务端沙箱中执行。

### Requirement: 权限系统

CLI 版本权限通过终端内联对话框处理。Web 版 SHALL 通过 Web 弹窗处理权限请求，支持批准/拒绝/始终允许等操作。

## REMOVED Requirements

### Requirement: Vim 输入模式
**Reason**: 浏览器无法捕获 Vim 模式所需的按键组合
**Migration**: 使用标准 Web 文本编辑器（如 CodeMirror/Monaco）

### Requirement: 终端快捷键系统
**Reason**: 终端快捷键（如 Ctrl+K, Esc 等）在浏览器中有不同行为
**Migration**: 使用 Web 标准快捷键方案

### Requirement: 原生音频捕获
**Reason**: 浏览器使用 Web Audio API，与原生音频模块不兼容
**Migration**: 使用浏览器原生 MediaRecorder API（未来可实现）

### Requirement: tmux/worktree 集成
**Reason**: 依赖终端多路复用器
**Migration**: Web 版使用标签页/分屏 UI 替代

### Requirement: IDE Bridge 模式
**Reason**: Bridge 模式用于 IDE 集成，Web 版本身就是 IDE 替代
**Migration**: 不需要，Web 版直接提供编辑功能
