# Tasks

- [ ] Task 1: 架构梳理 — 识别入口点与信任边界
  - [ ] 1.1 扫描 `web/src/app/api/` 下所有 Route Handler，列出 HTTP 入口点及其认证要求
  - [ ] 1.2 扫描 `web/src/middleware.ts`，确认认证中间件的白名单和边界
  - [ ] 1.3 扫描 `src/entrypoints/` 和 `src/bridge/`，列出 CLI/SDK 入口点
  - [ ] 1.4 扫描 `src/remote/` 和 `src/server/`，列出 WebSocket/直连入口
  - [ ] 1.5 输出架构概览：信任边界图（公开/认证/内部/沙箱）

- [ ] Task 2: 认证与访问控制审计
  - [ ] 2.1 审计 `web/src/lib/auth.ts` — JWT 生成、验证、过期、刷新逻辑
  - [ ] 2.2 审计 `web/src/app/api/auth/` — 登录/登出流程，检查暴力破解防护和会话固定
  - [ ] 2.3 审计 `web/src/middleware.ts` — 确认所有非白名单路由均有认证保护
  - [ ] 2.4 审计 `src/utils/auth.ts` — CLI 端认证逻辑
  - [ ] 2.5 审计 `web/src/lib/permissions/` — 权限风险评估和绕过可能性

- [ ] Task 3: 注入向量审计
  - [ ] 3.1 审计 `web/src/lib/db.ts` 和 `web/src/lib/sessions.ts` — SQL 查询，检查参数化
  - [ ] 3.2 审计 `web/src/lib/tools/bash.ts` — Shell 命令构造，检查命令注入
  - [ ] 3.3 审计 `web/src/lib/tools/file-tools.ts` 和 `web/src/app/api/files/` — 文件路径操作，检查路径遍历
  - [ ] 3.4 审计 `web/src/lib/tools/web-tools.ts` — URL 构造和模板注入
  - [ ] 3.5 审计 `src/utils/` 下 Shell 执行相关文件 — 命令拼接

- [ ] Task 4: 外部交互审计
  - [ ] 4.1 审计 `web/src/lib/llm/` — 出站 LLM API 请求，检查 SSRF
  - [ ] 4.2 审计 `web/src/lib/tools/web-tools.ts` — Web 搜索/Fetch 工具，检查 SSRF
  - [ ] 4.3 审计 `web/src/lib/mcp/` — MCP 服务器连接，检查未验证的外部连接
  - [ ] 4.4 审计 `web/src/lib/sandbox/` — Vercel Sandbox API 调用安全性
  - [ ] 4.5 审计 `src/utils/api.ts` 和 `src/services/` — 出站 API 请求

- [ ] Task 5: 敏感数据处理审计
  - [ ] 5.1 扫描 `web/.env.example` 和配置相关代码 — 硬编码密钥/凭证
  - [ ] 5.2 审计 `web/src/lib/db.ts`、`web/src/lib/auth.ts` — 密钥存储安全性
  - [ ] 5.3 审计 `web/src/app/api/chat/route.ts` — 聊天请求中的 API Key 传递和日志记录
  - [ ] 5.4 审计各 `console.log`/`logger` 调用 — 确认无凭证或 PII 泄露
  - [ ] 5.5 扫描 `src/` 下 — 配置文件中的密钥和日志输出

- [ ] Task 6: 汇总与报告
  - [ ] 6.1 汇总 Tasks 2-5 的所有确认发现
  - [ ] 6.2 按严重度（Critical / High / Medium）分组，每个发现附完整证据链
  - [ ] 6.3 如无 Medium+ 发现，输出清洁审计声明
  - [ ] 6.4 输出最终结构化报告

# Task Dependencies
- Task 2-5 均依赖 Task 1（需先完成架构梳理）
- Task 2-5 之间无依赖，可并行执行
- Task 6 依赖 Task 2-5 全部完成