# Findings: free-code 项目分析发现

## 项目定位

free-code 是 Anthropic Claude Code CLI 的自由构建版本，基于 2026-03-31 通过 npm 分发包 source map 暴露的源码快照重建。

三大改动：
1. **遥测移除** — OpenTelemetry/gRPC、GrowthBook 分析、Sentry 错误报告、自定义事件日志全部死代码消除或桩化
2. **安全提示限制移除** — 硬编码拒绝模式、cyber risk 指令块、托管设置安全覆盖层全部剥离
3. **实验特性解锁** — 88 个特性标志中 54 个编译通过并启用

## 技术栈

| 层级 | 技术 |
|------|------|
| 运行时 | Bun >= 1.3.11 |
| 语言 | TypeScript |
| 终端 UI | React 19 + Ink 6 |
| CLI 解析 | Commander.js |
| Schema 校验 | Zod v4 |
| 代码搜索 | ripgrep (bundled) |
| 协议 | MCP, LSP |
| API | Anthropic Messages, OpenAI Codex, AWS Bedrock, Google Vertex AI |

## 核心架构

### 启动流程

1. `src/entrypoints/cli.tsx` — CLI 入口，处理快速路径（--version、--dump-system-prompt、--claude-in-chrome-mcp、--computer-use-mcp、remote-control、daemon、bg sessions、templates、environment-runner、self-hosted-runner、tmux worktree）
2. 无特殊标志时，动态加载 `src/main.tsx` — 完整 CLI 初始化
3. `src/main.tsx` — 使用 Commander.js 解析命令行参数，初始化配置/遥测/GrowthBook/OAuth/MCP，最终调用 `launchRepl()` 启动交互式 UI
4. `src/screens/REPL.tsx` — 主交互式 REPL UI（Ink/React），处理消息渲染、用户输入、工具确认、成本追踪等

### 入口快速路径（feature-gated）

| 路径 | 条件标志 | 说明 |
|------|----------|------|
| --version/-v | 无 | 零模块加载 |
| --dump-system-prompt | DUMP_SYSTEM_PROMPT | 输出系统提示词并退出 |
| --claude-in-chrome-mcp | 无 | Chrome 扩展 MCP 服务器 |
| --chrome-native-host | 无 | Chrome 原生消息主机 |
| --computer-use-mcp | CHICAGO_MCP | Computer Use MCP 服务器 |
| --daemon-worker | DAEMON | 守护进程工作器 |
| remote-control/rc/remote/sync/bridge | BRIDGE_MODE | IDE 远程控制桥接 |
| daemon | DAEMON | 长驻守护进程 |
| ps/logs/attach/kill/--bg | BG_SESSIONS | 后台会话管理 |
| new/list/reply | TEMPLATES | 模板任务 |
| environment-runner | BYOC_ENVIRONMENT_RUNNER | BYOC 运行器 |
| self-hosted-runner | SELF_HOSTED_RUNNER | 自托管运行器 |

### 命令/工具注册

**命令注册** (`src/commands.ts`):
- 40+ 个斜杠命令：add-dir, autofix-pr, backfill-sessions, btw, good-claude, issue, feedback, clear, color, commit, copy, desktop, commit-push-pr, compact, config, context, cost, diff, ctx_viz, doctor, memory, help, ide, init, init-verifiers, keybindings, login, logout, install-github-app, install-slack-app, break-cache, mcp, mobile, onboarding, pr_comments, release-notes, rename, resume, review, session, share, skills, status, tasks, teleport, security-review, bughunter, terminalSetup, usage, theme, vim
- Feature-gated 命令：proactive (KAIROS/PROACTIVE), brief (KAIROS/KAIROS_BRIEF), assistant (KAIROS), bridge (BRIDGE_MODE), remoteControlServer (DAEMON+BRIDGE_MODE), voice (VOICE_MODE), ultraplan (ULTRAPLAN), agents-platform (ant-only)

**工具注册** (`src/tools.ts`):
- 核心 Agent 工具：AgentTool, SkillTool, BashTool, FileEditTool, FileReadTool, FileWriteTool, GlobTool, NotebookEditTool, WebFetchTool, TaskStopTool, BriefTool, TaskOutputTool, WebSearchTool, TodoWriteTool, ExitPlanModeV2Tool, TestingPermissionTool, GrepTool, TungstenTool, AskUserQuestionTool, LSPTool, ListMcpResourcesTool, ReadMcpResourceTool, ToolSearchTool, EnterPlanModeTool, EnterWorktreeTool, ExitWorktreeTool
- Feature-gated 工具：REPLTool/SuggestBackgroundPRTool (ant-only), SleepTool (PROACTIVE/KAIROS), CronTools (AGENT_TRIGGERS), RemoteTriggerTool (AGENT_TRIGGERS_REMOTE), MonitorTool (MONITOR_TOOL), SendUserFileTool/PushNotificationTool (KAIROS), SubscribePRTool (KAIROS_GITHUB_WEBHOOKS), TeamCreateTool/TeamDeleteTool/SendMessageTool (lazy require 避免循环依赖)

### LLM 查询管道

