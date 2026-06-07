# 全流程 E2E 测试 Spec

## Why
之前修复了多个 bug（API 返回格式、模型获取 URL、capabilities 类型、重复添加模型、设置页面布局、/model 子菜单、聊天框输入），需要通过 agent-browser 在线上环境 https://mybiog.us.ci/ 进行全流程验证，确保所有修复正常工作。

## What Changes
- 使用 agent-browser 自动化测试以下流程：
  - 登录
  - 创建模型提供商（测试 API key + 地址）
  - 获取模型列表
  - 添加模型
  - 防止重复添加验证
  - /model 斜杠命令选择模型
  - 设置页面布局切换（不突变）
  - 删除模型提供商

## Impact
- Affected specs: fix-provider-api-mismatch, fix-provider-models-fetch, fix-capabilities-type-mismatch, unify-settings-layout, fix-model-slash-command
- Affected code: 无代码变更，纯测试验证

## ADDED Requirements

### Requirement: 全流程 E2E 测试
系统 SHALL 通过 agent-browser 在线上环境完成以下测试场景：

#### Scenario: 登录成功
- **WHEN** 用户访问 https://mybiog.us.ci/login 并输入凭据
- **THEN** 成功跳转到主页

#### Scenario: 创建模型提供商
- **WHEN** 用户在设置页面添加模型提供商（API key + 地址）
- **THEN** 提供商成功保存并显示在列表中

#### Scenario: 获取模型列表
- **WHEN** 用户点击提供商的"获取模型"按钮
- **THEN** 模型列表正确显示

#### Scenario: 添加模型
- **WHEN** 用户选择模型并点击添加
- **THEN** 模型成功添加到列表

#### Scenario: 防止重复添加
- **WHEN** 用户尝试添加已存在的模型
- **THEN** 系统跳过重复模型，不报错

#### Scenario: /model 斜杠命令
- **WHEN** 用户在聊天框输入 /model
- **THEN** 显示模型子菜单，可选择模型

#### Scenario: 设置页面布局一致性
- **WHEN** 用户在设置页面不同子页面间切换
- **THEN** 布局保持一致，无突变

#### Scenario: 删除模型提供商
- **WHEN** 用户删除一个模型提供商
- **THEN** 提供商从列表中移除
