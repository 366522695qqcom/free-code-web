# 输入框权限分级与斜杠命令分离 Spec

## Why
当前输入框输入 `/` 时弹出的是权限模式选择菜单（default/plan/acceptEdits/bypassPermissions），而 CC 的 `/` 菜单应该是斜杠命令列表（如 /clear、/compact、/model 等）。权限模式应该作为独立控件放在输入框旁边，与斜杠命令菜单分离。

## What Changes
- **将权限模式选择器从 `/` 菜单中移除**：输入 `/` 不再弹出权限模式菜单，改为弹出 CC 风格的斜杠命令列表
- **新增权限模式独立控件**：在输入框左侧（`>` 提示符旁）添加一个可点击的权限模式按钮，点击后弹出权限模式选择下拉菜单
- **实现 CC 风格斜杠命令菜单**：输入 `/` 时弹出命令列表，包含 /clear、/help、/model、/compact、/cost、/tools、/context、/review、/status 等命令，支持模糊搜索和键盘导航
- **修改 placeholder 文字**：从 "Type a message... (Enter to send · / to switch mode · @ to reference file)" 改为 "Type a message... (Enter to send · / for commands · @ to reference file)"

## Impact
- Affected code: `chat-input.tsx`（主要修改）、`chat-layout.tsx`（权限模式状态传递可能调整）
- Affected specs: `align-with-cc`（对齐 CC 的交互模式）

## ADDED Requirements

### Requirement: 权限模式独立控件
系统 SHALL 在输入框左侧（`>` 提示符旁）提供一个可点击的权限模式按钮：
- 按钮显示当前权限模式的图标和短标签（如 🛡️ default、⏸ plan、⏵ accept、⚠ bypass）
- 点击按钮弹出下拉菜单，列出所有权限模式选项（含核心行为、适用场景、风险等级）
- 下拉菜单支持键盘导航（↑↓ 选择、Enter 确认、Esc 关闭）
- 选择后自动关闭菜单并切换权限模式
- 按钮颜色根据风险等级变化（default=绿、plan=青、acceptEdits=黄、bypassPermissions=红）

#### Scenario: 点击权限模式按钮切换模式
- **WHEN** 用户点击输入框左侧的权限模式按钮
- **THEN** 弹出权限模式下拉菜单，列出 default、plan、acceptEdits、bypassPermissions 四个选项
- **AND** 当前选中的模式有高亮标记
- **WHEN** 用户选择 "acceptEdits" 模式
- **THEN** 菜单关闭，按钮更新为 acceptEdits 的图标和标签，颜色变为黄色

### Requirement: CC 风格斜杠命令菜单
系统 SHALL 在用户输入 `/` 时弹出斜杠命令菜单（而非权限模式菜单）：
- 命令列表参考 CC 的斜杠命令体系，包含以下命令：
  - `/clear` — 清空当前对话
  - `/compact` — 压缩/总结对话
  - `/context` — 显示上下文使用详情
  - `/cost` — 显示当前会话费用
  - `/help` — 显示可用命令
  - `/model` — 切换模型
  - `/review` — 让 AI 审查代码变更
  - `/status` — 显示系统状态
  - `/tools` — 列出可用工具
- 支持模糊搜索：输入 `/co` 过滤出 `/compact`、`/context`、`/cost`
- 支持键盘导航（↑↓ 选择、Enter/Tab 确认、Esc 关闭）
- 每个命令显示名称和简短描述
- 选择命令后自动填入命令文本（不立即执行，用户可补充参数后按 Enter 执行）

#### Scenario: 输入 / 弹出命令菜单
- **WHEN** 用户在输入框中输入 `/`
- **THEN** 弹出斜杠命令菜单，列出所有可用命令
- **AND** 每个命令显示名称和简短描述

#### Scenario: 模糊搜索过滤命令
- **WHEN** 用户输入 `/co`
- **THEN** 命令菜单过滤显示包含 "co" 的命令：/compact、/context、/cost
- **WHEN** 用户输入 `/m`
- **THEN** 命令菜单过滤显示 /model

#### Scenario: 选择命令后填入文本
- **WHEN** 用户从菜单中选择 `/model`
- **THEN** 输入框文本变为 `/model `（带尾部空格），光标在末尾
- **AND** 命令菜单关闭
- **AND** 用户可继续输入模型名称参数后按 Enter 执行

### Requirement: 移除 / 触发权限菜单的逻辑
系统 SHALL 不再在输入 `/` 时弹出权限模式选择菜单：
- 移除 `showModeMenu` 状态中与权限模式的关联
- `/` 键改为触发斜杠命令菜单
- 权限模式切换只能通过输入框旁的独立控件完成

#### Scenario: / 不再弹出权限菜单
- **WHEN** 用户在输入框中输入 `/`
- **THEN** 弹出斜杠命令菜单（而非权限模式菜单）

## MODIFIED Requirements

### Requirement: ChatInput 组件接口调整
ChatInput 组件的 placeholder 文字需修改：
- 从 "Type a message... (Enter to send · / to switch mode · @ to reference file)"
- 改为 "Type a message... (Enter to send · / for commands · @ to reference file)"

状态栏底部提示也需修改：
- 从 "Enter↵ send · Shift+Enter newline · / mode · @ file · Ctrl+C stop"
- 改为 "Enter↵ send · Shift+Enter newline · / commands · @ file · Ctrl+C stop"
