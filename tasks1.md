# Tasks

本 spec 为纯审计任务，不修改代码。任务列表为审计流程步骤。

- [x] Task 1: 梳理代码库架构 — 入口点、信任边界、数据流
  - [x] 审查中间件和认证系统（middleware.ts, auth.ts）
  - [x] 审查所有 API 路由处理器
  - [x] 审查 LLM 客户端和 Agent 流处理
  - [x] 审查工具注册与执行系统
  - [x] 审查 MCP 服务器管理
  - [x] 审查沙箱集成
  - [x] 审查数据库和持久化层

- [x] Task 2: 审计认证与访问控制
  - [x] 检查 JWT 实现安全性
  - [x] 检查中间件路由白名单完整性
  - [x] 检查默认凭据风险
  - [x] 检查各 API 路由的认证覆盖

- [x] Task 3: 审计注入向量
  - [x] 检查 shell 命令拼接（search-tools.ts grepWithRipgrep）
  - [x] 检查文件路径操作（file-tools.ts resolvePath）
  - [x] 检查 SQL 查询参数化（sessions.ts, providers/storage.ts）
  - [x] 检查 MCP stdio 命令注入风险

- [x] Task 4: 审计外部交互
  - [x] 检查 web_fetch SSRF 风险
  - [x] 检查 customBaseUrl SSRF 风险
  - [x] 检查 web_search API 密钥泄露风险
  - [x] 检查 MCP SSE 客户端出站请求

- [x] Task 5: 审计敏感数据处理
  - [x] 检查 API 密钥存储方式
  - [x] 检查 MCP 配置持久化
  - [x] 检查环境变量中的敏感信息

- [x] Task 6: 编写审计报告
  - [x] 按严重度分组编写漏洞报告
  - [x] 每个漏洞包含攻击者画像、输入向量、代码路径、影响、修复建议
  - [x] 输出至 spec.md

# Task Dependencies
- Task 2-5 依赖 Task 1（需先理解架构）
- Task 2-5 可并行执行
- Task 6 依赖 Task 2-5（汇总所有发现）