# 修复模型获取 URL 拼接错误 Spec

## Why
用户填写 baseUrl 为 `https://apihub.agnes-ai.com/v1/chat/completions` 时，获取模型请求拼接为 `/v1/chat/completions/models`（404），正确应为 `/v1/models`。`fetchProviderModels` 和 `testProviderConnection` 直接在 baseUrl 后拼接 `/models`，未考虑 baseUrl 可能包含 apiPath 的情况。

## What Changes
- 修改 `fetchProviderModels`：从 baseUrl 中剥离 apiPath 后再拼接 `/models`
- 修改 `testProviderConnection`：同样剥离 apiPath 后拼接 `/models`
- 为 URL 提取逻辑添加单元测试（TDD）

## Impact
- Affected code: `web/src/lib/providers/api.ts`
- Affected API routes: `web/src/app/api/providers/[id]/models/route.ts`, `web/src/app/api/providers/[id]/test/route.ts`（无需修改，它们传入的参数不变）
- 前端无需修改

## ADDED Requirements

### Requirement: 模型获取 URL 正确拼接
系统 SHALL 从 provider 的 baseUrl 中正确提取 API 基础 URL，再拼接 `/models` 路径。

#### Scenario: baseUrl 包含完整 API 路径
- **GIVEN** provider 的 baseUrl 为 `https://apihub.agnes-ai.com/v1/chat/completions`，apiPath 为 `/chat/completions`
- **WHEN** 系统获取模型列表
- **THEN** 请求 URL 为 `https://apihub.agnes-ai.com/v1/models`

#### Scenario: baseUrl 为标准基础路径
- **GIVEN** provider 的 baseUrl 为 `https://api.openai.com/v1`，apiPath 为 `/chat/completions`
- **WHEN** 系统获取模型列表
- **THEN** 请求 URL 为 `https://api.openai.com/v1/models`

#### Scenario: baseUrl 末尾有斜杠
- **GIVEN** provider 的 baseUrl 为 `https://api.openai.com/v1/`
- **WHEN** 系统获取模型列表
- **THEN** 请求 URL 为 `https://api.openai.com/v1/models`

#### Scenario: apiPath 为空
- **GIVEN** provider 的 baseUrl 为 `https://example.com/v1`，apiPath 为空
- **WHEN** 系统获取模型列表
- **THEN** 请求 URL 为 `https://example.com/v1/models`

### Requirement: 测试连接 URL 正确拼接
系统 SHALL 在测试连接时同样正确提取 API 基础 URL。

#### Scenario: 测试连接时 baseUrl 包含 apiPath
- **GIVEN** provider 的 baseUrl 为 `https://apihub.agnes-ai.com/v1/chat/completions`，apiPath 为 `/chat/completions`
- **WHEN** 系统测试连接
- **THEN** 先尝试 `https://apihub.agnes-ai.com/v1/models`，再尝试 `https://apihub.agnes-ai.com/v1/chat/completions`

### Requirement: fetchProviderModels 接受 apiPath 参数
`fetchProviderModels` 函数 SHALL 接受可选的 `apiPath` 参数，用于从 baseUrl 中剥离路径部分。

#### Scenario: 不传 apiPath
- **WHEN** 调用 `fetchProviderModels({ baseUrl, apiKey })` 不传 apiPath
- **THEN** 行为与修改前一致，直接在 baseUrl 后拼接 `/models`

## MODIFIED Requirements

### Requirement: fetchProviderModels 函数签名
函数签名从 `{ baseUrl: string; apiKey: string }` 变为 `{ baseUrl: string; apiKey: string; apiPath?: string }`。

### Requirement: testProviderConnection URL 拼接逻辑
`testProviderConnection` 中 `${baseUrl}/models` 拼接改为先从 baseUrl 剥离 apiPath 后再拼接 `/models`；chat completion 的 URL 拼接改为 `${baseWithoutApiPath}${apiPath}`。
