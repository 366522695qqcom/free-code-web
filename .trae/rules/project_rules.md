# Project Rules — CC Web (Claude Code Web UI)

> 项目根目录是 free-code CLI 仓库，`web/` 是其 Next.js Web UI 子项目。
> 本文件只覆盖 `web/` 子项目；CLI 根项目信息见仓库根目录的 `ARCHITECTURE.md` / `CLAUDE.md`。

## 项目结构

```
/workspace/web/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # Route Handlers
│   │   │   ├── auth/                 # login / logout / me
│   │   │   ├── chat/route.ts         # 聊天流式接口
│   │   │   ├── compact/route.ts      # 上下文压缩
│   │   │   ├── files/                # 文件浏览
│   │   │   │   ├── content/route.ts  # 文件读写
│   │   │   │   └── route.ts
│   │   │   ├── mcp/                  # MCP 服务器资源
│   │   │   │   └── servers/[id]/
│   │   │   │       ├── resources/route.ts
│   │   │   │       ├── tools/route.ts
│   │   │   │       └── route.ts
│   │   │   ├── providers/            # LLM 提供商管理
│   │   │   │   └── [id]/
│   │   │   │       ├── models/{manage,}/route.ts
│   │   │   │       ├── models/route.ts
│   │   │   │       ├── test/route.ts
│   │   │   │       └── route.ts
│   │   │   ├── sandbox/              # Vercel Sandbox 控制
│   │   │   │   └── [id]/{resume,snapshot,stop,}/route.ts
│   │   │   ├── sessions/             # 会话管理
│   │   │   │   └── [id]/route.ts
│   │   │   ├── status/route.ts
│   │   │   └── tools/                # 工具执行/确认
│   │   │       ├── confirm/route.ts
│   │   │       └── execute/route.ts
│   │   ├── login/page.tsx
│   │   ├── mcp/page.tsx              # MCP 管理页
│   │   ├── settings/                 # + providers/ 子页
│   │   ├── layout.tsx                # 根布局
│   │   ├── page.tsx                  # 主聊天页
│   │   ├── globals.css
│   │   └── favicon.ico
│   │
│   ├── components/
│   │   ├── chat/                     # 聊天核心组件
│   │   │   ├── chat-input.tsx        # ⭐ 核心输入框（斜杠命令菜单）
│   │   │   ├── ansi-renderer.tsx
│   │   │   ├── auto-approve-toast.tsx
│   │   │   ├── cost-tracker.tsx
│   │   │   ├── diff-view.tsx
│   │   │   ├── file-tree-panel.tsx
│   │   │   ├── provider-dialog.tsx
│   │   │   ├── token-warning.tsx
│   │   │   └── tool-confirm-dialog.tsx
│   │   ├── layout/                   # 整体布局
│   │   │   ├── chat-layout.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── topbar.tsx
│   │   ├── mcp/                      # MCP 面板
│   │   │   ├── add-server-dialog.tsx
│   │   │   ├── mcp-panel.tsx
│   │   │   ├── server-detail.tsx
│   │   │   └── server-list.tsx
│   │   ├── messages/                 # 消息块渲染
│   │   │   ├── assistant-message.tsx
│   │   │   ├── message-list.tsx
│   │   │   ├── text-block.tsx
│   │   │   ├── thinking-block.tsx
│   │   │   ├── tool-result-block.tsx
│   │   │   ├── tool-use-block.tsx
│   │   │   └── user-message.tsx
│   │   ├── ui/                       # shadcn/ui 基础组件
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── switch.tsx
│   │   │   └── tooltip.tsx
│   │   ├── chat-area.tsx             # 聊天主区域容器
│   │   └── markdown-renderer.tsx    # react-markdown 封装
│   │
│   ├── hooks/                        # 自定义 React hooks
│   │   ├── use-chat.ts
│   │   ├── use-file-tree.ts
│   │   └── use-sessions.ts
│   │
│   ├── lib/                          # 业务核心
│   │   ├── auth.ts                   # JWT 认证（jose）
│   │   ├── query-engine.ts           # 独立查询引擎（不调用 CLI）
│   │   ├── agent-stream.ts           # Agent 流式响应处理
│   │   ├── sse.ts                    # Server-Sent Events 工具
│   │   ├── store.ts                  # 客户端状态
│   │   ├── sessions.ts               # 会话管理
│   │   ├── db.ts                     # libSQL 持久化
│   │   ├── context.ts                # 上下文窗口管理
│   │   ├── providers.ts              # 提供商路由
│   │   ├── features.ts               # 特性开关
│   │   ├── utils.ts                  # cn() 等通用工具
│   │   ├── llm/                      # LLM 客户端
│   │   │   ├── anthropic.ts
│   │   │   ├── openai.ts
│   │   │   ├── providers.ts
│   │   │   └── index.ts
│   │   ├── sandbox/                  # Vercel Sandbox 封装
│   │   │   ├── config.ts
│   │   │   ├── manager.ts
│   │   │   ├── tool-adapter.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── tools/                    # Agent 工具实现
│   │   │   ├── registry.ts
│   │   │   ├── bash.ts
│   │   │   ├── file-tools.ts
│   │   │   ├── search-tools.ts
│   │   │   ├── web-tools.ts
│   │   │   ├── confirmations.ts
│   │   │   └── index.ts
│   │   ├── permissions/              # 权限风险评估
│   │   │   ├── risk-assessor.ts
│   │   │   ├── rules.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── mcp/manager.ts            # MCP 客户端
│   │   ├── providers/                # 提供商持久化
│   │   │   ├── api.ts
│   │   │   ├── storage.ts
│   │   │   └── types.ts
│   │   └── __tests__/                # Vitest 单元测试
│   │
│   ├── types/index.ts                # 共享类型
│   └── middleware.ts                 # 认证中间件（白名单 /api/auth、/api/health、/login、/_next、静态资源）
│
├── public/                           # 静态资源
├── .env.example                      # 环境变量样例
├── vercel.json                       # 部署配置（region: iad1）
├── vitest.config.ts                  # 单元测试
├── next.config.ts                    # Next.js 配置
├── eslint.config.mjs                 # ESLint v9 flat config
├── postcss.config.mjs                # PostCSS（Tailwind v4）
├── tsconfig.json                     # ⭐ 需 exclude "vitest.config.ts"
├── components.json                   # shadcn/ui 配置
└── package.json                      # Next.js 16.2.7 + React 19.2.4
```

