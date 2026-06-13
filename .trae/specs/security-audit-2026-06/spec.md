# Security Audit 2026-06 — CC Web (free-code)

## Why

对 `/workspace/web`（CC Web — Claude Code Web UI）进行端到端安全审计，识别中等严重度及以上的已确认漏洞，且每条都必须具备可论证的完整利用路径。仅保留能具体证明可利用性的发现，不报告理论性或推测性风险。

审计范围依据规则文档 `.trae/rules/project_rules.md`：认证、注入向量、外部交互、敏感数据处理。

## What Changes

- 不修改任何代码；仅输出结构化漏洞报告
- 创建 `tasks.md` 跟踪每条已确认漏洞的修复跟踪
- 创建 `checklist.md` 用于审计复核

## Impact

- 受影响规格：认证与访问控制、注入向量、外部交互、敏感数据处理
- 受影响代码：
  - `web/src/middleware.ts`
  - `web/src/lib/auth.ts`
  - `web/src/app/api/mcp/servers/route.ts`
  - `web/src/app/api/mcp/servers/[id]/route.ts`
  - `web/src/app/api/mcp/servers/[id]/tools/route.ts`
  - `web/src/app/api/mcp/servers/[id]/resources/route.ts`
  - `web/src/lib/mcp/manager.ts`（StdioMCPClient.spawn）
  - `web/src/app/api/tools/execute/route.ts`

## 报告发现概览

详见 [`checklist.md`](file:///workspace/.trae/specs/security-audit-2026-06/checklist.md)。

## 跟踪任务

详见 [`tasks.md`](file:///workspace/.trae/specs/security-audit-2026-06/tasks.md)。

## ADDED Requirements

### Requirement: 已确认漏洞清单

审计 SHALL 列出所有严重度 ≥ Medium 且具备端到端利用路径的漏洞，并按 Critical / High / Medium 分组输出。每条记录 SHALL 包含：位置、攻击者画像、可控输入、完整代码路径、影响、修复建议。

#### Scenario: Critical 漏洞（C-1）
- **WHEN** 已认证用户调用 `POST /api/mcp/servers` 注册 `type=stdio` MCP server，并随后 `POST /api/mcp/servers/{id} {action:"connect"}`
- **THEN** Next.js 进程通过 `spawn(command, args, {shell:false})` 执行任意命令，**确认**获得 RCE

#### Scenario: High 漏洞（H-1）
- **WHEN** 攻击者已注册并 connect 任意 stdio MCP server
- **THEN** 通过 `POST /api/mcp/servers/{id}/tools` 任意 `toolName` 即可调用该 MCP 后端暴露的任意工具，无需人工确认

#### Scenario: High 漏洞（H-3）
- **WHEN** 已认证用户 `POST /api/tools/execute {toolName:"bash", params:{command:"..."}}`
- **THEN** `bash.exec(command)` 立即执行，**确认** 绕过 `agent-stream.ts` 中 `assessToolExecution` + `setPendingConfirmation` 流程

#### Scenario: Medium 漏洞（M-1）
- **WHEN** 部署未设置 `AUTH_USERNAME`/`AUTH_PASSWORD`/`AUTH_SECRET`
- **THEN** 默认凭据 `admin/changeme` 可登录，`auth.ts` 仅 `console.warn` 而非 `process.exit(1)`，**确认** 默认部署可即时入侵

#### Scenario: Medium 漏洞（M-2）
- **WHEN** 外部用户对 `POST /api/auth/login` 持续发送
- **THEN** 无任何 rate limit / lockout，**确认** 可在线爆破弱口令

#### Scenario: Medium 漏洞（M-3）
- **WHEN** MCP server 被注册（含 `env: {AUTH_TOKEN: "..."}`）
- **THEN** `mcp-servers.json` 以明文持久化 `env` 字段，**确认** 任何拿到进程文件系统读权限的攻击者可窃取所有用户凭据

#### Scenario: Medium 漏洞（H-2）— 防御纵深不足
- **WHEN** middleware 配置被变更或未来版本移除校验逻辑
- **THEN** `GET /api/mcp/servers`（route handler 内部无 `getSession()` 校验）将直接返回全部 MCP server 配置（含 `env` 未经脱敏的凭据），**确认** 防御纵深不足

## MODIFIED Requirements

无（本审计为只读评估，不修改既有规格）。

## REMOVED Requirements

无。
