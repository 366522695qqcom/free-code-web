# Tasks

- [x] Task 1: 启动 agent-browser 并登录线上环境
  - [x] 1.1 访问 https://mybiog.us.ci/login
  - [x] 1.2 输入凭据并登录
  - [x] 1.3 验证跳转到主页

- [x] Task 2: 测试创建模型提供商
  - [x] 2.1 导航到设置 > 模型提供商页面
  - [x] 2.2 填写 API key（sk-zvqvDgjRAYtQ38XlbKCh5inpMHgOSadRBnX5atg6qOO5Wc3A）和地址（https://apihub.agnes-ai.com/v1/chat/completions）
  - [x] 2.3 点击保存
  - [x] 2.4 验证提供商出现在列表中

- [x] Task 3: 测试获取模型列表
  - [x] 3.1 点击提供商的"获取模型"按钮
  - [x] 3.2 验证模型列表正确显示

- [x] Task 4: 测试添加模型
  - [x] 4.1 选择模型并添加
  - [x] 4.2 验证模型出现在已添加列表

- [x] Task 5: 测试防止重复添加
  - [x] 5.1 再次尝试添加相同模型
  - [x] 5.2 验证不会出现重复条目

- [x] Task 6: 测试 /model 斜杠命令
  - [x] 6.1 在聊天框输入 /model
  - [x] 6.2 验证显示模型子菜单
  - [x] 6.3 使用键盘选择模型

- [x] Task 7: 测试设置页面布局一致性
  - [x] 7.1 在设置页面不同子页面间切换
  - [x] 7.2 验证布局无突变

- [x] Task 8: 测试删除模型提供商
  - [x] 8.1 删除已创建的提供商
  - [x] 8.2 验证提供商从列表移除

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 2
- Task 4 depends on Task 3
- Task 5 depends on Task 4
- Task 6 depends on Task 4
- Task 7 depends on Task 1
- Task 8 depends on Task 2
