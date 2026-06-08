# Tasks

- [x] Task 1: 修改后端 agent-stream.ts 支持自定义提供商路由
  - [x] 1.1 在 AgenticStreamOptions 中添加 customBaseUrl/customApiKey/customApiPath 字段
  - [x] 1.2 在 createAgenticStream 中，当有 customBaseUrl 时直接走 runOpenAILoop
  - [x] 1.3 当有自定义提供商配置时，走 runOpenAILoop 并传入自定义 baseUrl/apiKey
  - [x] 1.4 在 runAnthropicLoop 中，当 apiKey 为空时提前返回友好错误

- [x] Task 2: 修改 /api/chat 路由传递提供商信息
  - [x] 2.1 从请求体中提取 customBaseUrl/customApiKey/customApiPath
  - [x] 2.2 传递给 createAgenticStream

- [x] Task 3: 修改前端传递当前模型的提供商信息
  - [x] 3.1 在 chat-layout.tsx 中维护 modelProviderMap 和 customProviderInfo 状态
  - [x] 3.2 在 use-chat.ts sendMessage 中传递 customProvider
  - [x] 3.3 当选择自定义模型时，同时设置对应的 providerInfo

- [x] Task 4: 验证构建和测试
  - [x] 4.1 npm run build 通过
  - [x] 4.2 npm run lint 通过

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 2
- Task 4 depends on Task 1, Task 2, Task 3
