# 输入框斜杠命令菜单重构 Spec

## Why
当前输入框输入 `/` 时直接弹出权限模式4级选择表格，但 CC 的 `/` 菜单应该是一个极简命令列表。权限分级应作为 `/` 菜单中的一个选项，选中后才展开4个分级。菜单风格应对齐 CC：极简，只有命令名，无描述文字、无表头、无提示。

## What Changes
- **重构 `/` 菜单为 CC 风格极简命令列表**：输入 `/` 弹出命令名列表，无描述、无表头、无提示文字
- **权限分级作为 `/permissions` 子菜单**：选中后展开4个权限分级选项
- **支持模糊搜索**：输入 `/co` 过滤出 /compact、/context、/cost
- **支持键盘导航**：↑↓ 选择、Enter/Tab 确认、Esc 关闭/返回
- **修改 placeholder 和状态栏提示文字**
- **添加单元测试**：对斜杠命令菜单的核心逻辑编写 vitest 单元测试

## Impact
- Affected code: `chat-input.tsx`（主要修改，重构 `/` 菜单逻辑）
- Affected specs: `align-with-cc`（对齐 CC 的交互模式）
- Affected test: 新增 `chat-input.test.tsx`

## ADDED Requirements

### Requirement: CC 风格极简斜杠命令菜单
系统 SHALL 在用户输入 `/` 时弹出极简斜杠命令菜单，对齐 CC 的视觉风格：
- 命令列表只显示命令名，不显示描述、表头、提示文字、footer 等
- 命令列表包含：
  - `/clear`
  - `/compact`
  - `/context`
  - `/cost`
  - `/help`
  - `/model`
  - `/permissions`
  - `/review`
  - `/status`
  - `/tools`
- 支持模糊搜索：输入 `/co` 过滤出 `/compact`、`/context`、`/cost`
- 支持键盘导航（↑↓ 选择、Enter/Tab 确认、Esc 关闭）
- 选择普通命令后自动填入命令文本（不立即执行，用户可补充参数后按 Enter 执行）
- 菜单样式：极简，每行一个命令名，选中项高亮，无多余装饰

#### Scenario: 输入 / 弹出命令菜单
- **WHEN** 用户在输入框中输入 `/`
- **THEN** 弹出极简斜杠命令菜单，每行只显示命令名
- **AND** 无描述文字、无表头、无提示

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
- 选中 `/permissions` 后，命令菜单切换为权限分级子菜单
- 子菜单同样极简风格，每行只显示模式名和图标，无描述文字：
  - `🛡️ default`
  - `⏸ plan`
  - `⏵ acceptEdits`
  - `⚠ bypassPermissions`
- 当前选中的模式有高亮标记（如 `*` 标记）
- 支持键盘导航（↑↓ 选择、Enter 确认、Esc 返回命令列表）
- 选择后切换权限模式，关闭菜单，清空输入框

#### Scenario: 选中 /permissions 展开权限分级
- **WHEN** 用户在 `/` 命令菜单中选中 `/permissions` 并按 Enter
- **THEN** 命令菜单切换为权限分级子菜单
- **AND** 每行只显示图标和模式名，无描述文字
- **AND** 当前模式有 `*` 标记

#### Scenario: 选择权限模式
- **WHEN** 用户在权限分级子菜单中选择 "acceptEdits"
- **THEN** 权限模式切换为 acceptEdits
- **AND** 菜单关闭，输入框清空

#### Scenario: Esc 返回命令列表
- **WHEN** 用户在权限分级子菜单中按 Esc
- **THEN** 返回 `/` 命令列表
- **WHEN** 用户在命令列表中再按 Esc
- **THEN** 关闭菜单

### Requirement: 斜杠命令菜单单元测试
系统 SHALL 为斜杠命令菜单的核心逻辑提供单元测试覆盖：
- 测试 SLASH_COMMANDS 数据结构包含所有10个命令
- 测试模糊搜索过滤逻辑
- 测试 /permissions 子菜单切换逻辑
- 测试键盘导航逻辑（↑↓ 选择、Enter/Tab 确认、Esc 关闭/返回）
- 测试选择普通命令后填入文本逻辑
- 测试选择权限模式后切换模式、关闭菜单、清空输入框

#### Scenario: 测试模糊搜索
- **WHEN** 运行模糊搜索测试
- **THEN** 输入 `/co` 过滤出 /compact、/context、/cost
- **AND** 输入 `/p` 过滤出 /permissions
- **AND** 输入 `/xyz` 返回空列表

#### Scenario: 测试命令选择
- **WHEN** 选择普通命令 /model
- **THEN** 输入值变为 `/model `（带尾部空格）
- **WHEN** 选择 /permissions
- **THEN** 切换到权限子菜单而非填入文本

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
