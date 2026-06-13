# Tasks — 全流程端到端测试

**测试时间**: 2026-06-13
**测试 URL**: https://mybiog.us.ci/
**测试工具**: agent-browser（如可用）或 curl + 手动验证

## Task 1: 环境准备
- [ ] SubTask 1.1: 确认 agent-browser 可用（`which agent-browser`），如不可用则用 curl 替代
- [ ] SubTask 1.2: 确认生产环境已部署最新 commit（`git log --oneline -1`）
- [ ] SubTask 1.3: 确认 `https://mybiog.us.ci/` 可访问

## Task 2: 登录流程验证
- [ ] SubTask 2.1: 访问 `/login`，验证深色主题（背景 `#1e1e1e`、登录按钮青色）
- [ ] SubTask 2.2: 输入 `admin / changeme`，点击登录
- [ ] SubTask 2.3: 验证跳转到 `/`，页面含 textarea 输入框

## Task 3: Provider 配置验证
- [ ] SubTask 3.1: 导航到 `/settings/providers`
- [ ] SubTask 3.2: 验证页面深色主题
- [ ] SubTask 3.3: 点击"添加 Provider"，填写表单（名称、Base URL、API Key）
- [ ] SubTask 3.4: 点击"测试连接"，验证连通性
- [ ] SubTask 3.5: 点击"拉取模型"，验证模型列表
- [ ] SubTask 3.6: 选择文字模型，保存 Provider
- [ ] SubTask 3.7: 验证 API Key 掩码显示（`***xxxx`）

## Task 4: 模型选择器验证
- [ ] SubTask 4.1: 返回聊天主页 `/`
- [ ] SubTask 4.2: 点击模型选择器
- [ ] SubTask 4.3: 验证只显示 chat 类型模型（无 image/embedding）

## Task 5: 聊天消息流式响应验证
- [ ] SubTask 5.1: 选择刚配置的模型
- [ ] SubTask 5.2: 发送"你好，请简单介绍一下你自己"
- [ ] SubTask 5.3: 验证流式响应正常（无 "ANTHROPIC_API_KEY" 错误）
- [ ] SubTask 5.4: 验证响应完成后消息显示完整
- [ ] SubTask 5.5: 用 curl 检查 `GET /api/sessions/[id]`，验证 messages 非空（持久化生效）

## Task 6: 会话切换验证
- [ ] SubTask 6.1: 点击"新建会话"，验证聊天区域清空
- [ ] SubTask 6.2: 发送"这是第二个会话的消息"
- [ ] SubTask 6.3: 等待响应完成
- [ ] SubTask 6.4: 点击侧边栏中的第一个会话
- [ ] SubTask 6.5: 验证第一个会话的消息完整显示（"你好"那条）
- [ ] SubTask 6.6: 切换回第二个会话
- [ ] SubTask 6.7: 验证第二个会话的消息完整显示

## Task 7: 实战创建项目
- [ ] SubTask 7.1: 发送"制作一个俄罗斯方块游戏，用单个 HTML 文件实现，包含完整的游戏逻辑"
- [ ] SubTask 7.2: 等待流式响应完成
- [ ] SubTask 7.3: 验证代码块语法高亮（关键字紫、字符串绿、数字橙、函数青、注释灰）
- [ ] SubTask 7.4: 提取代码块内容，保存为 HTML 文件
- [ ] SubTask 7.5: 验证 HTML 文件语法正确（`node -c` 或浏览器加载）

## Task 8: 全站深色主题验证
- [ ] SubTask 8.1: 访问 `/settings`，验证背景 `#1e1e1e`
- [ ] SubTask 8.2: 访问 `/settings/providers`，验证背景 `#1e1e1e`
- [ ] SubTask 8.3: 访问 `/mcp`，验证背景 `#1e1e1e`
- [ ] SubTask 8.4: 返回 `/`，验证背景 `#1e1e1e`

## Task 9: 删除会话验证
- [ ] SubTask 9.1: 删除一个会话
- [ ] SubTask 9.2: 验证侧边栏不再显示该会话
- [ ] SubTask 9.3: 如删除的是当前会话，验证聊天区域清空

## Task 10: 生成测试报告
- [ ] SubTask 10.1: 汇总所有验证结果
- [ ] SubTask 10.2: 记录失败项（如有）
- [ ] SubTask 10.3: 更新 spec/checklist

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 2]
- [Task 4] depends on [Task 3]
- [Task 5] depends on [Task 4]
- [Task 6] depends on [Task 5]
- [Task 7] depends on [Task 5]
- [Task 8] depends on [Task 2]
- [Task 9] depends on [Task 6]
- [Task 10] depends on [Task 1..9]
