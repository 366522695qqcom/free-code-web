# Tasks

- [x] Task 1: 修改 `/model` 命令为有子菜单，并添加模型选择子菜单 UI
  - [x] 将 `SLASH_COMMANDS` 中 `/model` 的 `hasSubmenu` 改为 `true`
  - [x] 在 `ChatInput` 中添加模型子菜单状态（`showModelSubmenu`、模型列表 prop）
  - [x] 添加模型子菜单 UI 渲染（类似权限子菜单风格）
  - [x] 添加模型子菜单键盘导航（上下键、Enter/Tab 选择、Esc 返回）
- [x] Task 2: 修改 `ChatLayout` 传递模型列表给 `ChatInput`
  - [x] 将 `allModels` 作为 prop 传给 `ChatInput`
  - [x] 处理模型选择回调（`onModelSelect`），切换模型并关闭菜单
- [x] Task 3: 修复 `refreshCustomModels` 中 capabilities 类型兼容
  - [x] 将对象格式的 capabilities 转换为字符串数组
  - [x] 更新 `ModelOption.capabilities` 类型定义
- [x] Task 4: 运行构建和 lint 验证

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 is independent (can parallel with Task 1 and 2)
- Task 4 depends on Task 1, 2, and 3
