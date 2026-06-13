# 全流程端到端测试 Spec：从创建 API Key 到实战创建项目

## Why
近期对 web 端做了多项修复（统一深色主题、会话切换、消息持久化、customApiKey 修复），需要一次完整端到端测试验证整个用户旅程：从登录 → 配置 Provider/API Key → 选择模型 → 发送消息 → 流式响应 → 会话切换 → 实战创建项目（如俄罗斯方块）。

## What Changes
- 无代码改动
- 纯测试/验证 spec
- 在生产 `https://mybiog.us.ci/` 上做端到端验证
- 覆盖近期所有修复点的回归测试

**BREAKING**: 无

## Impact
- **Affected specs**:
  - `unified-dark-ui-redesign`（验证深色主题统一）
  - `fix-session-switching`（验证会话切换 + 消息持久化）
  - `fix-custom-model-chat-auth`（验证 customApiKey 修复）
- **Affected code**: 无（只测试，不改代码）
- **测试目标**: 生产环境 `https://mybiog.us.ci/`

## 测试前置条件
- 生产环境 `https://mybiog.us.ci/` 已部署最新 commit
- 默认登录凭据 `admin / changeme`
- 需要一个可用的 LLM API Key（用户自行提供，如 Anthropic / OpenAI / 第三方代理）

## ADDED Requirements

### Requirement: 登录流程验证
系统 SHALL 允许用户通过 `/login` 页面登录，登录后跳转到聊天主页。

#### Scenario: 登录成功
- **WHEN** 用户访问 `https://mybiog.us.ci/login` 并输入 `admin / changeme`
- **THEN** 跳转到 `https://mybiog.us.ci/`，页面显示聊天输入框

#### Scenario: 登录页深色主题
- **WHEN** 登录页加载
- **THEN** 背景为 `#1e1e1e`，登录按钮为青色 `#c0e0e0`

### Requirement: Provider 配置流程验证
系统 SHALL 允许用户在 `/settings/providers` 页面添加自定义 Provider（含 API Key），并通过连通性测试。

#### Scenario: 添加 Provider
- **WHEN** 用户导航到 `/settings/providers`，填写 Provider 名称、Base URL、API Key，点击"测试连接"
- **THEN** 连接状态显示"已连接"，可拉取模型列表

#### Scenario: API Key 显示掩码
- **WHEN** Provider 列表加载
- **THEN** API Key 只显示后 4 位（`***xxxx`），不暴露完整 key

#### Scenario: 拉取并选择模型
- **WHEN** 连接成功后点击"拉取模型"
- **THEN** 显示可用模型列表，用户可选择文字模型添加

### Requirement: 模型选择器验证
系统 SHALL 在聊天主页的模型选择器中只显示文字模型（过滤 image/embedding）。

#### Scenario: 模型选择器过滤
- **WHEN** 用户在聊天主页点击模型选择器
- **THEN** 只显示 chat 类型模型，不显示 image/embedding 模型

### Requirement: 聊天消息流式响应验证
系统 SHALL 使用自定义 Provider 的 API Key 成功发送消息并接收流式响应。

#### Scenario: 发送消息并收到响应
- **WHEN** 用户在聊天输入框输入消息并发送
- **THEN** 消息以 SSE 流式返回，UI 逐字显示助手回复
- **THEN** 流式完成后，消息被持久化到后端（PATCH /api/sessions/[id]）

#### Scenario: customApiKey 生效
- **WHEN** 用户使用自定义 Provider 的模型发送消息
- **THEN** 不出现 "ANTHROPIC_API_KEY is not configured" 错误
- **THEN** 消息正常流式返回

### Requirement: 会话切换验证
系统 SHALL 允许用户在侧边栏点击历史会话，切换后正确加载该会话的消息。

#### Scenario: 切换到已有会话
- **WHEN** 用户在侧边栏点击一个已有消息的历史会话
- **THEN** 聊天区域清空旧消息，显示该会话的历史消息
- **THEN** 不残留上一个会话的消息

#### Scenario: 切换回原会话
- **WHEN** 用户从会话 B 切换回会话 A
- **THEN** 会话 A 的消息完整显示（包括之前发送和收到的所有消息）

### Requirement: 实战创建项目验证
系统 SHALL 能够通过聊天让 LLM 生成一个可运行的完整项目（如俄罗斯方块游戏）。

#### Scenario: 生成俄罗斯方块
- **WHEN** 用户发送"制作一个俄罗斯方块游戏"
- **THEN** LLM 流式返回完整的 HTML/JS 代码
- **THEN** 代码块语法高亮正确（关键字紫、字符串绿、数字橙、函数青、注释灰）
- **THEN** 代码可复制并在浏览器中运行

### Requirement: 深色主题全站一致性验证
系统 SHALL 在所有页面保持统一的深色主题。

#### Scenario: 跨页面主题一致
- **WHEN** 用户依次访问 `/login` → `/` → `/settings` → `/settings/providers` → `/mcp`
- **THEN** 所有页面背景统一为 `#1e1e1e`，无亮色闪烁

### Requirement: 新建会话验证
系统 SHALL 允许用户创建新会话，新会话消息为空。

#### Scenario: 新建会话
- **WHEN** 用户点击侧边栏"新建会话"按钮
- **THEN** 创建一个新会话，聊天区域清空
- **THEN** 新会话出现在侧边栏顶部

### Requirement: 删除会话验证
系统 SHALL 允许用户删除会话，删除后侧边栏不再显示该会话。

#### Scenario: 删除会话
- **WHEN** 用户点击会话项的删除按钮
- **THEN** 该会话从侧边栏消失
- **THEN** 如果删除的是当前会话，聊天区域清空

## 测试步骤（按执行顺序）

### Phase 1: 登录
1. 打开 `https://mybiog.us.ci/login`
2. 验证深色主题
3. 输入 `admin / changeme`，点击登录
4. 验证跳转到聊天主页

### Phase 2: 配置 Provider
5. 导航到 `/settings/providers`
6. 点击"添加 Provider"
7. 填写名称、Base URL、API Key
8. 点击"测试连接" → 验证成功
9. 点击"拉取模型" → 验证模型列表
10. 选择文字模型，保存
11. 验证 API Key 掩码显示

### Phase 3: 聊天测试
12. 返回聊天主页
13. 在模型选择器选择刚配置的模型
14. 发送"你好，请简单介绍一下你自己"
15. 验证流式响应正常（无 ANTHROPIC_API_KEY 错误）
16. 等待响应完成

### Phase 4: 会话切换
17. 点击"新建会话"
18. 验证聊天区域清空
19. 发送另一条消息
20. 点击侧边栏中的旧会话
21. 验证旧会话消息完整显示
22. 切换回新会话
23. 验证新会话消息完整显示

### Phase 5: 实战创建项目
24. 发送"制作一个俄罗斯方块游戏，用单个 HTML 文件实现，包含完整的游戏逻辑"
25. 等待流式响应完成
26. 验证代码块语法高亮
27. 复制代码，保存为 HTML 文件
28. 验证 HTML 文件可在浏览器中运行

### Phase 6: 全站主题验证
29. 依次访问 `/settings`、`/settings/providers`、`/mcp`
30. 验证所有页面背景统一 `#1e1e1e`

### Phase 7: 删除会话
31. 删除一个会话
32. 验证侧边栏更新

## 验证标准
1. 所有 Phase 的验证点均通过
2. 无 JavaScript 控制台错误（除已知 warning）
3. 流式响应无中断
4. 会话切换无消息残留/丢失
5. 代码块高亮颜色正确
6. 全站主题一致
