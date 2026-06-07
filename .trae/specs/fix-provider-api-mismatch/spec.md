# 修复模型提供商 API 响应格式不匹配 Spec

## Why
用户创建模型提供商后，保存成功但列表不显示。原因是 API 返回的数据格式与前端期望的格式不一致。

## What Changes
- 修复 GET `/api/providers` 返回格式，包裹为 `{ providers: [...] }`
- 修复 POST `/api/providers` 返回格式，包裹为 `{ provider: {...} }`
- 确保 PUT `/api/providers/[id]` 返回格式一致

## Impact
- Affected code: `web/src/app/api/providers/route.ts`, `web/src/app/api/providers/[id]/route.ts`
- 前端代码无需修改，因为前端已经在期望 `{ providers: [...] }` 和 `{ provider: {...} }` 格式

## ADDED Requirements

### Requirement: API 响应格式统一
API 路由 SHALL 返回前端期望的 JSON 格式。

#### Scenario: GET /api/providers 返回提供商列表
- **WHEN** 前端调用 GET /api/providers
- **THEN** 返回 `{ providers: ProviderWithModels[] }` 格式

#### Scenario: POST /api/providers 创建提供商
- **WHEN** 前端调用 POST /api/providers 创建成功
- **THEN** 返回 `{ provider: CustomProvider }` 格式，status 201

#### Scenario: PUT /api/providers/[id] 更新提供商
- **WHEN** 前端调用 PUT /api/providers/[id] 更新成功
- **THEN** 返回 `{ provider: CustomProvider }` 格式，status 200
