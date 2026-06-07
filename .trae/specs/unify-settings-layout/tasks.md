# Tasks

- [x] Task 1: 创建 `settings/layout.tsx` 共享布局
  - [x] 从 providers/page.tsx 提取侧边栏（导航项、返回按钮）
  - [x] 使用 `usePathname()` 高亮当前路由对应的导航项
  - [x] 右侧渲染 `{children}`
- [x] Task 2: 修改 `settings/page.tsx` 移除独立头部和全屏布局
  - [x] 移除顶部 header（返回按钮 + "Settings"标题）
  - [x] 移除外层 `min-h-screen` 容器
  - [x] 保留设置卡片内容
- [x] Task 3: 修改 `settings/providers/page.tsx` 移除内置侧边栏
  - [x] 移除左侧导航栏
  - [x] 移除外层 `flex min-h-screen` 容器
  - [x] 保留提供商管理内容
- [x] Task 4: 运行构建和 lint 验证

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 2 and Task 3
