# Plan: 修复 6 个安全漏洞 (3 HIGH + 3 MEDIUM)

> 漏洞来源：web/ 安全审计 (`spec1.md`)
> 验证结果：6 个声明全部属实
> 优先级：HIGH 优先，MEDIUM 并行

---

## 一、当前状态（Phase 1 探索结论）

### H-1: Shell 命令注入 — `grepWithRipgrep`
**位置**: [web/src/lib/tools/search-tools.ts:158](file:///workspace/web/src/lib/tools/search-tools.ts#L158)
```typescript
// 当前代码（不安全）
cmd += ` '${pattern.replace(/'/g, "'\\''")}' '${path}'`;
exec(cmd, ...);  // exec() 传入字符串
```
**问题**: `exec()` 传入完整 shell 命令字符串，`replace(/'/g, "'\\''")` 对单引号的转义在 bash 中可被绕过（注入 `'; cat /etc/passwd #`）。

### H-2: 任意文件读写 — `resolvePath`
**位置**: [web/src/lib/tools/file-tools.ts:19](file:///workspace/web/src/lib/tools/file-tools.ts#L19)
```typescript
function resolvePath(filePath: string): string {
  if (filePath.startsWith("/")) return filePath;  // 直接返回任意绝对路径
  return resolve(WORK_DIR, filePath);
}
```
**问题**: 以 `/` 开头的路径直接放行，可读写 `/etc/passwd`、`~/.ssh/authorized_keys` 等。

### H-3: SSRF via `customBaseUrl`
**位置**: [web/src/lib/agent-stream.ts:378](file:///workspace/web/src/lib/agent-stream.ts#L378)
```typescript
const response = await fetch(`${baseUrl}${apiPath}`, ...);  // 无 URL 校验
```
**问题**: 用户可控的 `customBaseUrl` 直接拼接到 fetch，无内网 IP 禁止列表。

### M-1: SSRF via `web_fetch`
**位置**: [web/src/lib/tools/web-tools.ts:46](file:///workspace/web/src/lib/tools/web-tools.ts#L46)
```typescript
try { new URL(url); } catch { return { error: "Invalid URL" }; }
// 仅做格式校验，无目标地址限制
await fetch(url, ...);
```
**问题**: 与 H-3 相同，但通过工具调用触发。

### M-2: API 密钥明文存储
**位置 A**: [web/src/lib/providers/storage.ts:65-66](file:///workspace/web/src/lib/providers/storage.ts#L65)
```typescript
sql: "INSERT INTO providers (id, name, base_url, api_key, ...) VALUES (?, ?, ?, ?, ...)",
args: [id, provider.name, provider.baseUrl, provider.apiKey, ...],
```
**位置 B**: GET `/api/providers` 返回完整 `apiKey`
**问题**: 数据库泄露则全量密钥暴露；API 响应也暴露密钥。

### M-3: 默认凭据硬编码
**位置**: [web/src/lib/auth.ts:5-8](file:///workspace/web/src/lib/auth.ts#L5)
```typescript
const AUTH_USERNAME = process.env.AUTH_USERNAME || "admin";
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || "changeme";
const AUTH_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "default-secret-change-me"
);
```
**问题**: 部署时若未覆盖环境变量，攻击者用默认凭据登录。

---

## 二、Proposed Changes

### Fix H-1: Shell 命令注入 — 改用 `execFile`

**文件**: `web/src/lib/tools/search-tools.ts`

**修改**: 将 `exec(cmd)` 替换为 `execFile()` + 参数数组，消除 shell 解析。

```typescript
// 修改前
exec(cmd, { cwd: WORK_DIR, maxBuffer: MAX_BUFFER }, (err, stdout, stderr) => {...});

// 修改后：改用 execFile 直接传参数（无 shell）
// ripgrep 参数逐个传递，永不经过 shell
execFile(
  "rg",
  [
    pattern,           // --pattern（非 shell 拼接，天然安全）
    "--",             // 分隔符，之后都是路径
    path,
    ...(options.glob ? ["--glob", options.glob] : []),
    ...(options.context !== undefined ? ["-C", String(options.context)] : []),
    "--color=never",
    "--with-filename",
    "--line-number",
  ],
  { cwd: WORK_DIR, maxBuffer: MAX_BUFFER },
  (err, stdout, stderr) => {...}
);
```

**新增依赖**: 无（Node.js 内置 `child_process.execFile`）

**注意**: `rg` = ripgrep，二进制在 `vendor/ripgrep/`。使用 `execFile` 时 PATH 可能不同，需改为绝对路径。

```typescript
import { join } from "path";
import { homedir } from "os";

const RIPGREP_PATH = join(homedir(), ".claude", "vendor", "ripgrep", "x86_64-linux", "rg");
```

**验证**:
```bash
npx vitest run  # 若 vitest 仍坏，manual test: fill "'; cat /etc/passwd #" in grep tool → should search literally
```

---

### Fix H-2: 任意文件读写 — `resolvePath` 加白名单

**文件**: `web/src/lib/tools/file-tools.ts`

**修改**: 禁止绝对路径访问，仅允许 `WORK_DIR` 下的相对路径。

```typescript
import { isAbsolute, resolve, normalize } from "path";

function resolvePath(filePath: string): string {
  // 禁止绝对路径（修复 H-2）
  if (isAbsolute(filePath)) {
    throw new Error(`Absolute paths are not allowed: ${filePath}`);
  }
  // 禁止路径遍历（.. 攻击）
  const normalized = normalize(filePath);
  if (normalized.startsWith("..")) {
    throw new Error(`Path traversal detected: ${filePath}`);
  }
  return resolve(WORK_DIR, normalized);
}
```

**注意**: 需要将 `WORK_DIR` 改为更安全的默认值。当前 `WORK_DIR` 可能是 `process.cwd()`（项目根目录）。若 chat session 期望用户可读写 `/tmp`，需调整设计。暂时禁止绝对路径是保守的安全策略。

**验证**:
```bash
# 用 agent-browser 验证：fill "path=/etc/passwd" in file_read tool → should error
```

---

### Fix H-3 + M-1: SSRF — 统一 URL 校验

**文件**: `web/src/lib/tools/web-tools.ts`（M-1） + `web/src/lib/agent-stream.ts`（H-3）

**新增工具函数** `web/src/lib/utils/ssrf-guard.ts`：

```typescript
// web/src/lib/utils/ssrf-guard.ts
const BLOCKED_HOSTS = new Set([
  "localhost", "127.0.0.1", "::1", "0.0.0.0",
  // 内网段
  "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "169.254.0.0/16",
  // AWS 元数据
  "169.254.169.254", "metadata.google.internal",
  // Docker/K8s
  "host.docker.internal", "kubernetes.default",
]);

const BLOCKED_PROTOCOLS = new Set(["http", "ftp", "file", "gopher"]);

function isBlockedHost(host: string): boolean {
  if (BLOCKED_HOSTS.has(host)) return true;
  // 检查是否是 IP 段
  try {
    const ip = ipAddress(host);
    if (!ip) return false;
    // 简化：直接拒绝所有 RFC1918 私有地址
    return isPrivate(ip) || isLoopback(ip) || isLinkLocal(ip);
  } catch {
    // DNS name — 允许（但需注意 DNS rebinding）
    return false;
  }
}

export function validateUrl(targetUrl: string, context: string): void {
  const parsed = new URL(targetUrl);
  const protocol = parsed.protocol.replace(/:$/, "");
  const host = parsed.hostname;

  if (BLOCKED_PROTOCOLS.has(protocol) && protocol !== "http" && protocol !== "https") {
    throw new Error(`${context}: protocol '${protocol}' is not allowed`);
  }
  if (BLOCKED_PROTOCOLS.has(protocol) === false && protocol !== "https" && protocol !== "http") {
    // 非 http(s) 协议
    throw new Error(`${context}: only http/https are allowed`);
  }
  if (isBlockedHost(host)) {
    throw new Error(`${context}: host '${host}' is blocked`);
  }
  // 禁止端口
  const port = parsed.port ? parseInt(parsed.port) : (protocol === "https" ? 443 : 80);
  if ([22, 23, 25, 445, 3306, 5432, 6379, 27017].includes(port)) {
    throw new Error(`${context}: port ${port} is blocked`);
  }
}
```

**H-3 修改** (`agent-stream.ts`):
```typescript
import { validateUrl } from "./ssrf-guard";
// ...
validateUrl(`${baseUrl}${apiPath}`, "customBaseUrl");
const response = await fetch(`${baseUrl}${apiPath}`, ...);
```

**M-1 修改** (`web-tools.ts`):
```typescript
import { validateUrl } from "@/lib/utils/ssrf-guard";
// ...
validateUrl(url, "web_fetch");
await fetch(url, { headers: { "User-Agent": "Free Code/1.0" }, signal: AbortSignal.timeout(10000) });
```

**注意**: `ip-address` npm 包可能未安装。先用 `isPrivate()` / `isLoopback()` 的简单实现或用已有的网络库。不引入新大依赖。

---

### Fix M-2: API 密钥明文存储 → 脱敏

**文件**: `web/src/lib/providers/storage.ts` + `web/src/app/api/providers/route.ts`

**存储修改**: 仍然明文存储（改加密需要迁移），但加注释说明风险。

**API 响应修改**: GET `/api/providers` 返回脱敏密钥。

```typescript
// web/src/app/api/providers/route.ts
// 修改前
return Response.json({ providers: allProviders });

// 修改后
return Response.json({
  providers: allProviders.map(p => ({
    ...p,
    apiKey: p.apiKey ? `***${p.apiKey.slice(-4)}` : null,  // 只显示后 4 位
  }))
});
```

**注意**: 若前端设置页面需要完整密钥做测试连接，需单独接口按需解密。此处仅对 GET list 脱敏。

---

### Fix M-3: 启动时检测默认凭据

**文件**: `web/src/lib/auth.ts`

**修改**: 启动时若检测到默认凭据，输出警告并（可选）拒绝启动。

```typescript
// web/src/lib/auth.ts

const AUTH_USERNAME = process.env.AUTH_USERNAME || "admin";
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || "changeme";
const AUTH_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "default-secret-change-me"
);

// 新增：默认凭据检测警告
const IS_DEFAULT_USERNAME = !process.env.AUTH_USERNAME;
const IS_DEFAULT_PASSWORD = !process.env.AUTH_PASSWORD;
const IS_DEFAULT_SECRET = !process.env.AUTH_SECRET;

if (IS_DEFAULT_USERNAME || IS_DEFAULT_PASSWORD || IS_DEFAULT_SECRET) {
  console.warn(
    "[SECURITY WARNING] Using default credentials detected. " +
    "Set AUTH_USERNAME, AUTH_PASSWORD, and AUTH_SECRET environment variables in production."
  );
  // 可选：生产环境强制要求
  if (process.env.NODE_ENV === "production") {
    console.error(
      "[FATAL] Default credentials are not allowed in production. " +
      "Set AUTH_USERNAME, AUTH_PASSWORD, AUTH_SECRET environment variables."
    );
    process.exit(1);
  }
}
```

**验证**:
```bash
# 本地开发：不退出（仅 warn）
# 生产 NODE_ENV=production：退出
```

---

## 三、Assumptions & Decisions

### 假设
- **A1**: ripgrep 二进制路径 `~/.claude/vendor/ripgrep/x86_64-linux/rg` 正确
- **A2**: `WORK_DIR` 应限制在项目目录内（不期望用户访问 `/tmp` 等）
- **A3**: 生产环境会设置 `NODE_ENV=production`
- **A4**: `web/src/lib/utils/` 目录已存在（或可新建）
- **A5**: `ip-address` 包未安装，需用纯 JS 实现 IP 段判断

### 决策
- **D1**: H-1 修复：改 `exec()` 为 `execFile()` + 绝对路径（最干净）
- **D2**: H-2 修复：禁止绝对路径 + 禁止 `..` 遍历（保守安全）
- **D3**: H-3 + M-1 修复：提取为 `ssrf-guard.ts` 统一校验函数（复用）
- **D4**: M-2 修复：仅 GET 列表脱敏（不修存储，避免 DB 迁移）
- **D5**: M-3 修复：启动时 warn + `NODE_ENV=production` 时 fatal exit（不修默认值）
- **D6**: 不引入新 npm 依赖（用 Node.js 内置 API）
- **D7**: 不修 vitest（pre-existing，与安全无关）
- **D8**: `web/src/lib/utils/` 目录若不存在则创建（`ssrf-guard.ts` 放这里）

---

## 四、Verification

### 构建验证
```bash
cd /workspace/web
npm run build     # 必须通过
npm run lint      # 0 errors
```

### 功能回归
- **H-1**: `npm run build` 通过 = TypeScript 编译成功 = `execFile` 参数正确
- **H-2**: build 通过即可（`resolvePath` 类型签名不变）
- **H-3**: `npm run build` 通过 = `validateUrl` 集成正确
- **M-1**: `npm run build` 通过
- **M-2**: `curl /api/providers` 验证密钥脱敏
- **M-3**: 启动时检查 console.warn 输出

### 安全验证
- **H-1**: grep 工具填入 `'; cat /etc/passwd #` → 应搜索字面量，不执行命令
- **H-2**: file_read 工具填入 `/etc/passwd` → 应返回错误
- **H-3**: chat 填入 `customBaseUrl=http://169.254.169.254/` → 应报错
- **M-1**: web_fetch 填入 `http://localhost:6379/` → 应报错
- **M-2**: `curl /api/providers` → 密钥格式 `***xxxx`
- **M-3**: `NODE_ENV=production npm run dev` → 应 exit(1)

---

## 五、预计时间

- Fix H-1 (exec → execFile): 10 分钟
- Fix H-2 (resolvePath 白名单): 5 分钟
- Fix H-3 + M-1 (ssrf-guard): 10 分钟
- Fix M-2 (API 密钥脱敏): 5 分钟
- Fix M-3 (默认凭据检测): 5 分钟
- build + lint: 3 分钟
- **总: 35-40 分钟**

---

## 六、不做的事

- ❌ 不引入新 npm 依赖
- ❌ 不修 vitest 配置
- ❌ 不修 pre-existing UI bugs
- ❌ 不修 `web/public/` 下的测试产物文件
- ❌ M-2 不做加密存储迁移（只脱敏 API 响应）
