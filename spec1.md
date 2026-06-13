# Security Audit Spec

## Why
对 `web/` 子项目进行自动化安全审计，识别中等严重度及以上的已确认漏洞，每个漏洞必须具备可论证的端到端利用路径。

## What Changes
- 输出结构化安全审计报告（不修改代码）
- 按严重度分组报告已确认漏洞
- 每个漏洞提供：攻击者画像、输入向量、代码路径、影响、修复建议

## Impact
- Affected specs: 无（纯审计，不修改代码）
- Affected code: `web/src/lib/tools/search-tools.ts`, `web/src/lib/tools/file-tools.ts`, `web/src/lib/agent-stream.ts`, `web/src/lib/tools/web-tools.ts`, `web/src/lib/providers/storage.ts`, `web/src/lib/auth.ts`, `web/src/lib/sandbox/config.ts`

## 审计范围

基于对代码库的完整审查，覆盖以下攻击面：

### 认证与访问控制
- JWT 会话管理（`lib/auth.ts`）
- 中间件路由保护（`middleware.ts`）
- 默认凭据配置

### 注入向量
- Shell 命令拼接（`search-tools.ts` grepWithRipgrep）
- 文件路径操作（`file-tools.ts` resolvePath）
- 用户可控的 URL 参数

### 外部交互
- 出站 HTTP 请求（`web-tools.ts` web_fetch、`agent-stream.ts` customBaseUrl）
- MCP 进程管理（`mcp/manager.ts`）

### 敏感数据处理
- API 密钥存储（`providers/storage.ts`）
- 环境变量配置（`auth.ts`、`sandbox/config.ts`）

## 已确认漏洞

### HIGH

#### H-1: Shell 命令注入 — ripgrep 搜索工具

**攻击者画像**: 已认证用户（通过 LLM agent 间接利用）

**可控输入向量**: `grep` 工具的 `pattern` 参数，由 LLM 生成但最终来自用户对话

