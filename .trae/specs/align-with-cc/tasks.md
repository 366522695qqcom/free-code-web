# Tasks

- [x] Task 1: 扩展 Usage 类型和 SSE 事件 — 添加 cache token 字段
  - [x] SubTask 1.1: 修改 `/workspace/web/src/types/index.ts` — Usage 类型添加 `cacheCreationInputTokens` 和 `cacheReadInputTokens` 字段（默认值 0）
  - [x] SubTask 1.2: 修改 `/workspace/web/src/hooks/use-chat.ts` — `normalizeSSEEvent` 的 usage 解析添加 cache token 字段；`setUsage` 累加 cache token；`contextPercentage` 计算改为 `(inputTokens + cacheCreationInputTokens + cacheReadInputTokens) / maxContext * 100`（参考 `/workspace/src/utils/context.ts` L118-L144）
  - [x] SubTask 1.3: 修改 `/workspace/web/src/lib/agent-stream.ts` — SSE usage 事件中包含 cache token 数据

- [x] Task 2: 实现 buffer-based 阈值计算 — 对齐 CC 的阈值方式
  - [x] SubTask 2.1: 创建 `/workspace/web/src/lib/context.ts` — 参考 `/workspace/src/services/compact/autoCompact.ts`，导出 `getEffectiveContextWindowSize(model)`、`getAutoCompactThreshold(model)`、`calculateTokenWarningState(tokenUsage, model)` 函数，使用 buffer-based 阈值（AUTOCOMPACT_BUFFER=13000, WARNING_BUFFER=20000, ERROR_BUFFER=20000）
  - [x] SubTask 2.2: 为 `/workspace/web/src/lib/context.ts` 编写测试 — 参考 `/workspace/src/services/compact/autoCompact.ts` 的阈值常量，验证 200k 模型的阈值计算结果

- [x] Task 3: TokenWarning 组件 — 上下文接近满时的警告横幅
  - [x] SubTask 3.1: 创建 `/workspace/web/src/components/chat/token-warning.tsx` — 参考 `/workspace/src/components/TokenWarning.tsx`，接收 `tokenUsage` 和 `model` props，使用 `calculateTokenWarningState` 计算状态，auto-compact 启用时显示 "XX% until auto-compact"（dimmed），禁用时显示 "Context low (XX% remaining) · /compact"（warning/error 颜色）
  - [x] SubTask 3.2: 修改 `/workspace/web/src/components/layout/chat-layout.tsx` — 在输入框上方添加 TokenWarning 组件，传入当前 token 使用量和模型

- [x] Task 4: 修正状态栏上下文显示 — 移除百分比颜色阈值，改用 buffer-based
  - [x] SubTask 4.1: 修改 `/workspace/web/src/components/chat/chat-input.tsx` — 移除 70%/90% 百分比颜色逻辑，改用 `calculateTokenWarningState` 的 `isAboveWarningThreshold` 和 `isAboveErrorThreshold` 来决定颜色；正常时 dimmed，warning 时黄色，error 时红色；显示格式从 `ctx: XX%` 改为根据状态显示不同文本

- [x] Task 5: Auto-compact 后端 — 上下文超阈值时自动压缩
  - [x] SubTask 5.1: 创建 `/workspace/web/src/app/api/compact/route.ts` — POST 端点，接收 messages 和 model，调用 LLM 生成对话摘要，返回压缩后的消息列表
  - [x] SubTask 5.2: 修改 `/workspace/web/src/hooks/use-chat.ts` — 在 streaming 循环中检测上下文使用量，超出 auto-compact 阈值时自动调用 `/api/compact` 压缩对话；添加 `autoCompactEnabled` 状态（默认 true）；压缩后重置 token 计数
  - [x] SubTask 5.3: 修改 `/workspace/web/src/components/layout/chat-layout.tsx` — `/compact` 斜杠命令调用 `/api/compact` 端点

- [x] Task 6: /context 命令增强 — 显示 cache token 详情
  - [x] SubTask 6.1: 修改 `/workspace/web/src/components/layout/chat-layout.tsx` — `/context` 命令输出添加 cache token 详情（cacheCreationInputTokens、cacheReadInputTokens），显示 "XX% until auto-compact" 信息

- [x] Task 7: 构建验证
  - [x] SubTask 7.1: `npm run build` 通过
  - [x] SubTask 7.2: `npm run lint` 无错误

# Task Dependencies
- [Task 1] depends on nothing
- [Task 2] depends on [Task 1]（需要扩展后的 Usage 类型）
- [Task 3] depends on [Task 2]（需要 calculateTokenWarningState）
- [Task 4] depends on [Task 2]（需要 calculateTokenWarningState）
- [Task 5] depends on [Task 1, Task 2]（需要 Usage 类型和阈值计算）
- [Task 6] depends on [Task 1, Task 2]（需要 cache token 和阈值信息）
- [Task 7] depends on [Task 1-6]
