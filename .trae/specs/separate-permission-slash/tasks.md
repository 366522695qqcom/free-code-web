# Tasks

- [ ] Task 1: 定义斜杠命令列表数据结构
  - [ ] SubTask 1.1: 在 `chat-input.tsx` 中定义 `SlashCommand` 类型和 `SLASH_COMMANDS` 常量，包含命令名、描述、是否为子菜单等字段
  - [ ] SubTask 1.2: 命令列表包含 /clear、/compact、/context、/cost、/help、/model、/permissions、/review、/status、/tools

- [ ] Task 2: 重构 `/` 菜单为斜杠命令列表
  - [ ] SubTask 2.1: 将 `showModeMenu` 状态替换为 `showCommandMenu`，输入 `/` 弹出命令列表
  - [ ] SubTask 2.2: 实现模糊搜索过滤 — 根据用户输入的 `/xxx` 过滤命令列表
  - [ ] SubTask 2.3: 实现键盘导航 — ↑↓ 选择、Enter/Tab 确认、Esc 关闭
  - [ ] SubTask 2.4: 选择普通命令后填入 `/command ` 文本（不立即执行）
  - [ ] SubTask 2.5: 渲染命令列表 UI — 每个命令显示名称和简短描述

- [ ] Task 3: 实现 /permissions 子菜单
  - [ ] SubTask 3.1: 新增 `showPermissionSubmenu` 状态，选中 /permissions 后切换为权限分级子菜单
  - [ ] SubTask 3.2: 权限分级子菜单显示4个选项（default、plan、acceptEdits、bypassPermissions），含图标、核心行为、风险等级
  - [ ] SubTask 3.3: 当前模式高亮标记
  - [ ] SubTask 3.4: 键盘导航 — ↑↓ 选择、Enter 确认切换模式、Esc 返回命令列表
  - [ ] SubTask 3.5: 选择后切换权限模式，关闭菜单，清空输入框

- [ ] Task 4: 清理旧逻辑和更新提示文字
  - [ ] SubTask 4.1: 移除旧的 `showModeMenu` 与权限模式直接关联的代码
  - [ ] SubTask 4.2: 更新 placeholder 文字 — 从 "/ to switch mode" 改为 "/ for commands"
  - [ ] SubTask 4.3: 更新状态栏底部提示 — 从 "/ mode" 改为 "/ commands"

- [ ] Task 5: 构建验证
  - [ ] SubTask 5.1: `npm run build` 通过
  - [ ] SubTask 5.2: `npm run lint` 无错误

# Task Dependencies
- [Task 1] depends on nothing
- [Task 2] depends on [Task 1]（需要命令列表数据结构）
- [Task 3] depends on [Task 2]（需要命令菜单框架）
- [Task 4] depends on [Task 2, Task 3]（清理旧逻辑需要新功能就位）
- [Task 5] depends on [Task 1, Task 2, Task 3, Task 4]
