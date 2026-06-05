# 生产级代码生成体验重构 Spec

## Why
当前项目已具备基础聊天和工具执行能力，但距离"网页端生产级代码生成工具"的目标还有差距。模型提供商管理入口不直观（独立页面），代码生成体验缺少文件树、diff 预览、语法高亮等核心能力，整体信息密度和交互效率需要提升。同时与 Claude Code 终端体验相比还有多项功能缺失。

## 与 Claude Code 功能对比

| # | CC 功能 | 当前状态 | 说明 |
|---|--------|---------|------|
| 1 | Agentic Loop（工具循环） | ✅ 已实现 | agent-stream.ts 完整实现 |
| 2 | 四档权限模式 | ✅ 已实现 | default/plan/acceptEdits/bypassPermissions |
| 3 | 沙箱执行 | ✅ 已实现 | @vercel/sandbox 集成 |
| 4 | 权限分级（low/high/outside） | ✅ 已实现 | 行内 Y/n 确认 |
| 5 | 自定义模型提供商 | ✅ 已实现 | 但入口为独立页面，需改为弹窗 |
| 6 | MCP 协议集成 | ✅ 已实现 | manager.ts 支持标准输入输出和 SSE |
| 7 | Extended Thinking | ✅ 已实现 | Anthropic thinking block 支持 |
| 8 | 成本追踪 | ✅ 已实现 | 状态栏显示 |
| 9 | 命令历史导航 | ✅ 已实现 | ↑↓ 键翻历史 |
| 10 | 主题切换 | ✅ 已实现 | dark/light/system |
| 11 | 斜杠命令 | ⚠️ 部分 | 有 /clear /help /model /compact /cost /tools，缺少 /context /review /init /bug /doctor /vim /status |
| 12 | 会话管理 | ⚠️ 部分 | 有创建/切换/删除，缺少 -c 继续上次对话 |
| 13 | 代码 diff 预览 | ⚠️ 部分 | 有基础 diff-view，缺少语法高亮、行号、语言检测 |
| 14 | 文件树面板 | ❌ 缺失 | CC 可感知项目结构，我们没有 |
| 15 | Checkpointing（ESC回退） | ❌ 缺失 | CC 按两次 ESC 回退代码变更 |
| 16 | Git 集成 | ❌ 缺失 | CC 可自动 commit、创建 PR |
| 17 | SubAgent 系统 | ❌ 缺失 | CC 可并行委派子任务（最多10个） |
| 18 | Hooks 系统 | ❌ 缺失 | CC 有 PreToolUse/PostToolUse/Notification 等事件钩子 |
| 19 | Skills 系统 | ❌ 缺失 | CC 可动态加载领域专家知识 |
| 20 | @ 文件引用 | ❌ 缺失 | CC 可用 @src/file.ts 引用文件 |
| 21 | 上下文窗口监控 | ❌ 缺失 | CC 有 /context 命令监控 token 用量 |
| 22 | One-shot 模式 | ❌ 缺失 | CC 有 claude -p "query" 单次查询 |
| 23 | 非交互/Headless 模式 | ❌ 缺失 | CC 可用于 CI/CD 自动化 |
| 24 | Vim 模式 | ❌ 缺失 | CC 支持 /vim 切换 |
| 25 | 多文件编辑 | ⚠️ 部分 | 工具支持但无批量操作 UI |

## What Changes

### 本期实现（高优先级）
- 将模型提供商管理从独立页面改为弹窗组件，从状态栏图标按钮触发
- 添加文件树侧面板，实时展示 AI 生成/修改的文件结构
- 增强代码 diff 预览：语法高亮、行号、语言检测、折叠/展开
- 添加 @ 文件引用功能：输入 @ 自动补全项目文件路径
- 添加上下文窗口监控：状态栏显示 token 用量百分比
- 补充斜杠命令：/context、/review、/status

### 后续迭代（中优先级）
- Checkpointing：会话级代码快照和回退
- Git 集成：自动 commit、PR 创建
- Hooks 系统：PreToolUse/PostToolUse 事件钩子
- Skills 系统：领域专家知识动态加载

### 暂不实现（低优先级/不适用 Web）
- SubAgent 系统（架构差异大）
- One-shot / Headless 模式（Web 不适用）
- Vim 模式（Web 输入框不适用）

