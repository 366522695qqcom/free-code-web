# 统一设置页面布局 Spec

## Why
`/settings/providers` 有左侧导航栏，但点击导航项跳转到 `/settings` 时布局变成单列无侧边栏，导致 UI 布局突变。两个页面应共享同一个侧边栏布局。

## What Changes
- 创建 `settings/layout.tsx`，包含共享侧边栏
- 修改 `settings/page.tsx`，移除独立头部，只保留内容区域
- 修改 `settings/providers/page.tsx`，移除内置侧边栏，只保留内容区域
- 侧边栏高亮当前活动页面

## Impact
- Affected code: `web/src/app/settings/layout.tsx`（新建）、`web/src/app/settings/page.tsx`、`web/src/app/settings/providers/page.tsx`
- 不影响功能逻辑，仅调整布局结构

## ADDED Requirements

### Requirement: 设置页面共享侧边栏布局
所有设置子页面 SHALL 共享同一个侧边栏导航，切换页面时布局不变。

#### Scenario: 从模型提供商切换到对话设置
- **GIVEN** 用户在 `/settings/providers` 页面
- **WHEN** 点击侧边栏"对话设置"
- **THEN** 导航到 `/settings`，侧边栏保持不变，仅右侧内容区域更新

#### Scenario: 从对话设置切换到模型提供商
- **GIVEN** 用户在 `/settings` 页面
- **WHEN** 点击侧边栏"模型提供商"
- **THEN** 导航到 `/settings/providers`，侧边栏保持不变，仅右侧内容区域更新

### Requirement: 侧边栏高亮当前页面
侧边栏 SHALL 根据当前路由高亮对应的导航项。

#### Scenario: 在模型提供商页面
- **WHEN** 用户在 `/settings/providers`
- **THEN** "模型提供商"导航项高亮

#### Scenario: 在对话设置页面
- **WHEN** 用户在 `/settings`
- **THEN** "对话设置"导航项高亮

## MODIFIED Requirements

### Requirement: settings/layout.tsx 提供共享布局
新建 `settings/layout.tsx`，包含左侧导航栏（从 providers/page.tsx 提取）和右侧内容区域（children）。

### Requirement: settings/page.tsx 仅渲染内容
移除独立的头部和全屏布局，只渲染设置卡片列表。

### Requirement: settings/providers/page.tsx 仅渲染内容
移除内置侧边栏，只渲染提供商管理内容。