## 构建与开发命令

```bash
cd /workspace/web
npm install            # 安装依赖
npm run dev            # 开发服务器（Turbopack，热更新）
npm run build          # 生产构建
npm run start          # 启动生产服务
npm run lint           # ESLint 检查
npx vitest run         # 运行所有单元测试（单次）
npx vitest             # 监听模式
```

## 完成任务后必须运行的验证命令

```bash
cd /workspace/web
npm run build          # 必须通过（Turbopack 严格检查 export 位置）
npm run lint           # ESLint 必须通过
npx vitest run         # 单元测试必须通过
```

## 技术栈

| 层 | 技术 | 备注 |
|---|---|---|
| 框架 | **Next.js 16.2.7**（Turbopack） | 有 breaking changes，参考 `node_modules/next/dist/docs/` |
| UI 运行时 | **React 19.2.4** + React DOM 19.2.4 | |
| 样式 | **Tailwind CSS v4** + shadcn/ui + `@base-ui/react` | tw-animate-css 动画 |
| 图标 | lucide-react | |
| 状态 | 自实现 `lib/store.ts`（轻量） | |
| 持久化 | **libSQL**（`@libsql/client`） | 会话、文件元数据 |
| LLM 客户端 | `@anthropic-ai/sdk ^0.100.1` | 自封装 `lib/llm/{anthropic,openai,providers}` |
| 工具 | **fast-glob**、**uuid**、**ansi-to-html** | |
| 认证 | **jose**（JWT） | 中间件 + cookie |
| 沙箱 | **@vercel/sandbox** | `lib/sandbox/*` |
| Markdown | react-markdown + remark-gfm + rehype-highlight | |
| 单元测试 | **Vitest** + @testing-library/react + jsdom | |
| Lint | ESLint v9 + eslint-config-next 16.2.7 | |
| 类型 | TypeScript ^5（strict） | |