## Impact
- Affected specs: convert-to-webapp (UI 重构), add-sandbox (工具确认已改为行内)
- Affected code:
  - `/workspace/web/src/app/settings/providers/page.tsx` → 改为弹窗组件
  - `/workspace/web/src/components/layout/chat-layout.tsx` — 新增文件树面板
  - `/workspace/web/src/components/chat/chat-input.tsx` — 状态栏新增提供商图标、@ 引用
  - `/workspace/web/src/components/messages/tool-result-block.tsx` — 增强 diff 展示
  - `/workspace/web/src/components/chat/diff-view.tsx` — 增强语法高亮
  - `/workspace/web/src/hooks/use-chat.ts` — 新增 @ 引用处理、上下文监控

## ADDED Requirements

### Requirement: 模型提供商弹窗
系统 SHALL 提供一个模型提供商管理弹窗（Dialog），从状态栏的提供商图标按钮触发打开，包含完整的提供商 CRUD、连接测试、模型获取和模型管理功能。

#### Scenario: 打开提供商弹窗
- **WHEN** 用户点击状态栏中的提供商图标
- **THEN** 弹出 Dialog，显示已添加的提供商列表和配置面板

#### Scenario: 从弹窗添加提供商
- **WHEN** 用户在弹窗中填写 BaseURL/APIKey 并保存
- **THEN** 提供商被创建，列表刷新，无需跳转页面

#### Scenario: 从弹窗获取模型
- **WHEN** 用户选中提供商后点击"获取模型"
- **THEN** 弹窗内展示模型清单，支持勾选添加

### Requirement: 文件树面板
系统 SHALL 在聊天界面左侧提供文件树面板，实时展示当前会话中 AI 生成或修改的文件结构。

#### Scenario: 文件树展示
- **WHEN** AI 执行文件写入/编辑操作
- **THEN** 文件树自动更新，新增文件显示绿色标记，修改文件显示黄色标记

#### Scenario: 文件树点击
- **WHEN** 用户点击文件树中的文件
- **THEN** 聊天区滚动到该文件对应的工具调用结果

### Requirement: 增强代码 diff 预览
系统 SHALL 在工具结果中提供语法高亮的代码 diff 预览，支持行号显示、增删行着色、折叠/展开。

#### Scenario: 文件编辑 diff 展示
- **WHEN** AI 执行文件编辑操作并返回结果
- **THEN** 展示语法高亮的行内 diff，新增行绿色背景，删除行红色背景，行号显示，根据文件扩展名自动检测语言

### Requirement: @ 文件引用
系统 SHALL 支持在输入框中使用 @ 语法引用项目文件，AI 可读取引用文件的内容作为上下文。

#### Scenario: 输入 @ 触发文件补全
- **WHEN** 用户在输入框中输入 @
- **THEN** 弹出文件路径补全列表，支持模糊搜索

#### Scenario: 引用文件发送
- **WHEN** 用户选择文件并发送消息
- **THEN** 文件内容被附加到消息中作为上下文

### Requirement: 上下文窗口监控
系统 SHALL 在状态栏显示当前会话的上下文窗口使用百分比，并在接近上限时发出警告。

#### Scenario: 状态栏显示
- **WHEN** 会话进行中
- **THEN** 状态栏显示 token 用量百分比（如 "ctx: 45%"）

#### Scenario: 接近上限警告
- **WHEN** 上下文使用超过 70%
- **THEN** 显示黄色警告，建议使用 /compact 压缩

### Requirement: 补充斜杠命令
系统 SHALL 支持 /context、/review、/status 斜杠命令。

#### Scenario: /context 命令
- **WHEN** 用户输入 /context
- **THEN** 显示当前上下文使用详情（输入/输出 token、百分比）

#### Scenario: /review 命令
- **WHEN** 用户输入 /review
- **THEN** AI 审查当前会话中的代码变更

#### Scenario: /status 命令
- **WHEN** 用户输入 /status
- **THEN** 显示系统状态（模型、权限模式、沙箱状态、MCP 连接数）

## MODIFIED Requirements

### Requirement: 模型提供商页面
原独立页面 `/settings/providers` SHALL 被替换为弹窗组件。独立页面保留但不再作为主要入口。

### Requirement: 聊天布局
聊天布局 SHALL 从纯对话模式改为 IDE 风格：左侧可选文件树面板 + 中间对话区 + 底部状态栏。文件树面板可通过按钮切换显示/隐藏。

## REMOVED Requirements
（无移除项）
