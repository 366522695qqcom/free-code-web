# 生产级代码生成体验重构 Spec

## Why
当前项目已具备基础聊天和工具执行能力，但距离"网页端生产级代码生成工具"的目标还有差距。模型提供商管理入口不直观（独立页面），代码生成体验缺少文件树、diff 预览、语法高亮等核心能力，整体信息密度和交互效率需要提升。

## What Changes
- 将模型提供商管理从独立页面改为弹窗组件，从状态栏图标按钮触发
- 添加文件树侧面板，实时展示 AI 生成/修改的文件结构
- 增强代码 diff 预览：行内 diff 高亮、语法着色、折叠/展开
- 增强工具调用输出：代码块语法高亮、文件路径可点击跳转
- 优化整体布局为 IDE 风格：左侧文件树 + 中间对话 + 右侧可选预览

## Impact
- Affected specs: convert-to-webapp (UI 重构), add-sandbox (工具确认已改为行内)
- Affected code:
  - `/workspace/web/src/app/settings/providers/page.tsx` → 改为弹窗组件
  - `/workspace/web/src/components/layout/chat-layout.tsx` — 新增文件树面板
  - `/workspace/web/src/components/layout/sidebar.tsx` — 移除设置/登出按钮（已在侧边栏）
  - `/workspace/web/src/components/chat/chat-input.tsx` — 状态栏新增提供商图标
  - `/workspace/web/src/components/messages/tool-use-block.tsx` — 增强代码展示
  - `/workspace/web/src/components/messages/tool-result-block.tsx` — 增强 diff 展示
  - `/workspace/web/src/components/chat/diff-view.tsx` — 增强语法高亮

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
- **THEN** 展示语法高亮的行内 diff，新增行绿色背景，删除行红色背景，行号显示

### Requirement: 状态栏提供商入口
系统 SHALL 在底部状态栏提供模型提供商快捷入口图标，点击打开提供商管理弹窗。

#### Scenario: 状态栏显示
- **WHEN** 页面加载完成
- **THEN** 状态栏显示当前提供商名称和图标，可点击

## MODIFIED Requirements

### Requirement: 模型提供商页面
原独立页面 `/settings/providers` SHALL 被替换为弹窗组件。独立页面保留但不再作为主要入口。

### Requirement: 聊天布局
聊天布局 SHALL 从纯对话模式改为 IDE 风格：左侧可选文件树面板 + 中间对话区 + 底部状态栏。文件树面板可通过按钮切换显示/隐藏。

## REMOVED Requirements
（无移除项）
