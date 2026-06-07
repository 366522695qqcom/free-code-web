# Tasks

- [x] Task 1: 修改前端 CustomModel 接口和渲染逻辑
  - [x] 将 `capabilities: string[]` 改为 `capabilities: { vision: boolean; reasoning: boolean; toolUse: boolean }`
  - [x] 将 `model.capabilities.map((cap) => ...)` 改为条件渲染每个属性
- [x] Task 2: 修改 handleAddSelectedModels 的 capabilities 参数
  - [x] 将 `capabilities: []` 改为 `capabilities: { vision: false, reasoning: false, toolUse: false }`
- [x] Task 3: 运行构建和 lint 验证

# Task Dependencies
- Task 2 depends on Task 1 (类型定义需先改)
- Task 3 depends on Task 1 and Task 2
