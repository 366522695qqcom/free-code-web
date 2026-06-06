# 输入框斜杠命令菜单重构 Spec

## Why
当前输入框输入 `/` 时直接弹出权限模式4级选择表格，但 CC 的 `/` 菜单应该是一个命令列表（/clear、/compact、/model 等）。权限分级应作为 `/` 菜单中的一个选项（如 `/permissions`），选中后才展开4个分级供选择。

## What Changes
- **重构 `/` 菜单为 CC 风格斜杠命令列表**：输入 `/` 弹出命令列表，包含 /clear、/compact、/model、/permissions 等命令
- **权限分级作为 `/permissions` 子菜单**：在命令列表中选中 `/permissions` 后，展开4个权限分级选项（default、plan、acceptEdits、bypassPermissions）
- **支持模糊搜索**：输入 `/co` 过滤出 /compact、/context、/cost
- **支持键盘导航**：↑↓ 选择、Enter/Tab 确认、Esc 关闭/返回
- **修改 placeholder 和状态栏提示文字**

## Impact
- Affected code: `chat-input.tsx`（主要修改，重构 `/` 菜单逻辑）
- Affected specs: `align-with-cc`（对齐 CC 的交互模式）

## ADDED Requirements

### Requirement: CC 风格斜杠命令菜单
系统 SHALL 在用户输入 `/` 时弹出斜杠命令菜单：
- 命令列表参考 CC 的斜杠命令体系，包含以下命令：
  - `/clear` — 清空当前对话
  - `/compact` — 压缩/总结对话
  - `/context` — 显示上下文使用详情
  - `/cost` — 显示当前会话费用
  - `/help` — 显示可用命令
  - `/model` — 切换模型
  - `/permissions` — 切换权限模式（选中后展开4个分级）
  - `/review` — 让 AI 审查代码变更
  - `/status` — 显示系统状态
  - `/tools` — 列出可用工具
- 支持模糊搜索：输入 `/co` 过滤出 `/compact`、`/context`、`/cost`
- 支持键盘导航（↑↓ 选择、Enter/Tab 确认、Esc 关闭）
- 每个命令显示名称和简短描述
- 选择普通命令后自动填入命令文本（不立即执行，用户可补充参数后按 Enter 执行）

#### Scenario: 输入 / 弹出命令菜单
- **WHEN** 用户在输入框中输入 `/`
- **THEN** 弹出斜杠命令菜单，列出所有可用命令（含 /permissions）
- **AND** 每个命令显示名称和简短描述

#### Scenario: 模糊搜索过滤命令
- **WHEN** 用户输入 `/co`
- **THEN** 命令菜单过滤显示包含 "co" 的命令：/compact、/context、/cost
- **WHEN** 用户输入 `/p`
- **THEN** 命令菜单过滤显示 /permissions

#### Scenario: 选择普通命令后填入文本
- **WHEN** 用户从菜单中选择 `/model`
- **THEN** 输入框文本变为 `/model `（带尾部空格），光标在末尾
- **AND** 命令菜单关闭
- **AND** 用户可继续输入模型名称参数后按 Enter 执行

### Requirement: /permissions 子菜单展开权限分级
系统 SHALL 在 `/` 命令菜单中选中 `/permissions` 后展开权限分级选择：
- 选中 `/permissions` 后，命令菜单切换为权限分级子菜单，显示4个选项：
  - `default` — 标准模式，逐一询问（低风险）
  - `plan` — 规划模式，只读+计划（极低风险）
  - `acceptEdits` — 自动批准文件编辑（中等风险）
  - `bypassPermissions` — 跳过所有权限提示（极高风险）
- 每个选项显示：图标、模式名、核心行为简述、风险等级
- 当前选中的模式有高亮标记
- 支持键盘导航（↑↓ 选择、Enter 确认、Esc 返回命令列表）
- 选择后切换权限模式，关闭菜单，清空输入框

#### Scenario: 选中 /permissions 展开权限分级
- **WHEN** 用户在 `/` 命令菜单中选中 `/permissions` 并按 Enter
- **THEN** 命令菜单切换为权限分级子菜单
- **AND** 显示 default、plan、acceptEdits、bypassPermissions 四个选项
- **AND** 当前模式有高亮标记

#### Scenario: 选择权限模式
- **WHEN** 用户在权限分级子菜单中选择 "acceptEdits"
- **THEN** 权限模式切换为 acceptEdits
- **AND** 菜单关闭，输入框清空
- **AND** 状态栏权限模式标签更新为 "acceptEdits"

#### Scenario: Esc 返回命令列表
- **WHEN** 用户在权限分级子菜单中按 Esc
- **THEN** 返回 `/` 命令列表（而非直接关闭菜单）
- **WHEN** 用户在命令列表中再按 Esc
- **THEN** 关闭菜单

## MODIFIED Requirements

### Requirement: ChatInput 组件交互逻辑重构
原有的 `showModeMenu` 状态逻辑需重构：
- 移除输入 `/` 直接弹出权限模式菜单的逻辑
- 新增 `showCommandMenu` 状态控制斜杠命令菜单
- 新增 `showPermissionSubmenu` 状态控制权限分级子菜单
- 菜单层级：命令列表 → 权限分级子菜单（仅 /permissions 触发）

### Requirement: 提示文字更新
- placeholder 从 "Type a message... (Enter to send · / to switch mode · @ to reference file)" 改为 "Type a message... (Enter to send · / for commands · @ to reference file)"
- 状态栏底部提示从 "Enter↵ send · Shift+Enter newline · / mode · @ file · Ctrl+C stop" 改为 "Enter↵ send · Shift+Enter newline · / commands · @ file · Ctrl+C stop"
