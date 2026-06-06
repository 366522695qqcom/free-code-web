# 对齐 CC 功能 Spec

## Why
当前上下文窗口监控实现与 CC 不一致：计算方式错误（包含了 output tokens）、阈值方式错误（用百分比而非 buffer-based）、缺少 auto-compact 和 TokenWarning 组件。需要全面对齐 CC 的上下文管理和补充缺失功能。

## What Changes
- **修正上下文百分比计算**：只计算 input tokens（含 cache tokens），不包含 output tokens — 参考 `/workspace/src/utils/context.ts` 的 `calculateContextPercentages`
- **修正阈值方式**：从百分比阈值改为 buffer-based 阈值 — 参考 `/workspace/src/services/compact/autoCompact.ts` 的 `calculateTokenWarningState`
- **添加 TokenWarning 组件**：上下文接近满时显示警告 — 参考 `/workspace/src/components/TokenWarning.tsx`
- **添加 auto-compact 功能**：上下文超出阈值时自动压缩对话 — 参考 `/workspace/src/services/compact/autoCompact.ts`
- **添加 cache token 追踪**：在 Usage 类型中添加 `cacheCreationInputTokens` 和 `cacheReadInputTokens`
- **修正状态栏显示**：从 `ctx: XX%` 改为 CC 风格的 `XX% until auto-compact` 或 `Context low (XX% remaining)`
- **添加 /compact 命令后端**：手动压缩对话的 API 端点

## Impact
- Affected code: `use-chat.ts`, `chat-input.tsx`, `types/index.ts`, `agent-stream.ts`, SSE 事件处理
- New files: `TokenWarning` 组件, auto-compact 服务, `/api/compact` 端点

## ADDED Requirements

### Requirement: 上下文百分比计算对齐 CC
系统 SHALL 按照 CC 的方式计算上下文使用百分比：
- 只计算 `input_tokens + cache_creation_input_tokens + cache_read_input_tokens`
- 不包含 `output_tokens`（output tokens 不占用上下文窗口）
- 百分比 = `Math.round((totalInputTokens / contextWindowSize) * 100)`

参考: `/workspace/src/utils/context.ts` L118-L144 `calculateContextPercentages`

#### Scenario: 正确计算上下文百分比
- **WHEN** API 返回 usage 数据包含 input_tokens=50000, cache_creation_input_tokens=10000, cache_read_input_tokens=30000, output_tokens=20000
- **THEN** 上下文使用量 = 50000 + 10000 + 30000 = 90000 tokens
- **AND** 百分比 = 90000 / 200000 * 100 = 45%（不是 55%）

### Requirement: Buffer-based 阈值对齐 CC
系统 SHALL 使用 buffer-based 阈值而非百分比阈值：
- `AUTOCOMPACT_BUFFER_TOKENS = 13,000` — auto-compact 触发阈值 = `effectiveContextWindow - 13,000`
- `WARNING_THRESHOLD_BUFFER_TOKENS = 20,000` — 警告阈值 = `threshold - 20,000`
- `ERROR_THRESHOLD_BUFFER_TOKENS = 20,000` — 错误阈值 = `threshold - 20,000`
- 对于 200k 上下文窗口：警告 ~90%，auto-compact ~93.5%

参考: `/workspace/src/services/compact/autoCompact.ts` L62-L65, L93-L145

#### Scenario: 200k 模型阈值计算
- **WHEN** 模型上下文窗口为 200,000 tokens
- **THEN** auto-compact 阈值 = 200,000 - 20,000(max_output) - 13,000 = 167,000 tokens (~83.5%)
- **AND** 警告阈值 = 167,000 - 20,000 = 147,000 tokens (~73.5%)
- **AND** 错误阈值 = 167,000 - 20,000 = 147,000 tokens (~73.5%)

