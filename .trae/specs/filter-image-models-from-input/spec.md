# 输入框只允许文字模型 Spec

## Why
当前 web 端的 chat 模型选择器（topbar、settings Default Model、chat-input `/模型` 子菜单）从 `/api/providers` 拉取所有 model，**没有按 `modelType` 过滤**，导致 `type: "image"`（DALL·E、Imagen 等图像生成模型）和 `type: "embedding"`（向量模型）也出现在 chat 列表里 — 选了之后调 chat API 会报错或输出乱码。需要：
1. 自动识别（已存在 `CustomModel.modelType`：`"chat" | "embedding" | "image"`）
2. 在 chat 输入框（以及所有 chat 流模型选择器）只允许 `type: "chat"` 的文字模型

## What Changes
- 在 `chat-layout.tsx` `customModels` 拉取逻辑中**过滤** `modelType === "chat"` 的 model
- 在 `topbar.tsx` `customModels` 拉取逻辑中**过滤** `modelType === "chat"` 的 model
- 在 `settings/page.tsx` `providerModels` 拉取逻辑中**过滤** `modelType === "chat"` 的 model
- 提供一个共享的 `isTextModel(model)` 工具函数（放在 `web/src/lib/providers/filter.ts`）
- `/settings/providers` Provider 列表保留所有 model（用户需要看自己加的所有模型，含图像/embedding）— 但**视觉上**给非 chat 模型加个浅灰徽标，让用户知道这些不会出现在 chat 选择里
- `modelType` 字段原本已存在，**不需改 schema**

**BREAKING**: 无（用户主动选 `type: "image"` 的模型失败，现在直接隐藏了 —— 但用户能从 `/settings/providers` 看到自己加的图像模型）

## Impact
- **Affected specs**: 无
- **Affected code**:
  - **新增**: `web/src/lib/providers/filter.ts`（`isTextModel` 工具函数）
  - **修改**: `web/src/components/layout/chat-layout.tsx`（行 50-88 拉取逻辑）
  - **修改**: `web/src/components/layout/topbar.tsx`（拉取逻辑 + 类型定义）
  - **修改**: `web/src/app/settings/page.tsx`（行 145-161 拉取逻辑）
  - **修改**: `web/src/app/settings/providers/page.tsx`（Provider 卡片 model 计数 + 模型列表显示非 chat 徽标）

## ADDED Requirements

### Requirement: isTextModel 工具函数
系统 SHALL 提供 `isTextModel(model: CustomModel | { modelType?: string }): boolean`，在 `web/src/lib/providers/filter.ts` 中实现：

#### Scenario: 标准 CustomModel
- **WHEN** 调用 `isTextModel({ modelType: "chat" })`
- **THEN** 返回 `true`

#### Scenario: 图像模型
- **WHEN** 调用 `isTextModel({ modelType: "image" })`
- **THEN** 返回 `false`

#### Scenario: embedding 模型
- **WHEN** 调用 `isTextModel({ modelType: "embedding" })`
- **THEN** 返回 `false`

#### Scenario: 缺省字段
- **WHEN** 调用 `isTextModel({})`（无 modelType）
- **THEN** 返回 `true`（与数据库 default `"chat"` 行为一致）

### Requirement: chat 模型选择器只显示文字模型
系统 SHALL 在以下 3 处模型选择器只列出 `isTextModel(m) === true` 的 model：
- `chat-layout.tsx` `/模型` 子菜单 + 默认 model
- `topbar.tsx` 模型切换器
- `settings/page.tsx` Default Model Select

#### Scenario: 用户添加了 dall-e-3 (image)
- **WHEN** 用户添加 type=image 模型
- **THEN** 三个选择器中均不显示该模型

#### Scenario: 用户只添加了 dall-e-3
- **WHEN** 用户没添加任何 chat 模型
- **THEN** 三个选择器均显示空态：提示"还没有文字模型，请先在模型提供商添加 chat 类型模型"

### Requirement: /settings/providers 保留所有模型 + 视觉标识
系统 SHALL 在 `/settings/providers` 模型列表中**保留**所有 model（不只显示 chat），但在非 chat 模型的卡片上显示一个浅灰徽标：
- `type: "image"` → 徽标 "图像"
- `type: "embedding"` → 徽标 "向量"
- `type: "chat"` → 不显示徽标（或显示极淡的"对话"徽标）

#### Scenario: 显示图像模型
- **WHEN** 用户查看 Provider 卡片中的模型列表
- **THEN** image 模型旁显示 "图像" 徽标，浅灰色，提示用户它不会出现在 chat 列表

## MODIFIED Requirements
无

## REMOVED Requirements
无

## 验证标准
1. `npm run build` 通过
2. `npm run lint` 通过
3. 添加一个 `type: "image"` 模型（如 `dall-e-3`）：三个 chat 选择器均不出现
4. 添加一个 `type: "chat"` 模型（如 `gpt-4o`）：三个 chat 选择器均出现
5. 添加一个 `type: "embedding"` 模型（如 `text-embedding-3-small`）：三个 chat 选择器均不出现
6. `/settings/providers` 仍显示所有 3 个模型，图像/向量有浅灰徽标
7. 用户切到不带任何 chat 模型的 Provider 时，topbar / settings / /模型 子菜单均显示空态提示

## 不做的事
- 不改后端 LLM 客户端的 fallback（保留 `claude-sonnet-4-20250514`）
- 不改 `/api/providers` 返回数据 schema
- 不改数据库 schema（`modelType` 已存在）
- 不动 settings/providers/model-dialog.tsx 的 modelType 选项（保持 chat/embedding/image 三选）
- 不做模型自动嗅探（用户手动选 type）
- 不引新依赖
- 不加新页面
