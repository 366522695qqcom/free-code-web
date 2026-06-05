# Architecture

free-code 的架构概览，面向开发者。

## 启动流程

```
cli.tsx (入口)
  ├── 快速路径分发（12 个 feature-gated 路径）
  │   ├── --version/-v           → 零模块加载，直接输出
  │   ├── --dump-system-prompt   → 输出系统提示词并退出
  │   ├── --claude-in-chrome-mcp → Chrome 扩展 MCP 服务器
  │   ├── --chrome-native-host   → Chrome 原生消息主机
  │   ├── --computer-use-mcp     → Computer Use MCP 服务器 (CHICAGO_MCP)
  │   ├── --daemon-worker        → 守护进程工作器 (DAEMON)
  │   ├── remote-control/rc      → IDE 远程控制 (BRIDGE_MODE)
  │   ├── daemon                 → 长驻守护进程 (DAEMON)
  │   ├── ps/logs/attach/kill    → 后台会话管理 (BG_SESSIONS)
  │   ├── new/list/reply         → 模板任务 (TEMPLATES)
  │   ├── environment-runner     → BYOC 运行器 (BYOC_ENVIRONMENT_RUNNER)
  │   └── self-hosted-runner     → 自托管运行器 (SELF_HOSTED_RUNNER)
  │
  └── 无匹配 → main.tsx (完整 CLI 初始化)
        ├── 启动性能分析 (startupProfiler)
        ├── MDM 配置预读 (startMdmRawRead)
        ├── Keychain 预取 (startKeychainPrefetch)
        ├── Commander.js 解析命令行参数
        ├── 初始化配置/遥测/GrowthBook
        ├── 认证 (OAuth / API Key)
        ├── MCP 服务器初始化
        └── launchRepl() → REPL.tsx
```

## 核心数据流

```
用户输入
  ↓
REPL.tsx (Ink/React 终端 UI)
  ↓ processUserInput()
QueryEngine.ts (查询引擎)
  ├── 构建系统提示词 (systemPrompt + memory + context)
  ├── 调用 LLM API (Anthropic/OpenAI/Bedrock/Vertex/Foundry)
  ├── 处理工具调用 (tool use)
  │   ├── 权限检查 (CanUseToolFn)
  │   ├── 工具执行 (BashTool, FileEditTool, etc.)
  │   └── 结果返回
  ├── 成本追踪 (cost-tracker)
  └── 会话存储 (sessionStorage)
```

## 模块职责

### 入口与初始化

| 文件 | 职责 |
|------|------|
| `src/entrypoints/cli.tsx` | CLI 入口，快速路径分发 |
| `src/main.tsx` | 完整 CLI 初始化，Commander.js 命令定义 |
| `src/entrypoints/init.ts` | 配置、遥测、信任初始化 |
| `src/setup.ts` | 运行时环境设置 |

### 查询管道

| 文件 | 职责 |
|------|------|
| `src/QueryEngine.ts` | 核心查询引擎，协调消息流、工具使用、模型调用 |
| `src/query.ts` | 查询入口，API 调用封装 |
| `src/query/config.ts` | 查询配置 |
| `src/query/deps.ts` | 查询依赖 |
| `src/query/tokenBudget.ts` | Token 预算管理 |

### 命令系统

`src/commands.ts` 注册 40+ 斜杠命令，实现位于 `src/commands/`。

**核心命令**：add-dir, clear, commit, compact, config, context, cost, diff, doctor, help, init, login, logout, mcp, memory, resume, review, session, skills, status, tasks, teleport, theme

**Feature-gated 命令**：

| 命令 | 条件标志 |
|------|----------|
| proactive | KAIROS / PROACTIVE |
| brief | KAIROS / KAIROS_BRIEF |
| assistant | KAIROS |
| bridge | BRIDGE_MODE |
| remoteControlServer | DAEMON + BRIDGE_MODE |
| voice | VOICE_MODE |
| ultraplan | ULTRAPLAN |

### 工具系统

`src/tools.ts` 注册 25+ Agent 工具，实现位于 `src/tools/`。

