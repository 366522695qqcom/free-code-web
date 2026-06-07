# Tasks

- [x] Task 1: 编写 `extractBaseUrl` 工具函数的单元测试（TDD — 先写测试）
  - [x] 测试用例：baseUrl 包含 apiPath 时正确剥离（如 `https://apihub.agnes-ai.com/v1/chat/completions` + `/chat/completions` → `https://apihub.agnes-ai.com/v1`）
  - [x] 测试用例：baseUrl 不包含 apiPath 时保持不变
  - [x] 测试用例：baseUrl 末尾有斜杠时正确处理
  - [x] 测试用例：apiPath 为空时保持不变
  - [x] 测试用例：baseUrl 末尾无斜杠、apiPath 前面有斜杠时正确匹配
- [x] Task 2: 实现 `extractBaseUrl` 工具函数，使测试通过
- [x] Task 3: 修改 `fetchProviderModels` 使用 `extractBaseUrl`，并添加 apiPath 参数
  - [x] 更新函数签名，添加可选 `apiPath` 参数
  - [x] 使用 `extractBaseUrl(baseUrl, apiPath)` 获取基础 URL
  - [x] 在基础 URL 后拼接 `/models`
- [x] Task 4: 修改 `testProviderConnection` 使用 `extractBaseUrl`
  - [x] `/models` 路径使用 `extractBaseUrl(baseUrl, apiPath)` 的结果
  - [x] chat completion 路径使用 `extractBaseUrl(baseUrl, apiPath)` + apiPath
- [x] Task 5: 更新调用方传入 apiPath 参数
  - [x] `web/src/app/api/providers/[id]/models/route.ts`：传入 `provider.apiPath`
  - [x] `web/src/app/api/providers/[id]/test/route.ts`：已传入 `provider.apiPath`（确认无需修改）
- [x] Task 6: 运行构建和测试验证

# Task Dependencies
- Task 2 depends on Task 1 (TDD: 先写测试再实现)
- Task 3 depends on Task 2
- Task 4 depends on Task 2
- Task 5 depends on Task 3 and Task 4
- Task 6 depends on Task 5
