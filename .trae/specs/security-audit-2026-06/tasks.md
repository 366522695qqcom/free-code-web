# 修复任务清单 — Security Audit 2026-06

> 来源：checklist.md（CC Web 安全审计报告）
> 策略：仅输出跟踪条目；不在本 spec 中修复代码（修复需走后续实施 spec）

- [ ] C-1：MCP stdio 任意命令执行（RCE）
  - [ ] 子任务 C-1.1：在 `lib/mcp/manager.ts` `StdioMCPClient.start` 前增加 `command` 白名单校验（仅允许已注册 `npx/@anthropic-ai/mcp-*` 命名空间；或执行前对 `args` 元素做 shell 元字符过滤）
  - [ ] 子任务 C-1.2：`/api/mcp/servers/[id]/route.ts` `connect` 动作增加二次确认（或与 `bash` 工具 risk 同级）
  - [ ] 子任务 C-1.3：MCP stdio 子进程 `env` 严格裁剪（移除 `AUTH_SECRET`/`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`VERCEL_TOKEN`/`TURSO_AUTH_TOKEN` 等敏感键）

- [ ] H-1：任意 MCP 工具/资源执行
  - [ ] 子任务 H-1.1：`lib/mcp/manager.ts` `executeTool`/`readResource` 前校验 `toolName` ∈ `config.tools` 且 `uri` 匹配 `config.resources` 中前缀
  - [ ] 子任务 H-1.2：`mcp__*` 工具 `requiresConfirmation` 默认 `true`，按 server 来源白名单

- [ ] H-2：未认证访问 `/api/mcp/*` GET 路由
  - [ ] 子任务 H-2.1：`middleware.ts` 移除隐式放行（任何非 `/api/auth/*` `/api/health` `/login` `/_next/*` 静态资源的请求必须经 session 校验）
  - [ ] 子任务 H-2.2：`/api/mcp/servers/route.ts` `GET`、`/api/mcp/servers/[id]/route.ts` `GET`、`/api/mcp/servers/[id]/tools/route.ts` `GET`、`/api/mcp/servers/[id]/resources/route.ts` `GET` 全部加上 `getSession()` 校验
  - [ ] 子任务 H-2.3：返回时脱敏 `env` 字段（`***`）

- [ ] H-3：`/api/tools/execute` 越权执行
  - [ ] 子任务 H-3.1：`api/tools/execute/route.ts` 执行前调用 `assessToolExecution`，对 `high`/`outside-sandbox` 风险走 `setPendingConfirmation` + 用户确认
  - [ ] 子任务 H-3.2：或限制 endpoint 仅 admin 角色 + 仅 `requiresConfirmation: false` 工具白名单

- [ ] M-1：默认凭据
  - [ ] 子任务 M-1.1：新增 `instrumentation.ts`（Node 运行时，非 Edge），检测到 `AUTH_USERNAME/AUTH_PASSWORD/AUTH_SECRET` 任一为默认时 `process.exit(1)`
  - [ ] 子任务 M-1.2：默认 JWT 有效期由 `7d` 降为 `24h`，并在文档中显式声明

- [ ] M-2：登录无速率限制
  - [ ] 子任务 M-2.1：引入 `next-rate-limit` 或 Vercel Edge Config 限速 5 req/min/IP
  - [ ] 子任务 M-2.2：连续失败 N 次短期封禁同 IP

- [ ] M-3：MCP 持久化文件明文凭据
  - [ ] 子任务 M-3.1：`lib/mcp/manager.ts` `saveToDisk` 前用 `AUTH_SECRET`（AES-GCM）加密 `env` 字段
  - [ ] 子任务 M-3.2：或将 MCP server 配置迁移至 libSQL（与 `providers/storage.ts` 一致）

# 任务依赖

- H-2.1（中间件收窄）必须在 H-2.2（路由加 session 校验）之前实施，避免"路由加校验但中间件不收窄"导致仍被未认证访问
- C-1.3（env 裁剪）应与 H-1（白名单校验）并行，但需在同一 patch 中保证子进程不再泄露运行时密钥
- M-1.1（启动期硬退出）应在 M-2.1（限速）之前，因默认凭据下任何限速都形同虚设
