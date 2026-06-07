# 修复 capabilities 类型不匹配 Spec

## Why
前端定义 `capabilities` 为 `string[]` 并调用 `.map()` 渲染，但后端存储和返回的 `capabilities` 是对象 `{vision, reasoning, toolUse}`，导致 `e.capabilities.map is not a function` 运行时崩溃，页面无法加载。

## What Changes
- 修改前端 `CustomModel.capabilities` 类型从 `string[]` 改为 `{vision: boolean; reasoning: boolean; toolUse: boolean}`
- 修改前端渲染逻辑，从 `.map()` 改为条件渲染
- 修改 `handleAddSelectedModels` 中 `capabilities: []` 改为 `capabilities: {vision: false, reasoning: false, toolUse: false}`

## Impact
- Affected code: `web/src/app/settings/providers/page.tsx`
- 后端无需修改（已经使用对象格式）

## ADDED Requirements

### Requirement: capabilities 类型前后端一致
前端 SHALL 使用与后端相同的 capabilities 对象格式 `{vision: boolean; reasoning: boolean; toolUse: boolean}`。

#### Scenario: 渲染模型 capabilities
- **GIVEN** 模型的 capabilities 为 `{vision: true, reasoning: false, toolUse: true}`
- **WHEN** 前端渲染模型列表
- **THEN** 显示"视觉"和"工具使用"标签，不显示"推理"标签

#### Scenario: 添加获取到的模型
- **GIVEN** 用户从 API 获取模型列表并选中若干模型
- **WHEN** 点击"添加选中的模型"
- **THEN** 发送 `capabilities: {vision: false, reasoning: false, toolUse: false}` 到后端

## MODIFIED Requirements

### Requirement: 前端 CustomModel.capabilities 类型
从 `string[]` 改为 `{vision: boolean; reasoning: boolean; toolUse: boolean}`。

### Requirement: capabilities 渲染逻辑
从 `model.capabilities.map()` 改为条件判断每个属性。
