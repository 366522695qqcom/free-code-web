# CLI 源文件清单（free-code）

> `src/` 是 Claude Code CLI 全部源码，基于 Bun + React/Ink。
> 顶层 `package.json` 由 `bun run build` 编译为 `./cli`。
> 统计：37 个子目录，~730 个文件，关键单文件最大 4684 行（`main.tsx`）。

## 顶层文件（src/）

| 文件 | 行数 | 职责 |
|---|---|---|
| [QueryEngine.ts](file:///workspace/src/QueryEngine.ts) | 1295 | **核心查询引擎** — 消息流、工具使用、模型调用编排 |
| [main.tsx](file:///workspace/src/main.tsx) | 4684 | **CLI 主入口** — 性能分析、MDM 预读、Keychain、Commander.js、认证、MCP、launchRepl() |
| [query.ts](file:///workspace/src/query.ts) | 1729 | 查询入口，API 调用封装 |
| [commands.ts](file:///workspace/src/commands.ts) | 754 | **斜杠命令注册表**（40+ 命令） |
| [tools.ts](file:///workspace/src/tools.ts) | 389 | **工具注册表**（25+ Agent 工具） |
| [Task.ts](file:///workspace/src/Task.ts) | — | 任务抽象接口 |
| [Tool.ts](file:///workspace/src/Tool.ts) | — | 工具抽象接口 |
| [context.ts](file:///workspace/src/context.ts) | — | 上下文管理 |
| [cost-tracker.ts](file:///workspace/src/cost-tracker.ts) | — | Token/费用追踪 |
| [costHook.ts](file:///workspace/src/costHook.ts) | — | 成本事件 hook |
| [dialogLaunchers.tsx](file:///workspace/src/dialogLaunchers.tsx) | — | 弹窗启动器 |
| [history.ts](file:///workspace/src/history.ts) | — | 会话历史 |
| [ink.ts](file:///workspace/src/ink.ts) | — | Ink 框架再导出 |
| [interactiveHelpers.tsx](file:///workspace/src/interactiveHelpers.tsx) | — | 交互辅助函数 |
| [projectOnboardingState.ts](file:///workspace/src/projectOnboardingState.ts) | — | 项目引导状态 |
| [replLauncher.tsx](file:///workspace/src/replLauncher.tsx) | — | REPL 启动器 |
| [setup.ts](file:///workspace/src/setup.ts) | — | 运行时环境设置 |
| [tasks.ts](file:///workspace/src/tasks.ts) | — | 任务管理入口 |

## 子目录（按文件数降序）

### utils/ — 300 文件 ⭐
通用工具集（最大目录）。涵盖 git、shell、http、auth、file、markdown、tokens、cron、session、theme、terminal、telemetry 等。
- 关键：api.ts、auth.ts、git.ts、shellConfig.ts、stream.ts、tokens.ts、sessionStorage.ts、cron.ts、theme.ts、systemPrompt.ts、claudemd.ts、claudeCodeHints.ts、classifierApprovals.ts、codex-fetch-adapter.ts

### components/ — 115 文件 ⭐
Ink/React 终端 UI 组件（弹窗、消息块、状态指示器等）。
- 关键：App.tsx、Messages.tsx、Message.tsx、MessageRow.tsx、MessageResponse.tsx、VirtualMessageList.tsx、ModelPicker.tsx、PermissionRequest、StatusLine.tsx、StatusNotices.tsx、SentryErrorBoundary、DevBar、DiagnosticsDisplay、TextInput.tsx、VimTextInput.tsx

### hooks/ — 83 文件 ⭐
React 自定义 hooks（100+），按需引入。
- 关键：useMainLoopModel、useSettings、useSettingsChange、useMergedTools、useMergedCommands、useCanUseTool、useCommandQueue、useReplBridge、useTextInput、useScheduledTasks、useTaskListWatcher、useDirectConnect、useSSHSession、useRemoteSession、useGlobalKeybindings、useVoice

### ink/ — 45 文件
定制版 Ink 框架（DOM 渲染、reconciler、文本测量、终端焦点、键盘解析）。
- 关键：ink.tsx、renderer.ts、reconciler.ts、output.ts、terminal.ts、termio.ts、focus.ts、parse-keypress.ts、Ansi.tsx、colorize.ts、searchHighlight.ts、selection.ts

### bridge/ — 31 文件 ⭐
IDE 远程控制桥接（VS Code/JetBrains，`BRIDGE_MODE` 启用）。
- 关键：bridgeApi.ts、bridgeMessaging.ts、bridgeConfig.ts、bridgeEnabled.ts、replBridge.ts、replBridgeHandle.ts、replBridgeTransport.ts、initReplBridge.ts、sessionRunner.ts、inboundMessages.ts、inboundAttachments.ts、jwtUtils.ts、flushGate.ts、pollConfig.ts、capacityWake.ts

### constants/ — 22 文件
常量定义。
- 关键：prompts.ts、systemPromptSections.ts、tools.ts、keys.ts、messages.ts、oauth.ts、codex-oauth.ts、cyberRiskInstruction.ts、betas.ts、outputStyles.ts、apiLimits.ts、toolLimits.ts

### services/ — 16 文件
API 客户端、OAuth、MCP、遥测 stub、语音服务。
- 关键：voice.ts、voiceStreamSTT.ts、voiceKeyterms.ts、claudeAiLimits.ts、claudeAiLimitsHook.ts、mcpServerApproval.tsx、notifier.ts、preventSleep.ts、rateLimitMessages.ts、tokenEstimation.ts、awaySummary.ts、internalLogging.ts

### commands/ — 15 文件 ⭐
`/clear`、`/commit`、`/init`、`/review` 等斜杠命令实现。
- 关键：advisor.ts、bridge-kick.ts、brief.ts、commit.ts、commit-push-pr.ts、init.ts、init-verifiers.ts、install.tsx、insights.ts、review.ts、security-review.ts、statusline.tsx、ultraplan.tsx、version.ts、createMovedToPluginCommand.ts

### keybindings/ — 14 文件
快捷键系统（解析、匹配、解析、校验、模板）。
- 关键：KeybindingContext.tsx、KeybindingProviderSetup.tsx、defaultBindings.ts、parser.ts、resolver.ts、schema.ts、match.ts、validate.ts、useKeybinding.ts、loadUserBindings.ts

### migrations/ — 11 文件
数据/配置迁移（设置项、模型版本）。
- 关键：migrateFennecToOpus.ts、migrateLegacyOpusToCurrent.ts、migrateOpusToOpus1m.ts、migrateSonnet45ToSonnet46.ts、migrateAutoUpdatesToSettings.ts、migrateBypassPermissionsAcceptedToSettings.ts、migrateEnableAllProjectMcpServersToSettings.ts、migrateReplBridgeEnabledToRemoteControlAtStartup.ts

### context/ — 9 文件
React Context（modal、overlay、mailbox、voice、stats、notifications、fps）。
- 关键：modalContext.tsx、overlayContext.tsx、promptOverlayContext.tsx、notifications.tsx、mailbox.tsx、voice.tsx、stats.tsx、QueuedMessageContext.tsx、fpsMetrics.tsx

### types/ — 8 文件
TypeScript 类型定义。
- 关键：command.ts、permissions.ts、plugin.ts、textInputTypes.ts、ids.ts、logs.ts、hooks.ts、connectorText.ts

### memdir/ — 8 文件 ⭐
Agent 记忆/上下文目录管理（CLAUDE.md、团队记忆）。
- 关键：memdir.ts、findRelevantMemories.ts、memoryScan.ts、memoryAge.ts、memoryTypes.ts、paths.ts、teamMemPaths.ts、teamMemPrompts.ts

### buddy/ — 6 文件
伴随精灵（CompanionSprite）— UI 装饰性动画。
- 关键：companion.ts、CompanionSprite.tsx、sprites.ts、prompt.ts、types.ts、useBuddyNotification.tsx

### state/ — 6 文件 ⭐
应用状态中心（用户、团队、任务）。
- 关键：AppState.tsx、AppStateStore.ts、store.ts、selectors.ts、onChangeAppState.ts、teammateViewHelpers.ts

### cli/ — 6 文件 ⭐
CLI 协议/传输层（SDK、Agent 协议、批量上传）。
- 子目录：
  - `cli/handlers/` — 6 文件：agents、auth、autoMode、mcp、plugins、util
  - `cli/transports/` — 8 文件：HybridTransport、SSETransport、WebSocketTransport、WorkerStateUploader、SerialBatchEventUploader、ccrClient、transportUtils
- 顶层：exit.ts、ndjsonSafeStringify.ts、print.ts、remoteIO.ts、structuredIO.ts、update.ts

### entrypoints/ — 5 文件 ⭐
CLI 入口与 SDK schema（注意：实际入口是 `entrypoints/cli.tsx`，不是 `main.tsx` 之前的描述）。
- 关键：cli.tsx（**主入口**）、init.ts、mcp.ts、agentSdkTypes.ts、sandboxTypes.ts
- 子目录 `entrypoints/sdk/` — 6 文件：controlSchemas、coreSchemas、coreTypes、coreTypes.generated、runtimeTypes、toolTypes

### vim/ — 5 文件
Vim 输入模式（motions、operators、text objects、transitions）。
- 关键：motions.ts、operators.ts、textObjects.ts、transitions.ts、types.ts

### tasks/ — 4 文件
后台任务管理。
- 关键：LocalMainSessionTask.ts、types.ts、stopTask.ts、pillLabel.ts

### remote/ — 4 文件
远程会话（WebSocket、SDK 消息适配）。
- 关键：RemoteSessionManager.ts、SessionsWebSocket.ts、remotePermissionBridge.ts、sdkMessageAdapter.ts

### query/ — 4 文件
查询配置/依赖/token 预算。
- 关键：config.ts、deps.ts、stopHooks.ts、tokenBudget.ts

### skills/ — 3 文件 ⭐
技能系统（bundled 技能、目录加载、MCP 构建器）。
- 关键：bundledSkills.ts、loadSkillsDir.ts、mcpSkillBuilders.ts
- 子目录 `skills/bundled/` — 17 个内置技能：batch、claudeApi、claudeInChrome、debug、loop、remember、simplify、skillify、stuck、updateConfig、verify、verifyContent、scheduleRemoteAgents、loremIpsum、keybindings、index

### server/ — 3 文件
直连会话服务（Direct Connect）。
- 关键：createDirectConnectSession.ts、directConnectManager.ts、types.ts

### screens/ — 3 文件 ⭐
屏幕级 UI（REPL、Doctor、Resume）。
- 关键：[REPL.tsx](file:///workspace/src/screens/REPL.tsx)（**主交互界面**）、Doctor.tsx、ResumeConversation.tsx

### assistant/ — 2 文件
Assistant 会话选择/历史。
- 关键：AssistantSessionChooser.tsx、sessionHistory.ts

### upstreamproxy/ — 2 文件
上游代理（relay、proxy）。
- 关键：relay.ts、upstreamproxy.ts

### voice/ — 1 文件
语音模式启用判断。
- 关键：voiceModeEnabled.ts

### tools/ — 1 文件
工具公共工具函数。
- 关键：utils.ts

### schemas/ — 1 文件
JSON Schema 定义（hooks）。
- 关键：hooks.ts

### plugins/ — 1 文件
插件系统。
- 关键：builtinPlugins.ts

### outputStyles/ — 1 文件
输出样式加载。
- 关键：loadOutputStylesDir.ts

### moreright/ — 1 文件
右滚动辅助。
- 关键：useMoreRight.tsx

### coordinator/ — 1 文件
协调器模式。
- 关键：coordinatorMode.ts

### bootstrap/ — 1 文件
启动状态。
- 关键：state.ts

### vendor/ — 0 文件（仅资源）
预打包的 ripgrep 二进制（`vendor/ripgrep/x64-linux/rg`）。

### native-ts/ — 0 文件
原生 TS 绑定声明（color-diff、file-index、yoga-layout）。

## 数据流入口（重点文件）

```
用户输入
  ↓
entrypoints/cli.tsx                 # 主入口（快速路径分发 + fallback）
  ↓
main.tsx                            # Commander.js 解析 + 认证 + MCP 初始化
  ↓
screens/REPL.tsx                    # Ink/React 终端 UI
  ↓
QueryEngine.ts                      # 查询引擎
  ├── query.ts                      # API 调用封装
  ├── query/config.ts               # 查询配置
  ├── query/deps.ts                 # 依赖注入
  ├── query/tokenBudget.ts          # Token 预算
  ├── commands.ts                   # 40+ 斜杠命令
  ├── tools.ts                      # 25+ 工具
  ├── utils/systemPrompt.ts         # 系统提示词
  ├── utils/api.ts                  # API 客户端
  ├── utils/auth.ts                 # 鉴权
  └── utils/cost-tracker.ts         # 成本追踪
```

## 重点模块文件索引

| 模块 | 入口文件 |
|---|---|
| **查询引擎** | [QueryEngine.ts](file:///workspace/src/QueryEngine.ts), [query.ts](file:///workspace/src/query.ts) |
| **CLI 主流程** | [entrypoints/cli.tsx](file:///workspace/src/entrypoints/cli.tsx), [main.tsx](file:///workspace/src/main.tsx) |
| **REPL UI** | [screens/REPL.tsx](file:///workspace/src/screens/REPL.tsx) |
| **命令注册** | [commands.ts](file:///workspace/src/commands.ts) + [commands/](file:///workspace/src/commands) |
| **工具注册** | [tools.ts](file:///workspace/src/tools.ts) + [tools/](file:///workspace/src/tools) |
| **IDE 桥接** | [bridge/replBridge.ts](file:///workspace/src/bridge/replBridge.ts) + [bridge/initReplBridge.ts](file:///workspace/src/bridge/initReplBridge.ts) |
| **状态管理** | [state/store.ts](file:///workspace/src/state/store.ts) + [state/AppState.tsx](file:///workspace/src/state/AppState.tsx) |
| **Ink 框架** | [ink/ink.tsx](file:///workspace/src/ink/ink.tsx) + [ink/renderer.ts](file:///workspace/src/ink/renderer.ts) |
| **OAuth** | [services/voice.ts](file:///workspace/src/services/voice.ts) 等 + [utils/auth.ts](file:///workspace/src/utils/auth.ts) |
| **Codex 适配** | [utils/codex-fetch-adapter.ts](file:///workspace/src/utils/codex-fetch-adapter.ts) |
| **记忆系统** | [memdir/memdir.ts](file:///workspace/src/memdir/memdir.ts) + [memdir/findRelevantMemories.ts](file:///workspace/src/memdir/findRelevantMemories.ts) |
| **构建** | [scripts/build.ts](file:///workspace/scripts/build.ts)（位于仓库根） |

## 入口修正说明

仓库根的 `package.json` 中 `dev` 脚本指向 `src/entrypoints/cli.tsx`，而 `main.tsx` 是被 `cli.tsx` 引用做完整初始化的次级入口。先前文档中"入口是 `main.tsx`"的说法不准确——`main.tsx` 是内部模块，**`src/entrypoints/cli.tsx` 才是真正的进程入口**。
