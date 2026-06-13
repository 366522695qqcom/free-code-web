# Tasks — Trae 风格 UI 全面改造

## Task 1: 安装 framer-motion + 更新色彩体系
- [ ] SubTask 1.1: 安装 framer-motion 依赖 (`npm install framer-motion`)
- [ ] SubTask 1.2: 更新 `globals.css` 色彩变量为 Trae 深蓝灰色系
- [ ] SubTask 1.3: 更新 shadcn 兼容变量（primary → brand green 等）
- [ ] SubTask 1.4: 更新代码高亮色板适配新背景
- [ ] SubTask 1.5: 添加全局动画关键帧（fade-in, slide-up, scale-in, glow-pulse）
- [ ] SubTask 1.6: 验证 `npm run build` 通过

## Task 2: 登录页重设计（玻璃拟态 + 粒子效果）
- [ ] SubTask 2.1: 重写 `login/page.tsx`，使用深蓝灰渐变背景
- [ ] SubTask 2.2: 登录卡片改为玻璃拟态（backdrop-blur + 半透明）
- [ ] SubTask 2.3: 添加 CSS 粒子/网格背景动画
- [ ] SubTask 2.4: 输入框 focus 品牌绿辉光
- [ ] SubTask 2.5: 登录按钮品牌绿渐变 + hover 发光
- [ ] SubTask 2.6: 页面加载 fade-in 动画
- [ ] SubTask 2.7: 验证登录功能正常

## Task 3: 侧边栏重设计（Activity Bar + 会话面板）
- [ ] SubTask 3.1: 重写 `sidebar.tsx`，拆分为 Activity Bar（56px）+ 会话面板（224px）
- [ ] SubTask 3.2: Activity Bar 图标导航（聊天/设置/MCP/折叠）
- [ ] SubTask 3.3: 会话列表分组显示（今天/昨天/更早）
- [ ] SubTask 3.4: 会话项圆角 hover + 品牌绿左边框高亮
- [ ] SubTask 3.5: 折叠/展开宽度动画（framer-motion AnimatePresence）
- [ ] SubTask 3.6: 右键菜单重命名/删除带动画
- [ ] SubTask 3.7: 验证会话切换功能正常

## Task 4: Topbar 重设计
- [ ] SubTask 4.1: 移除 `useTheme` 引用和主题切换按钮
- [ ] SubTask 4.2: 模型选择器改为品牌绿样式
- [ ] SubTask 4.3: 流式状态指示器改为品牌绿脉冲点
- [ ] SubTask 4.4: 用户信息区域简化
- [ ] SubTask 4.5: 验证模型切换功能正常

## Task 5: 聊天输入区重设计
- [ ] SubTask 5.1: 移除终端 `>` 提示符，改为大圆角输入框（16px 圆角）
- [ ] SubTask 5.2: 添加品牌绿发送按钮（圆形）
- [ ] SubTask 5.3: 输入框 focus 品牌绿辉光
- [ ] SubTask 5.4: 快捷操作标签栏（输入框下方）
- [ ] SubTask 5.5: 状态栏保留但样式更新（品牌绿色调）
- [ ] SubTask 5.6: 斜杠命令菜单添加 framer-motion 弹出动画
- [ ] SubTask 5.7: 验证消息发送、斜杠命令、@文件引用功能正常

## Task 6: 消息气泡重设计 + 动画
- [ ] SubTask 6.1: 用户消息改为右对齐品牌绿气泡
- [ ] SubTask 6.2: 助手消息改为左对齐深色卡片 + 品牌绿左边框
- [ ] SubTask 6.3: 消息入场动画（framer-motion: slide-up + fade-in, spring）
- [ ] SubTask 6.4: 工具调用块可折叠 + 旋转展开动画
- [ ] SubTask 6.5: 思考块半透明背景 + 斜体
- [ ] SubTask 6.6: 流式响应打字机光标动画
- [ ] SubTask 6.7: 验证消息渲染和流式响应正常

## Task 7: 代码块现代化
- [ ] SubTask 7.1: 代码块顶部栏（语言标签 + 复制按钮）
- [ ] SubTask 7.2: 复制按钮点击反馈（✓ + "Copied!" 2秒恢复）
- [ ] SubTask 7.3: 长代码块自动折叠（>20行）+ 展开按钮
- [ ] SubTask 7.4: 代码块圆角 + 柔和阴影
- [ ] SubTask 7.5: 验证代码块渲染和复制功能

## Task 8: 设置页 + MCP 页 + Providers 页重设计
- [ ] SubTask 8.1: 设置页卡片添加柔和阴影 + hover 上浮动画
- [ ] SubTask 8.2: MCP 页样式更新
- [ ] SubTask 8.3: Providers 页卡片重设计（品牌绿边框高亮）
- [ ] SubTask 8.4: 页面切换 fade + slide 过渡
- [ ] SubTask 8.5: 验证所有设置页功能正常

## Task 9: 全局动画润色 + 响应式适配
- [ ] SubTask 9.1: 按钮全局 hover scale 微缩放（1.02x）
- [ ] SubTask 9.2: 卡片全局 hover 上浮 + 阴影增强
- [ ] SubTask 9.3: Toast 通知从右侧滑入动画
- [ ] SubTask 9.4: 下拉菜单 scale + fade 弹出动画
- [ ] SubTask 9.5: 移动端响应式适配（侧边栏自动折叠）
- [ ] SubTask 9.6: 验证 `npm run build` + `npm run lint` 通过

## Task 10: E2E 视觉验证
- [ ] SubTask 10.1: 用 agent-browser 截图验证登录页
- [ ] SubTask 10.2: 验证聊天页整体视觉效果
- [ ] SubTask 10.3: 验证侧边栏折叠/展开动画
- [ ] SubTask 10.4: 验证消息气泡和动画
- [ ] SubTask 10.5: 验证设置页视觉效果
- [ ] SubTask 10.6: 生成视觉对比报告

# Task Dependencies
- [Task 1] 是所有后续任务的前置
- [Task 2..8] 可并行执行（但建议按顺序：2→3→4→5→6→7→8）
- [Task 9] 依赖 [Task 2..8] 全部完成
- [Task 10] 依赖 [Task 9] 完成