## 环境变量

参考 `web/.env.example` 获取完整列表。关键变量：

| 变量 | 用途 | 默认值 |
|------|------|--------|
| `AUTH_USERNAME` | 登录用户名 | `admin` |
| `AUTH_PASSWORD` | 登录密码 | `changeme` |
| `AUTH_SECRET` | JWT 签名密钥（**生产必改**） | `default-secret-change-me` |
| `ANTHROPIC_API_KEY` | Anthropic API 密钥 | 无 |
| `OPENAI_API_KEY` | OpenAI API 密钥（可选，备用 LLM） | 无 |
| `SERPAPI_KEY` | SerpAPI 搜索密钥（Web 搜索工具） | 无 |
| `VERCEL_TOKEN` | Vercel Sandbox API Token | 无 |
| `SANDBOX_ENABLED` | 是否启用沙箱执行 | `false` |

> ⚠️ 默认凭据 `admin / changeme` 与 `default-secret-change-me` 仅供本地开发，部署前必须覆盖。

## Vercel 部署

- **框架**: Next.js（自动检测）
- **区域**: iad1（美东）
- **配置**: `web/vercel.json`
- **认证**: `src/middleware.ts` 要求 session cookie；未登录访问任意非白名单路径都重定向到 `/login`
- **白名单**: `/api/auth/*`、`/api/health`、`/login`、`/_next/*`、静态资源
- **默认凭据**: admin / changeme

### Vercel 部署常见问题

1. **Turbopack 构建错误**: `export` 不能放在 React 组件函数体内，必须放在模块顶层
2. **vitest.config.ts 类型错误**: 在 `tsconfig.json` 的 `exclude` 中添加 `"vitest.config.ts"`
3. **部署未更新**: 检查 Vercel Dashboard 确认最新 commit 构建成功；环境变量需在 Vercel Project Settings 中独立配置
4. **Sandbox 401**: `VERCEL_TOKEN` 未配置或过期；`SANDBOX_ENABLED=false` 时跳过沙箱路径

## 已知陷阱与解决方案

### 1. export 必须在模块顶层
```typescript
// ❌ 错误 — 在组件内部 export
export function ChatInput() {
  export function helper() {} // Turbopack 构建失败
}

// ✅ 正确 — 在组件外部 export
export function helper() {}
export function ChatInput() {}
```

### 2. tsconfig.json 排除 vitest.config.ts
vitest 的类型定义未安装时，Next.js 类型检查会报错。在 `tsconfig.json` 中排除：
```json
{
  "exclude": ["node_modules", "vitest.config.ts"]
}
```

### 3. react-hooks/set-state-in-effect 规则
在 useEffect 中调用 setState 时，确保不会造成无限循环。如果多个 state 需要同时更新，放在同一个 effect 中。

### 4. Git 分支冲突处理
```bash
git fetch
git rebase FETCH_HEAD
# 如有冲突，解决后 git rebase --continue
```

### 5. Playwright Chromium 下载慢
在当前网络环境下，175MB 的 Chromium 下载可能超时。替代方案：
- 使用 `agent-browser` skill
- 直接在 Vercel 部署后手动测试

### 6. libSQL 与本地开发
`lib/db.ts` 依赖 libSQL；本地开发需要 `file:` 模式或 Turso 远程。环境变量中未配置时会降级为内存存储，**重启即丢失会话**。

### 7. SSE 流式响应
聊天接口通过 `lib/sse.ts` 输出 `text/event-stream`；中间件与 Vercel Edge 默认 30s 超时，长会话需在前端用 `use-chat.ts` 处理断流重连。

## 斜杠命令菜单架构