**核心工具**：BashTool, FileEditTool, FileReadTool, FileWriteTool, GlobTool, GrepTool, WebFetchTool, WebSearchTool, AgentTool, SkillTool, TodoWriteTool, AskUserQuestionTool, LSPTool, EnterPlanModeTool, ExitPlanModeV2Tool

**Feature-gated 工具**：

| 工具 | 条件标志 |
|------|----------|
| CronCreateTool/CronDeleteTool/CronListTool | AGENT_TRIGGERS |
| RemoteTriggerTool | AGENT_TRIGGERS_REMOTE |
| SleepTool | PROACTIVE / KAIROS |
| MonitorTool | MONITOR_TOOL |
| PushNotificationTool | KAIROS / KAIROS_PUSH_NOTIFICATION |
| SubscribePRTool | KAIROS_GITHUB_WEBHOOKS |
| SendUserFileTool | KAIROS |

### REPL UI

`src/screens/REPL.tsx` — 基于 Ink/React 的终端交互界面：

- 消息渲染与虚拟滚动（VirtualMessageList）
- 用户输入处理（PromptInput）
- 工具确认对话框（PermissionRequest）
- 成本追踪显示
- MCP 弹窗（ElicitationDialog）
- 搜索高亮
- 快捷键处理

### Bridge 子系统（IDE 桥接）

`src/bridge/` — IDE 远程控制桥接，允许 VS Code/JetBrains 远程控制 CLI：

| 文件 | 职责 |
|------|------|
| `bridgeApi.ts` | 暴露给 IDE 的 API 接口 |
| `bridgeMessaging.ts` | 消息处理与传输 |
| `bridgeConfig.ts` | 桥接配置 |
| `bridgeEnabled.ts` | 桥接启用状态判断 |
| `bridgeStatusUtil.ts` | 状态查询与更新 |
| `replBridge.ts` | REPL 桥接实现 |
| `replBridgeHandle.ts` | 桥接实例管理 |
| `replBridgeTransport.ts` | 桥接传输层 |
| `initReplBridge.ts` | 桥接初始化 |
| `sessionRunner.ts` | 会话运行器 |
| `inboundMessages.ts` | 入站消息处理 |
| `inboundAttachments.ts` | 入站附件处理 |
| `jwtUtils.ts` | JWT 身份验证 |
| `flushGate.ts` | 消息刷新门控 |
| `pollConfig.ts` | 轮询配置 |

### 状态管理

`src/state/` — 应用状态中心：

| 文件 | 职责 |
|------|------|
| `AppState.tsx` | 核心状态接口定义（用户、团队、任务） |
| `AppStateStore.ts` | 状态存储实现（初始化、更新、监听） |
| `store.ts` | 全局状态管理实例 |
| `selectors.ts` | 状态选择器 |
| `onChangeAppState.ts` | 状态变更回调 |

### 任务系统

`src/tasks/` — 后台任务管理：

| 文件 | 职责 |
|------|------|
| `LocalMainSessionTask.ts` | 主会话任务实现 |
| `types.ts` | 任务类型定义 |
| `stopTask.ts` | 任务终止逻辑 |
| `pillLabel.ts` | 任务标签显示 |
| `InProcessTeammateTask/` | 进程内队友任务 |
| `LocalAgentTask/` | 本地 Agent 任务 |
| `LocalShellTask/` | 本地 Shell 任务 |
| `RemoteAgentTask/` | 远程 Agent 任务 |

### Skills/Plugins 系统

**Skills** (`src/skills/`)：

| 文件 | 职责 |
|------|------|
| `bundledSkills.ts` | 注册内置技能 |
| `loadSkillsDir.ts` | 从目录动态加载技能 |
| `mcpSkillBuilders.ts` | MCP 技能构建工具 |

**Plugins** (`src/plugins/`)：

| 文件 | 职责 |
|------|------|
| `builtinPlugins.ts` | 注册内置插件 |

### 关键 Hooks

`src/hooks/` 包含 100+ React hooks，以下是核心 hooks：

