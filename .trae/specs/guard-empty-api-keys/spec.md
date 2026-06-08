# 全项目 SDK 空 API Key 防护 Spec

## Why
`fix-custom-model-chat-auth` 修复了自定义模型路由问题，但项目中仍有多处 SDK 初始化未做空 API key 防护。`new Anthropic({ apiKey: "" })` 传入空字符串会触发 "无法解析认证方法" 的 SDK 内部错误，对用户不友好。需要在所有 SDK 初始化点添加提前校验。

## What Changes
- `streamAnthropic`（`/workspace/web/src/lib/llm/anthropic.ts`）：`new Anthropic()` 前检查 apiKey 非空
- `createQueryEngine`（`/workspace/web/src/lib/query-engine.ts`）：`new Anthropic()` 前检查 apiKey 非空

## Impact
- Affected specs: fix-custom-model-chat-auth
- Affected code:
  - `/workspace/web/src/lib/llm/anthropic.ts` — 添加空 key guard
  - `/workspace/web/src/lib/query-engine.ts` — 添加空 key guard

## ADDED Requirements

### Requirement: 所有 Anthropic SDK 初始化点必须有空 key 防护
系统 SHALL 在 `new Anthropic({ apiKey })` 前检查 apiKey 非空，若为空则返回友好错误而非让 SDK 内部崩溃。

#### Scenario: anthropic.ts streamAnthropic — apiKey 为空
- **WHEN** `ANTHROPIC_API_KEY` 未设置且未传入 `options.apiKey`
- **THEN** 返回友好错误 "ANTHROPIC_API_KEY is not configured"

#### Scenario: query-engine.ts createQueryEngine — apiKey 为空
- **WHEN** `ANTHROPIC_API_KEY` 未设置且未传入 `options.apiKey`
- **THEN** 返回友好错误 "ANTHROPIC_API_KEY is not configured"

### Requirement: 已确认无需修改的模块
以下模块已具有空 key 防护或无需防护：
- `agent-stream.ts`：`runAnthropicLoop` 和 `runOpenAILoop` 已有 guard（fix-custom-model-chat-auth 已添加）
- `llm/openai.ts`：`streamOpenAI` 已有 guard（第 64-71 行）
- `llm/providers.ts`：`isConfigured()` 仅用于展示，不初始化 SDK