# Tasks

- [ ] Task 1: 在输入框左侧添加权限模式独立按钮
  - [ ] SubTask 1.1: 修改 `chat-input.tsx` — 在 `>` 提示符旁添加权限模式按钮，显示当前模式的图标和短标签，点击弹出下拉菜单
  - [ ] SubTask 1.2: 实现权限模式下拉菜单 — 复用现有 `MODE_OPTIONS` 数据，支持键盘导航（↑↓ 选择、Enter 确认、Esc 关闭）
  - [ ] SubTask 1.3: 按钮颜色根据风险等级变化（default=绿、plan=青、acceptEdits=黄、bypassPermissions=红）

- [ ] Task 2: 实现 CC 风格斜杠命令菜单
  - [ ] SubTask 2.1: 定义斜杠命令列表数据结构 — 包含命令名、描述、别名等字段，参考 CC 的命令体系
  - [ ] SubTask 2.2: 修改 `/` 触发逻辑 — 输入 `/` 弹出斜杠命令菜单而非权限模式菜单，替换 `showModeMenu` 为 `showCommandMenu`
  - [ ] SubTask 2.3: 实现模糊搜索过滤 — 根据用户输入的 `/xxx` 过滤命令列表
  - [ ] SubTask 2.4: 实现键盘导航 — ↑↓ 选择、Enter/Tab 确认、Esc 关闭
  - [ ] SubTask 2.5: 选择命令后填入文本 — 选择命令后输入框填入 `/command ` 而非立即执行，用户可补充参数

- [ ] Task 3: 清理旧逻辑和更新提示文字
  - [ ] SubTask 3.1: 移除旧的权限模式菜单逻辑 — 删除 `showModeMenu` 与权限模式的关联代码
  - [ ] SubTask 3.2: 更新 placeholder 文字 — 从 "/ to switch mode" 改为 "/ for commands"
  - [ ] SubTask 3.3: 更新状态栏底部提示 — 从 "/ mode" 改为 "/ commands"

- [ ] Task 4: 构建验证
  - [ ] SubTask 4.1: `npm run build` 通过
  - [ ] SubTask 4.2: `npm run lint` 无错误

# Task Dependencies
- [Task 1] depends on nothing
- [Task 2] depends on nothing
- [Task 3] depends on [Task 1, Task 2]（清理旧逻辑需要新功能就位）
- [Task 4] depends on [Task 1, Task 2, Task 3]
