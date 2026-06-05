# Checklist

## 项目脚手架
- [x] Next.js 项目可正常启动（`npm run dev`）
- [x] Tailwind CSS 样式生效
- [x] Vercel 部署配置正确（vercel.json 存在且格式正确）
- [x] 运行时特性开关系统可用（环境变量控制功能开关）
- [x] SSE 流式通信基础设施可用

## 后端核心
- [x] /api/chat 端点可流式返回 LLM 响应
- [x] 支持至少 2 个模型提供商（Anthropic + OpenAI）
- [x] 会话 CRUD API 全部可用（创建/读取/更新/删除）
- [x] 用户认证可用（环境变量用户名密码 + httpOnly cookie 登录）
- [x] 未认证访问被拦截（返回 401 或重定向到登录页）
- [x] API Key 在前端不可见（仅存储在服务端环境变量）

## 工具执行
- [x] BashTool 可在服务端执行并返回结果
- [x] FileEditTool 可在服务端编辑文件
- [x] FileReadTool 可在服务端读取文件
- [x] FileWriteTool 可在服务端写入文件
- [x] GlobTool/GrepTool 可在服务端搜索
- [x] WebFetchTool/WebSearchTool 可在服务端运行
- [x] 工具权限确认流程完整（请求 → 确认 → 执行 → 结果）

## 前端核心 UI
- [x] 主布局正确显示（侧边栏 + 聊天区域）
- [x] 消息列表支持自动滚动和流式追加
- [x] 流式消息实时追加显示
- [x] 所有消息类型正确渲染（用户/助手/工具/思考）
- [x] Markdown 渲染正确（标题/列表/代码块/表格）
- [x] 代码高亮正常工作
- [x] 输入框支持多行输入和发送

## 前端交互
- [x] 工具权限确认弹窗正常工作
- [x] 工具执行状态实时显示
- [x] Bash 输出以终端风格显示（ANSI 颜色渲染）
- [x] 文件编辑差异以 diff 视图显示
- [x] 成本追踪信息正确显示

## 辅助功能
- [x] 会话管理完整（新建/切换/删除/重命名 + 搜索过滤）
- [x] 斜杠命令系统可用（/help, /clear, /compact, /model, /cost, /tools）
- [x] 设置页面可用（模型选择、主题切换、工具权限）
- [x] 暗色/亮色主题切换正常（dark/light/system）
- [x] 模型选择器可用（按提供商分组 + 能力标签）

## MCP 集成
- [x] MCP 服务器管理 API 可用（CRUD + 连接/断开）
- [x] MCP 资源浏览 UI 可用
- [x] MCP 工具注册到工具系统

## 部署
- [x] 构建通过（npm run build 成功）
- [x] Lint 通过（npm run lint 零错误零警告）
- [x] 环境变量配置模板完整（.env.example）
- [x] Vercel 部署配置就绪（vercel.json）