**代码路径**:
1. 用户发送消息 → `/api/chat` → `createAgenticStream()` → Anthropic/OpenAI loop
2. LLM 决定调用 `grep` 工具 → `executeTools()` → `tool.execute(params)`
3. `grepTool.execute()` ([search-tools.ts](file:///workspace/web/src/lib/tools/search-tools.ts#L287-L344)) → `grepWithRipgrep()` ([search-tools.ts](file:///workspace/web/src/lib/tools/search-tools.ts#L139-L192))
4. 字符串拼接构造 shell 命令：`cmd += ` '${pattern.replace(/'/g, "'\\''")}' '${path}'` ` ([search-tools.ts](file:///workspace/web/src/lib/tools/search-tools.ts#L158))
5. `exec(cmd, ...)` 执行命令 ([search-tools.ts](file:///workspace/web/src/lib/tools/search-tools.ts#L160-L163))

**利用论证**: 单引号转义方案 `replace(/'/g, "'\\''")` 将 `'` 替换为 `'\''`，这会终止外层单引号上下文。攻击者注入 `'; cat /etc/passwd; echo '` 作为 pattern，经转义后变为 `''\''; cat /etc/passwd; echo '\'''`，shell 解析时 `; cat /etc/passwd; echo ` 处于引号外被执行。

**影响**: 远程命令执行（RCE），攻击者可在服务器上执行任意 shell 命令，读取敏感文件、反弹 shell、横向移动。

**修复建议**: 使用 `execFile` 或 `spawn` 直接传递参数数组，而非字符串拼接；或使用 Node.js fallback 替代 ripgrep shell 调用。

---

#### H-2: 任意文件读写 — 文件工具路径遍历

**攻击者画像**: 已认证用户（通过 LLM agent 间接利用）

**可控输入向量**: `file_read`、`file_write`、`file_edit` 工具的 `path` 参数

**代码路径**:
1. 用户通过聊天触发 LLM → agent 调用文件工具
2. `resolvePath()` ([file-tools.ts](file:///workspace/web/src/lib/tools/file-tools.ts#L18-L21))：如果 `filePath` 以 `/` 开头，直接返回原路径，不做任何沙箱限制
3. 工具使用该路径读取/写入文件系统

**利用论证**: 设置 `path = "/etc/passwd"` → `resolvePath()` 直接返回 `/etc/passwd` → `readFile("/etc/passwd")` 读取系统密码文件。同理可写入 `/etc/cron.d/`、`~/.ssh/authorized_keys` 等。

**影响**: 敏感信息泄露（读取 `/etc/passwd`、环境变量文件、私钥）、权限提升（写入 SSH authorized_keys、cron jobs）、系统破坏。

**修复建议**: 在 `resolvePath()` 中增加路径白名单限制，解析后检查是否在允许的目录范围内（如 `WORK_DIR`），拒绝绝对路径或限制在项目目录内。

---

#### H-3: SSRF via customBaseUrl — 聊天 API 出站请求

**攻击者画像**: 已认证用户

**可控输入向量**: `/api/chat` 请求体中的 `customBaseUrl` 和 `customApiPath` 字段

**代码路径**:
1. POST `/api/chat` ([chat/route.ts](file:///workspace/web/src/app/api/chat/route.ts#L27-L34)) → `createAgenticStream()` 传入 `customBaseUrl`、`customApiPath`
2. `runOpenAILoop()` ([agent-stream.ts](file:///workspace/web/src/lib/agent-stream.ts#L375-L392)) 拼接 URL：`fetch(`${baseUrl}${apiPath}`, ...)`
3. 无 URL 白名单校验，直接发起 HTTP 请求

**利用论证**: 设置 `customBaseUrl = "http://169.254.169.254/latest"` 和 `customApiPath = "/meta-data/"` → 服务器向 AWS 元数据服务发起请求 → 返回包含 IAM 凭证等敏感信息的响应，通过 SSE 流回传给攻击者。

**影响**: 服务器端请求伪造，可攻击内部网络服务（云元数据服务、内网 API、数据库、Redis 等），导致凭证泄露、内网横向移动。

**修复建议**: 对 `customBaseUrl` 实施白名单或黑名单校验，禁止内网 IP 段（127.0.0.0/8、10.0.0.0/8、172.16.0.0/12、192.168.0.0/16、169.254.0.0/16）、禁止非 HTTP/HTTPS 协议。

---

### MEDIUM

#### M-1: SSRF via web_fetch 工具

**攻击者画像**: 已认证用户（通过 LLM agent 间接利用）

**可控输入向量**: `web_fetch` 工具的 `url` 参数

**代码路径**:
1. Agent 调用 `web_fetch` 工具
2. `web_fetchTool.execute()` ([web-tools.ts](file:///workspace/web/src/lib/tools/web-tools.ts#L32-L118)) 仅做 `new URL(url)` 格式校验
3. 直接 `fetch(url, ...)` 发起请求，无目标地址限制

**利用论证**: 设置 `url = "http://localhost:6379/"` → 服务器向本地 Redis 发起请求 → 可探测内网服务存活性、读取云元数据、攻击内网服务。

**影响**: 内网服务探测与攻击，可结合 Redis/MySQL 等协议进行利用。

**修复建议**: 对 `web_fetch` 的 URL 实施与 H-3 相同的白名单/黑名单校验。

---

#### M-2: API 密钥明文存储

**攻击者画像**: 具有数据库访问权限的攻击者（内部威胁、SQL 注入、备份泄露）

**可控输入向量**: 无直接用户输入，但数据库文件 (`mcp-servers.json`、Turso/libSQL) 包含明文密钥

**代码路径**:
1. `createProvider()` ([providers/storage.ts](file:///workspace/web/src/lib/providers/storage.ts#L56-L70)) 将 `apiKey` 明文写入 `providers` 表
2. `listProvidersWithModels()` → `GET /api/providers` 返回完整 API 密钥给已认证用户
3. MCP 服务器配置 `mcp-servers.json` 中 `env` 字段可能包含密钥（[manager.ts](file:///workspace/web/src/lib/mcp/manager.ts#L640-L660)）

**影响**: 数据库泄露导致所有第三方 API 密钥（OpenAI、Anthropic、SerpAPI 等）及 MCP 凭据被窃取，可造成财务损失和数据泄露。

**修复建议**: 使用加密存储 API 密钥（如 AES-256-GCM），API 响应中脱敏显示（仅返回前/后几位），`mcp-servers.json` 中的 `env` 字段进行加密或使用外部密钥管理服务。

---

#### M-3: 默认凭据硬编码

**攻击者画像**: 外部攻击者（无需认证）

**可控输入向量**: 登录页面 `/login` 的用户名/密码字段

**代码路径**:
1. `verifyCredentials()` ([auth.ts](file:///workspace/web/src/lib/auth.ts#L20-L25)) 与默认值比对
2. 默认值：`AUTH_USERNAME = "admin"`, `AUTH_PASSWORD = "changeme"`, `AUTH_SECRET = "default-secret-change-me"`
3. 若部署时未覆盖环境变量，攻击者可直接使用默认凭据登录

**影响**: 未授权访问整个应用，可获得已认证用户的所有能力（执行命令、读写文件、访问 LLM API）。

**修复建议**: 启动时检测是否使用默认凭据，若是则拒绝启动并输出错误提示；或强制要求首次登录时修改密码。

---

### 审计结论

共发现 **3 个 HIGH** 和 **3 个 MEDIUM** 严重度漏洞。所有漏洞均具备可论证的端到端利用路径。建议优先修复 HIGH 级别漏洞（H-1 命令注入、H-2 任意文件读写、H-3 SSRF）。