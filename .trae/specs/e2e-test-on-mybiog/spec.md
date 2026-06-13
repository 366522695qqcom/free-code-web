# mybiog.us.ci 自定义模型端到端测试 Spec

## Why
之前在 `mybiog.us.ci` 部署了 web 端 + 部署了用户提供的自定义模型 Provider。本次目标：用 `agent-browser` 在生产域名上执行完整 chat 端到端测试，发送「制作一个俄罗斯方块游戏」，验证：
1. 生产环境登录/认证流程
2. 自定义 provider/model 已正确配置
3. Chat 模型选择器只显示文字模型（过滤 image/embedding — 关联 `filter-image-models-from-input` spec）
4. Chat 消息能成功流式响应
5. LLM 能产出可执行的俄罗斯方块游戏代码

## What Changes
- 无代码改动
- 纯测试 / 验证 spec
- 在生产 `https://mybiog.us.ci/` 上做端到端验证

**BREAKING**: 无

## Impact
- **Affected specs**:
  - `filter-image-models-from-input`（间接：验证 isTextModel 过滤在生产生效）
- **Affected code**: 无（只测试，不改代码）
- **测试目标**: 生产环境 `https://mybiog.us.ci/`

## 假设（已与用户澄清）
- 用户在 mybiog.us.ci 上已配置好一个**自定义 provider + 文字模型**（之前提供过）
- 用户在 mybiog.us.ci 上可能也配置了 image / embedding 模型用于测试 isTextModel 过滤
- 默认登录凭据 `admin / changeme`（Vercel 部署默认）

## ADDED Requirements

### Requirement: 登录生产环境
测试 SHALL 在 `https://mybiog.us.ci/login` 完成认证流程，使用部署默认凭据 `admin / changeme`。

#### Scenario: 登录成功
- **WHEN** 在 `https://mybiog.us.ci/login` 输入 `admin` / `changeme` 并点击 Sign in
- **THEN** 跳转到 `https://mybiog.us.ci/`，显示 chat 主页

#### Scenario: Cookie 持久化
- **WHEN** 登录成功后刷新页面
- **THEN** 不需要重新登录（session cookie 有效）

### Requirement: 自定义 Provider 已配置
测试 SHALL 验证 `https://mybiog.us.ci/settings/providers` 显示用户提供的自定义 provider + 至少一个文字模型。

#### Scenario: 自定义 provider 存在
- **WHEN** 访问 `https://mybiog.us.ci/settings/providers`
- **THEN** Provider 列表中至少有一个用户自定义的 provider（非 "Anthropic 默认"）

#### Scenario: 至少一个文字模型
- **WHEN** Provider 详情展开
- **THEN** 至少有一个 `modelType: "chat"` 的模型

### Requirement: Chat 模型选择器只显示文字模型
测试 SHALL 验证 `https://mybiog.us.ci/` 主页面上的模型选择器（topbar 下拉 + `/模型` 子菜单）只列出 `modelType: "chat"` 的模型，image / embedding 模型被过滤。

#### Scenario: topbar 下拉只显示文字模型
- **WHEN** 点击 topbar 模型下拉
- **THEN** 下拉中**只**显示 modelType=chat 的模型，不出现 image/embedding 模型

#### Scenario: /模型 子菜单只显示文字模型
- **WHEN** 在 chat 输入框输入 `/模型`
- **THEN** 子菜单**只**显示文字模型

#### Scenario: 空态提示
- **WHEN** 用户没有可用文字模型
- **THEN** 选择器显示"还没有文字模型，请先在模型提供商添加 chat 类型模型"

### Requirement: Chat 消息发送 + 流式响应
测试 SHALL 验证在 chat 输入框发送「制作一个俄罗斯方块游戏」后，能成功流式接收到响应。

#### Scenario: 发送消息
- **WHEN** 在 textarea 输入「制作一个俄罗斯方块游戏」并按 Enter
- **THEN** 用户消息出现在聊天区，并显示 streaming 状态

#### Scenario: 流式响应
- **WHEN** LLM 在 streaming
- **THEN** 聊天区逐字出现 assistant 回复文本

#### Scenario: 工具调用
- **WHEN** LLM 决定调用工具（write / bash 等）
- **THEN** 聊天区显示 tool_use 块 + tool_result 块

#### Scenario: 完整响应
- **WHEN** LLM 完成响应
- **THEN** assistant 消息完整显示，包含可用的代码（HTML/JS/Canvas 等）

### Requirement: 工具确认 + 自动执行
测试 SHALL 验证 `permissionMode` 切换到 `bypassPermissions` 或 `acceptEdits` 时，高风险工具调用能自动批准。

#### Scenario: bypassPermissions 模式
- **WHEN** 在 `/权限` 菜单选择 `bypassPermissions`
- **THEN** 工具调用直接执行，无确认弹窗

#### Scenario: 工具实际执行
- **WHEN** LLM 调用 `write` 工具写文件
- **THEN** 文件被实际写入（可通过 `/api/files/content?path=...` 验证）

### Requirement: 俄罗斯方块游戏生成
测试 SHALL 验证最终 LLM 输出包含「俄罗斯方块游戏」相关的可执行代码。

#### Scenario: 包含游戏代码
- **WHEN** LLM 完成响应
- **THEN** 响应中包含 HTML/JS/Canvas 等实现游戏的代码片段

#### Scenario: 代码逻辑完整
- **WHEN** 检查响应内容
- **THEN** 包含：方块生成 / 移动 / 旋转 / 碰撞检测 / 行消除 / 得分 等核心要素

## MODIFIED Requirements
无

## REMOVED Requirements
无

## 验证标准
1. `agent-browser open https://mybiog.us.ci/login` 成功打开登录页
2. 凭据 `admin / changeme` 登录成功
3. 主页加载，显示 chat 输入框
4. 自定义 Provider 在 `/settings/providers` 可见
5. Chat 模型选择器只显示文字模型（image/embedding 被过滤）
6. 发送「制作一个俄罗斯方块游戏」消息成功
7. 流式响应正常输出文本
8. 工具调用（如 write）正常执行
9. 最终响应包含可执行的俄罗斯方块游戏代码
10. 全部步骤截图保存到 `/tmp/mybiog-e2e-*.png`

## 不做的事
- 不修改 web 端代码（只测试）
- 不修改数据库
- 不部署新版本
- 不改 mybiog.us.ci 配置
- 不引新依赖
- 不写新代码

## 已知风险 / 限制
1. **agent-browser 需要 Chrome**：沙箱里 Chromium 下载很慢（之前测试 175MB 超时）。可能需要重试或等更长时间。
2. **生产环境凭据**：如果 `admin / changeme` 不是当前 Vercel 部署的密码，会登录失败。
3. **自定义 Provider 存在性**：依赖用户在 mybiog.us.ci 已添加 provider。如果生产环境未配置，需要先添加。
4. **真实 LLM 调用**：需要 ANTHROPIC_API_KEY 在生产环境正确配置，否则 LLM 调用会失败。
