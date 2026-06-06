# Checklist

## Usage 类型和 SSE 事件
- [x] Usage 类型包含 cacheCreationInputTokens 和 cacheReadInputTokens 字段
- [x] SSE usage 事件正确解析 cache token 数据
- [x] contextPercentage 计算只包含 input tokens + cache tokens（不包含 output tokens）

## Buffer-based 阈值
- [x] getEffectiveContextWindowSize 函数返回 contextWindowSize - maxOutputTokens
- [x] getAutoCompactThreshold 函数返回 effectiveContextWindow - AUTOCOMPACT_BUFFER_TOKENS
- [x] calculateTokenWarningState 返回 percentLeft, isAboveWarningThreshold, isAboveErrorThreshold, isAboveAutoCompactThreshold, isAtBlockingLimit
- [x] 200k 模型的 auto-compact 阈值约为 167k tokens
- [x] context.ts 有对应的测试文件且测试通过

## TokenWarning 组件
- [x] 上下文超过警告阈值时显示 TokenWarning 横幅
- [x] auto-compact 启用时显示 "XX% until auto-compact"（dimmed 颜色）
- [x] auto-compact 禁用时显示 "Context low (XX% remaining) · /compact"（warning/error 颜色）
- [x] 上下文正常时不显示 TokenWarning

## 状态栏上下文显示
- [x] 移除 70%/90% 百分比颜色阈值逻辑
- [x] 使用 calculateTokenWarningState 决定颜色（正常 dimmed，warning 黄色，error 红色）
- [x] 状态栏显示格式与 CC 一致

## Auto-compact
- [x] POST /api/compact 端点可正常压缩对话
- [x] 上下文超出 auto-compact 阈值时自动触发压缩
- [x] 压缩后 token 计数重置
- [x] 连续失败 3 次后停止尝试（circuit breaker）
- [x] /compact 斜杠命令可手动触发压缩

## /context 命令增强
- [x] /context 输出包含 cacheCreationInputTokens 和 cacheReadInputTokens
- [x] /context 输出包含 "XX% until auto-compact" 信息

## 构建验证
- [x] npm run build 通过
- [x] npm run lint 无错误