### Requirement: TokenWarning 组件
系统 SHALL 在上下文接近满时显示 TokenWarning 组件：
- 当 auto-compact 启用时：显示 `"XX% until auto-compact"`（dimmed 文字）
- 当 auto-compact 禁用时：显示 `"Context low (XX% remaining) · Run /compact to compact & continue"`（warning/error 颜色）
- 警告级别用黄色，错误级别用红色

参考: `/workspace/src/components/TokenWarning.tsx` L87-L178

#### Scenario: 上下文接近满时显示警告
- **WHEN** 上下文使用量超过警告阈值
- **THEN** 在输入框上方显示 TokenWarning 横幅
- **AND** auto-compact 启用时显示 "XX% until auto-compact"
- **AND** auto-compact 禁用时显示 "Context low (XX% remaining) · Run /compact"

### Requirement: Auto-compact 功能
系统 SHALL 在上下文超出 auto-compact 阈值时自动压缩对话：
- 压缩方式：调用 LLM 总结当前对话，用摘要替换历史消息
- 压缩后重置 token 计数
- 连续失败 3 次后停止尝试（circuit breaker）
- 可通过 `DISABLE_AUTO_COMPACT` 环境变量禁用

参考: `/workspace/src/services/compact/autoCompact.ts` L241-L351

#### Scenario: 上下文超出阈值时自动压缩
- **WHEN** 上下文使用量超过 auto-compact 阈值
- **THEN** 系统自动调用 LLM 生成对话摘要
- **AND** 用摘要替换历史消息
- **AND** 重置 token 计数

### Requirement: Cache token 追踪
系统 SHALL 追踪 cache 相关的 token 用量：
- `cacheCreationInputTokens`：写入缓存的 token 数
- `cacheReadInputTokens`：从缓存读取的 token 数
- 这些数据包含在 SSE usage 事件中
- 这些数据包含在 `/context` 命令输出中

参考: `/workspace/src/utils/context.ts` L118-L144

#### Scenario: SSE usage 事件包含 cache tokens
- **WHEN** API 返回 usage 数据
- **THEN** SSE usage 事件包含 `cacheCreationInputTokens` 和 `cacheReadInputTokens` 字段

### Requirement: 状态栏上下文显示对齐 CC
系统 SHALL 在状态栏中显示 CC 风格的上下文信息：
- 默认显示：`ctx: XX%`（正常时 dimmed）
- 接近 auto-compact 阈值时：`XX% until auto-compact`（dimmed）
- 上下文低时：`Context low`（warning/error 颜色）
- 移除 70%/90% 百分比阈值颜色逻辑

#### Scenario: 状态栏上下文显示
- **WHEN** 上下文使用量为 45%
- **THEN** 状态栏显示 `ctx: 45%`（dimmed 颜色）
- **WHEN** 上下文使用量接近 auto-compact 阈值
- **THEN** 状态栏显示 `XX% until auto-compact`（dimmed 颜色）

### Requirement: /compact 命令后端
系统 SHALL 提供手动压缩对话的 API 端点：
- `POST /api/compact`：接收会话消息，调用 LLM 生成摘要，返回压缩后的消息
- 前端 `/compact` 斜杠命令调用此端点

参考: `/workspace/src/services/compact/compact.ts`

#### Scenario: 手动压缩对话
- **WHEN** 用户输入 `/compact`
- **THEN** 系统调用 `/api/compact` 端点
- **AND** 端点返回压缩后的消息列表
- **AND** 前端用压缩后的消息替换当前消息

## MODIFIED Requirements

### Requirement: Usage 类型扩展
原有 Usage 类型需扩展：
```typescript
interface Usage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number;  // 新增
  cacheReadInputTokens: number;       // 新增
  cost: number;
}
```

### Requirement: 上下文百分比计算逻辑修改
原有 `contextPercentage` 计算逻辑从 `(inputTokens + outputTokens) / maxContext` 修改为 `(inputTokens + cacheCreationInputTokens + cacheReadInputTokens) / maxContext`
