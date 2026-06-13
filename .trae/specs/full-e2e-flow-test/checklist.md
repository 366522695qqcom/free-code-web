# Checklist — 全流程端到端测试

## Phase 1: 环境准备
- [ ] agent-browser 可用或 curl 替代方案就绪
- [ ] 生产环境已部署最新 commit
- [ ] `https://mybiog.us.ci/` 可访问

## Phase 2: 登录
- [ ] `/login` 深色主题（背景 `#1e1e1e`）
- [ ] 登录按钮青色
- [ ] 输入 `admin / changeme` 后成功跳转到 `/`
- [ ] 聊天主页含 textarea 输入框

## Phase 3: Provider 配置
- [ ] `/settings/providers` 深色主题
- [ ] 添加 Provider 表单可填写
- [ ] 测试连接成功
- [ ] 拉取模型列表成功
- [ ] 保存 Provider 成功
- [ ] API Key 掩码显示 `***xxxx`

## Phase 4: 模型选择器
- [ ] 模型选择器只显示 chat 类型模型
- [ ] 无 image/embedding 模型

## Phase 5: 聊天消息
- [ ] 选择自定义模型后发送消息
- [ ] 无 "ANTHROPIC_API_KEY is not configured" 错误
- [ ] 流式响应正常显示
- [ ] 响应完成后消息完整
- [ ] `GET /api/sessions/[id]` 返回 messages 非空（持久化生效）

## Phase 6: 会话切换
- [ ] 新建会话后聊天区域清空
- [ ] 新会话发送消息后响应正常
- [ ] 切换到旧会话，旧消息完整显示
- [ ] 切换回新会话，新消息完整显示
- [ ] 无消息残留/混合

## Phase 7: 实战创建项目
- [ ] 发送"制作俄罗斯方块"后流式响应正常
- [ ] 代码块语法高亮正确（紫/绿/橙/青/灰）
- [ ] 代码可提取保存为 HTML
- [ ] HTML 文件可运行

## Phase 8: 全站深色主题
- [ ] `/settings` 背景 `#1e1e1e`
- [ ] `/settings/providers` 背景 `#1e1e1e`
- [ ] `/mcp` 背景 `#1e1e1e`
- [ ] `/` 背景 `#1e1e1e`

## Phase 9: 删除会话
- [ ] 删除会话后侧边栏更新
- [ ] 删除当前会话后聊天区域清空

## 近期修复回归
- [ ] customApiKey 修复生效（无 ANTHROPIC_API_KEY 错误）
- [ ] 消息持久化修复生效（切换后消息不丢失）
- [ ] 会话切换修复生效（无残留/闪烁）
- [ ] 深色主题统一（全站一致）
