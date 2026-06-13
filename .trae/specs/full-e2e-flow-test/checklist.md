# Checklist — 全流程端到端测试

## Phase 1: 环境准备
- [x] agent-browser 可用或 curl 替代方案就绪
- [x] 生产环境已部署最新 commit
- [x] `https://mybiog.us.ci/` 可访问

## Phase 2: 登录
- [x] `/login` 深色主题（背景 `#1e1e1e`）
- [x] 登录按钮青色
- [x] 输入 `admin / changeme` 后成功跳转到 `/`
- [x] 聊天主页含 textarea 输入框

## Phase 3: Provider 配置
- [x] `/settings/providers` 深色主题
- [x] 添加 Provider 表单可填写
- [x] 测试连接成功
- [x] 拉取模型列表成功
- [x] 保存 Provider 成功
- [x] API Key 掩码显示 `***xxxx`

## Phase 4: 模型选择器
- [x] 模型选择器只显示 chat 类型模型
- [x] 无 image/embedding 模型

## Phase 5: 聊天消息
- [x] 选择自定义模型后发送消息
- [x] 无 "ANTHROPIC_API_KEY is not configured" 错误
- [x] 流式响应正常显示
- [x] 响应完成后消息完整
- [x] `GET /api/sessions/[id]` 返回 messages 非空（持久化生效）

## Phase 6: 会话切换
- [x] 新建会话后聊天区域清空
- [x] 新会话发送消息后响应正常
- [x] 切换到旧会话，旧消息完整显示
- [x] 切换回新会话，新消息完整显示
- [x] 无消息残留/混合

## Phase 7: 实战创建项目
- [x] 发送"制作俄罗斯方块"后流式响应正常
- [x] 代码块语法高亮正确（紫/绿/橙/青/灰）
- [x] 代码可提取保存为 HTML
- [x] HTML 文件可运行（30790 字节、848 行、含完整游戏逻辑）

## Phase 8: 全站深色主题
- [x] `/settings` 背景 `#1e1e1e`
- [x] `/settings/providers` 背景 `#1e1e1e`
- [x] `/mcp` 背景 `#1e1e1e`
- [x] `/` 背景 `#1e1e1e`

## Phase 9: 删除会话
- [x] 删除会话后侧边栏更新
- [x] 删除当前会话后聊天区域清空

## 近期修复回归
- [x] customApiKey 修复生效（无 ANTHROPIC_API_KEY 错误）
- [x] 消息持久化修复生效（切换后消息不丢失）
- [x] 会话切换修复生效（无残留/闪烁）
- [x] 深色主题统一（全站一致）

## 测试中发现并修复的 Bug
- [x] `resolvedBaseUrl` 变量已计算但未传递给 `createAgenticStream`（route.ts 第 54 行）
- [x] `persistMessages` 发送的消息缺少 `id` 字段
- [x] `handleSelectSession` 中 `contentBlocks` 映射错误（`data.messages.map` → `msg.content.map`）
- [x] `testProviderConnection` 使用硬编码 `gpt-4o-mini` 模型
- [x] `fetchProviderModels` 未对含路径的 `baseUrl` 做归一化处理
- [x] 设置页面 `useTheme` 引用已移除的 `ThemeProvider` 导致崩溃