### 实际命令列表（[chat-input.tsx](file:///workspace/web/src/components/chat/chat-input.tsx)）
```
/clear /compact /context /cost /help
/model          (子菜单：模型选择)
/permissions    (子菜单：权限模式)
/review /status /tools
```

### 数据结构
```typescript
interface SlashCommand {
  name: string;        // 如 "/clear", "/permissions"
  hasSubmenu: boolean; // 是否有子菜单
}
```

### 权限模式（[chat-input.tsx](file:///workspace/web/src/components/chat/chat-input.tsx#L17-L34)）
```typescript
type PermissionMode =
  | "default"            // 默认询问
  | "plan"               // 仅规划
  | "acceptEdits"        // 自动接受编辑
  | "bypassPermissions"; // 全部放行
```

### 状态管理
- `showCommandMenu`: 显示斜杠命令列表
- `showPermissionSubmenu`: 显示权限子菜单
- `showModelSubmenu`: 显示模型子菜单
- `selectedIndex`: 当前选中项索引
- `commandFilter`: 用户输入的过滤文本

### 交互流程
1. 用户输入 `/` → 显示命令列表
2. 继续输入过滤命令（模糊搜索）
3. 选择普通命令 → 填入输入框（不执行）
4. 选择 `/permissions` → 切换到权限子菜单
5. 选择 `/model` → 切换到模型子菜单
6. Esc 在子菜单中 → 返回命令列表
7. Esc 在命令列表中 → 关闭菜单

### CC 风格极简原则
- 只显示命令名，无描述、无标题、无提示文字
- 权限子菜单只显示图标 + 名称
- 当前选中权限标记 `*`

## 架构细节（Web 独有）

### 请求生命周期
```
浏览器 (React)
  ↓ fetch /api/chat  (SSE)
middleware.ts  →  鉴权（jose 验签 session cookie）
  ↓
api/chat/route.ts
  ↓
lib/llm/*  (Anthropic / OpenAI)
  ↓
lib/agent-stream.ts  →  lib/sse.ts 流式输出
  ↓
use-chat.ts (前端消费 SSE)
```

### LLM 抽象
- `lib/llm/providers.ts` 定义统一接口（`complete`、`stream`、`countTokens`）
- `lib/llm/anthropic.ts`、`lib/llm/openai.ts` 实现各自协议
- 用户在 `/settings/providers` 添加自定义 Provider（Base URL + API Key），存于 libSQL
- `api/providers/[id]/test/route.ts` 用于连通性测试

### 工具系统
- `lib/tools/registry.ts` 注册所有工具（`bash`、`file-tools`、`search-tools`、`web-tools`）
- 每个工具实现 `risk-assessor.ts` 评估的 `RiskLevel`（low/medium/high/critical）
- 高风险工具调用走 `api/tools/confirm/route.ts`，前端弹 `tool-confirm-dialog.tsx`
- 用户在 `acceptEdits`/`bypassPermissions` 模式下跳过确认

### Sandbox
- `lib/sandbox/manager.ts` 封装 `@vercel/sandbox`
- 通过 `api/sandbox/[id]/route.ts` 创建/查询沙箱
- 沙箱挂起/恢复：`api/sandbox/[id]/{resume,snapshot,stop}/route.ts`
- `tool-adapter.ts` 将 Bash/File 工具调用路由到沙箱（`SANDBOX_ENABLED=true` 时）

### 状态分层
- **服务端**: libSQL（会话、消息、文件树快照）
- **客户端**: `lib/store.ts`（轻量订阅 store）
- **流式**: `use-chat.ts` 维护当前会话的消息流

## 代码风格

- 中文注释（与用户语言一致）
- 组件使用函数式 + hooks；客户端组件顶部加 `"use client"`
- 样式使用 Tailwind CSS + `cn()` 工具函数（`@/lib/utils`）
- 类型使用 TypeScript strict 模式
- 路径别名 `@/*` → `src/*`
- 命名：组件 PascalCase，hook camelCase（`use-*`），工具函数 camelCase
- 优先编辑现有文件，避免无意义新增；UI 复用优先用 shadcn/ui
