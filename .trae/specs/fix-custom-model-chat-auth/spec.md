# 修复自定义模型聊天认证错误 Spec

## Why
用户选择自定义模型提供商（如 agnes-1.5-flash）发送消息时，后端仍走 Anthropic SDK 路径，导致 `apiKey` 为空时抛出"无法解析认证方法"错误。自定义模型应走 OpenAI 兼容 API 路径。

## What Changes
- 修改 `/api/chat` 路由，接收 `providerId` 参数
- 修改 `createAgenticStream`，当模型属于自定义提供商时，使用该提供商的 baseUrl/apiKey/apiPath 走 OpenAI 兼容流
- 修改前端 `use-chat.ts`，发送消息时附带当前模型的 providerId 和 baseUrl
- 在 `runAnthropicLoop` 中，当 apiKey 为空时提前返回友好错误而非崩溃

## Impact
- Affected code:
  - `/workspace/web/src/app/api/chat/route.ts` — 接收 providerId
  - `/workspace/web/src/lib/agent-stream.ts` — 自定义提供商路由
  - `/workspace/web/src/hooks/use-chat.ts` — 传递提供商信息
  - `/workspace/web/src/components/layout/chat-layout.tsx` — 传递 providerId

## ADDED Requirements

### Requirement: 自定义模型聊天路由
系统 SHALL 在用户选择自定义模型时，使用该模型所属提供商的 baseUrl/apiKey/apiPath 通过 OpenAI 兼容 API 发送请求。

#### Scenario: 使用自定义模型发送消息
- **WHEN** 用户选择自定义提供商的模型并发送消息
- **THEN** 后端查找该模型的提供商配置，使用 OpenAI 兼容 API 路径发送请求

#### Scenario: Anthropic API Key 未配置
- **WHEN** 用户使用内置 Anthropic 模型但 ANTHROPIC_API_KEY 未设置
- **THEN** 返回友好错误提示"ANTHROPIC_API_KEY 未配置"，而非 SDK 认证解析错误

## MODIFIED Requirements

### Requirement: Chat API 请求格式
请求体新增可选字段：
- `providerId?: string` — 自定义提供商 ID
- `baseUrl?: string` — 自定义提供商 baseUrl
- `apiKey?: string` — 自定义提供商 apiKey（不传则后端从数据库读取）
- `apiPath?: string` — 自定义提供商 API 路径