| Hook | 职责 |
|------|------|
| `useMainLoopModel` | 主循环模型交互 |
| `useSettings` / `useSettingsChange` | 设置管理 |
| `useMergedTools` | 工具集合合并 |
| `useMergedCommands` | 命令集合合并 |
| `useCanUseTool` | 工具使用权限检查 |
| `useCommandQueue` | 命令队列管理 |
| `useReplBridge` | REPL 桥接 |
| `useTextInput` | 文本输入处理 |
| `useScheduledTasks` | 调度任务管理 |
| `useTaskListWatcher` | 任务列表监听 |
| `useDirectConnect` | 直连会话 |
| `useSSHSession` | SSH 会话 |
| `useRemoteSession` | 远程会话 |
| `useGlobalKeybindings` | 全局快捷键 |
| `useVoice` | 语音输入 |

## 特性标志系统

特性标志通过 `bun:bundle` 的 `feature()` 函数实现编译时死代码消除。

### 工作原理

1. 构建时通过 `--feature=FLAG` 参数设置标志
2. `feature('FLAG')` 在编译时被替换为 `true` 或 `false`
3. `false` 分支的代码被 Bun 编译器完全消除

### 标志分类

| 分类 | 数量 | 说明 |
|------|------|------|
| 用户交互与 UI | 14 | ULTRAPLAN, ULTRATHINK, VOICE_MODE 等 |
| Agent/记忆/规划 | 10 | AGENT_TRIGGERS, EXTRACT_MEMORIES 等 |
| 工具/权限/远程 | 14 | BRIDGE_MODE, BASH_CLASSIFIER 等 |
| 支持性标志 | 16 | 遥测、平台检测、调试等 |
| 运行时注意事项 | 6 | 需要特定运行时依赖 |
| 构建失败 - 易修复 | 16 | 缺少单个文件/资产 |
| 构建失败 - 中等差距 | 15 | 缺少子系统部分 |
| 构建失败 - 大型缺失 | 3 | 缺少完整子系统 |

## 模型提供商

| 提供商 | 环境变量 | 认证方式 | 模型映射 |
|--------|----------|----------|----------|
| Anthropic (默认) | — | API Key / OAuth | claude-opus-4-6, claude-sonnet-4-6 等 |
| OpenAI Codex | CLAUDE_CODE_USE_OPENAI=1 | OpenAI OAuth | gpt-5.3-codex, gpt-5.4 等 |
| AWS Bedrock | CLAUDE_CODE_USE_BEDROCK=1 | AWS 凭证 | us.anthropic.claude-opus-4-6-v1 |
| Google Vertex AI | CLAUDE_CODE_USE_VERTEX=1 | gcloud ADC | claude-opus-4-6@latest |
| Anthropic Foundry | CLAUDE_CODE_USE_FOUNDRY=1 | API Key | 自定义部署 ID |

## 目录结构

```
src/
├── entrypoints/       # CLI 入口
├── screens/           # 屏幕组件 (REPL, Doctor)
├── components/        # UI 组件 (120+)
├── hooks/             # React hooks (100+)
├── commands/          # 斜杠命令实现 (40+)
├── tools/             # Agent 工具实现 (25+)
├── bridge/            # IDE 桥接 (20 文件)
├── state/             # 状态管理
├── tasks/             # 后台任务
├── skills/            # 技能系统
├── plugins/           # 插件系统
├── services/          # API 客户端、OAuth、MCP
├── constants/         # 常量定义
├── keybindings/       # 快捷键系统
├── ink/               # Ink 框架定制
├── migrations/        # 数据迁移
├── coordinator/       # 协调器模式
├── outputStyles/      # 输出样式
├── query/             # 查询配置
├── remote/            # 远程会话
├── voice/             # 语音输入
├── utils/             # 工具函数 (200+)
├── types/             # 类型定义
├── QueryEngine.ts     # 查询引擎
├── main.tsx           # 主入口
├── commands.ts        # 命令注册
├── tools.ts           # 工具注册
└── query.ts           # 查询入口
```
