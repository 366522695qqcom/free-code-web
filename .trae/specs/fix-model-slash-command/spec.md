# 修复 /model 命令模型选择交互 Spec

## Why
输入 `/model` 后只显示文本列表，无法用上下键选择模型，且自定义模型因 capabilities 类型不匹配可能无法显示。用户期望像 `/permissions` 一样有子菜单交互。

## What Changes
- 将 `/model` 命令改为有子菜单（`hasSubmenu: true`），选择后显示模型列表
- 新增模型选择子菜单 UI，支持上下键导航和选择
- 修复 `ModelOption.capabilities` 类型从 `string[]` 改为 `string[] | {vision: boolean; reasoning: boolean; toolUse: boolean}` 以兼容后端返回格式
- 修复 `refreshCustomModels` 中 capabilities 赋值逻辑

## Impact
- Affected code: `web/src/components/chat/chat-input.tsx`、`web/src/components/layout/chat-layout.tsx`、`web/src/types/index.ts`
- 不影响后端

## ADDED Requirements

### Requirement: /model 命令支持子菜单交互
`/model` 命令 SHALL 显示模型列表子菜单，支持上下键导航和 Enter/Tab 选择。

#### Scenario: 输入 /model 后显示模型列表
- **GIVEN** 用户在输入框输入 `/model`
- **WHEN** 选择 `/model` 命令
- **THEN** 显示模型列表子菜单，包含内置模型和自定义模型

#### Scenario: 上下键导航模型列表
- **GIVEN** 模型列表子菜单已显示
- **WHEN** 按上下键
- **THEN** 高亮移动到对应模型

#### Scenario: 选择模型
- **GIVEN** 模型列表子菜单已显示
- **WHEN** 按 Enter 或 Tab
- **THEN** 切换到选中的模型，关闭子菜单

#### Scenario: Esc 返回命令列表
- **GIVEN** 模型列表子菜单已显示
- **WHEN** 按 Esc
- **THEN** 返回斜杠命令列表

### Requirement: 自定义模型正确显示
从后端获取的自定义模型 SHALL 正确显示在模型列表中。

#### Scenario: 自定义模型的 capabilities 是对象格式
- **GIVEN** 后端返回 capabilities 为 `{vision: true, reasoning: false, toolUse: false}`
- **WHEN** 加载自定义模型到模型列表
- **THEN** 模型正确显示，capabilities 被转换为字符串数组

## MODIFIED Requirements

### Requirement: /model 命令有子菜单
`SLASH_COMMANDS` 中 `/model` 的 `hasSubmenu` 从 `false` 改为 `true`。

### Requirement: ModelOption.capabilities 兼容对象格式
`ModelOption.capabilities` 类型从 `string[]` 改为 `string[] | Record<string, boolean>`。