`src/QueryEngine.ts` — 核心查询引擎，协调：
- 消息流管理（用户消息 → 模型调用 → 工具使用 → 结果处理）
- 成本追踪（accumulateUsage, updateUsage, getTotalCost）
- 系统提示词构建（fetchSystemPromptParts, buildSystemPrompt）
- 思考模式配置（ThinkingConfig, shouldEnableThinkingByDefault）
- 文件历史快照（fileHistoryMakeSnapshot）
- 会话存储（flushSessionStorage, recordTranscript）
- 权限管理（CanUseToolFn）
- 记忆加载（loadMemoryPrompt）

### REPL UI (`src/screens/REPL.tsx`)

- 基于 Ink/React 的终端 UI
- 处理：消息渲染、用户输入、工具确认、成本追踪、权限请求、MCP 弹窗、快捷键、搜索高亮、虚拟滚动
- 集成：IDE 桥接、远程会话、SSH 会话、语音模式、技能改进调查

### 核心子系统

| 子系统 | 路径 | 职责 |
|--------|------|------|
| Bridge | src/bridge/ | IDE 远程控制桥接（VS Code, JetBrains） |
| Skills | src/skills/ | 技能系统 |
| Plugins | src/plugins/ | 插件系统 |
| State | src/state/ | 应用状态管理 |
| Hooks | src/hooks/ | React hooks |
| Tasks | src/tasks/ | 后台任务管理 |
| Voice | src/voice/ | 语音输入 |
| Remote | src/remote/ | 远程会话管理 |
| Services | src/services/ | API 客户端、OAuth、MCP、分析桩 |
| Components | src/components/ | 终端 UI 组件（Ink） |
| Commands | src/commands/ | 斜杠命令实现 |
| Tools | src/tools/ | Agent 工具实现 |
| Constants | src/constants/ | 常量定义 |
| Migrations | src/migrations/ | 数据迁移 |
| Keybindings | src/keybindings/ | 快捷键系统 |
| Ink | src/ink/ | Ink 框架定制/扩展 |
| Coordinator | src/coordinator/ | 协调器模式 |
| Output Styles | src/outputStyles/ | 输出样式加载 |
| Query | src/query/ | 查询配置与依赖 |

## 构建系统

- `scripts/build.ts` — 构建脚本 + 特性标志打包器
- 使用 `bun build --compile` 生成独立可执行文件
- 特性标志通过 `--feature=FLAG` 或 `--feature-set=dev-full` 设置
- 外部化包：`@ant/*`, `audio-capture-napi`, `image-processor-napi`, `modifiers-napi`, `url-handler-napi`
- 编译时定义：`process.env.USER_TYPE='external'`, `MACRO.VERSION`, `MACRO.BUILD_TIME` 等
- 开发版额外定义：`NODE_ENV=development`, `CLAUDE_CODE_EXPERIMENTAL_BUILD=true`
- 输出文件自动设置可执行权限 (chmod 0o755)

### 构建变体

| 命令 | 输出 | 特性 | 说明 |
|------|------|------|------|
| `bun run build` | ./cli | VOICE_MODE only | 生产版 |
| `bun run build:dev` | ./cli-dev | VOICE_MODE only | 开发版 |
| `bun run build:dev:full` | ./cli-dev | 全部 54 个实验标志 | 完整解锁版 |
| `bun run compile` | ./dist/cli | VOICE_MODE only | 替代输出路径 |

## 模型提供商

| 提供商 | 环境变量 | 认证方式 |
|--------|----------|----------|
| Anthropic (默认) | — | ANTHROPIC_API_KEY 或 OAuth |
| OpenAI Codex | CLAUDE_CODE_USE_OPENAI=1 | OpenAI OAuth |
| AWS Bedrock | CLAUDE_CODE_USE_BEDROCK=1 | AWS 凭证 |
| Google Vertex AI | CLAUDE_CODE_USE_VERTEX=1 | gcloud ADC |
| Anthropic Foundry | CLAUDE_CODE_USE_FOUNDRY=1 | ANTHROPIC_FOUNDRY_API_KEY |

## 特性标志系统

- 总计 88 个 `feature('FLAG')` 编译时标志
- 54 个可正常构建
- 34 个构建失败（分为：易重建 16 个、中等差距 15 个、大型缺失子系统 3 个）

### 关键实验特性

- **ULTRAPLAN** — 远程多 Agent 规划（Opus 级别）
- **ULTRATHINK** — 深度思考模式
- **VOICE_MODE** — 语音输入/听写
- **BRIDGE_MODE** — IDE 远程控制桥接
- **AGENT_TRIGGERS** — 本地 cron/触发器工具
- **BUILTIN_EXPLORE_PLAN_AGENTS** — 内置探索/规划 Agent 预设
- **VERIFICATION_AGENT** — 验证 Agent
- **EXTRACT_MEMORIES** — 查询后自动记忆提取

## 项目规模估算

- src/ 下约 30+ 个子目录
- components/ 约 120+ 个 React 组件
- hooks/ 约 100+ 个 React hooks
- utils/ 约 200+ 个工具模块
- 总文件数 500+ TypeScript/TSX 文件
