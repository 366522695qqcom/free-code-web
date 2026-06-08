# Tasks

- [x] Task 1: 修复 streamAnthropic 空 key 防护
  - [x] 1.1 在 `new Anthropic({ apiKey })` 前检查 apiKey 非空
  - [x] 1.2 空值时返回友好错误并提前退出

- [x] Task 2: 修复 createQueryEngine 空 key 防护
  - [x] 2.1 在 `new Anthropic({ apiKey })` 前检查 apiKey 非空
  - [x] 2.2 空值时返回友好错误并提前退出
  - [x] 2.3 移除重复的外层 apiKey 声明

- [x] Task 3: 验证构建和 lint
  - [x] 3.1 npm run build 通过
  - [x] 3.2 npm run lint 通过

# Task Dependencies
- Task 1 and Task 2 are independent
- Task 3 depends on Task 1 and Task 2