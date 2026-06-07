# Project Rules — CC Web (Claude Code Web UI)

## 项目结构

```
/workspace/
├── src/                  # Claude Code CLI 源码（Ink/React 终端 UI）
│   ├── commands.ts       # CC 斜杠命令注册表（40+ 命令）
│   ├── tools.ts          # 工具注册表
│   ├── utils/permissions/ # 权限模式定义
│   └── ...
├── web/                  # Next.js Web UI（独立子项目）
│   ├── src/
│   │   ├── app/          # Next.js App Router 页面
│   │   ├── components/
│   │   │   ├── chat/     # 聊天组件（chat-input.tsx 是核心）
│   │   │   └── layout/   # 布局组件
│   │   ├── lib/
│   │   │   ├── auth.ts   # JWT 认证（jose 库）
│   │   │   ├── sandbox/  # Vercel Sandbox 配置
│   │   │   └── ...
│   │   └── middleware.ts # 认证中间件
│   ├── vitest.config.ts  # Vitest 测试配置
│   ├── vercel.json       # Vercel 部署配置（region: iad1）
│   └── package.json      # Next.js 16.2.7 + React 19.2.4
└── .trae/                # Trae IDE 规则和规范
```

## 构建与开发命令

```bash
# Web UI 开发
cd /workspace/web
npm run dev          # 启动开发服务器（Turbopack）
npm run build        # 生产构建
npm run lint         # ESLint 检查
npx vitest run       # 运行单元测试

# CLI 构建（根目录）
cd /workspace
bun install
bun run build        # 标准构建 → ./cli
bun run build:dev    # 开发构建 → ./cli-dev
```

## 完成任务后必须运行的验证命令

```bash
cd /workspace/web
npm run build        # 确保构建通过
npm run lint         # 确保代码规范
npx vitest run       # 运行单元测试
```

## 技术栈

- **Next.js 16.2.7**（Turbopack）— 注意：此版本有 breaking changes，参考 `node_modules/next/dist/docs/`
- **React 19.2.4** + React DOM 19.2.4
- **Tailwind CSS v4** + shadcn/ui
- **Vitest** + @testing-library/react — 单元测试
- **jose** — JWT 认证
- **@vercel/sandbox** — 沙箱执行环境

## 环境变量

参考 `web/.env.example` 获取完整列表。关键变量：

| 变量 | 用途 | 默认值 |
|------|------|--------|
| `AUTH_USERNAME` | 登录用户名 | `admin` |
| `AUTH_PASSWORD` | 登录密码 | `changeme` |
| `AUTH_SECRET` | JWT 签名密钥 | `default-secret-change-me` |
| `ANTHROPIC_API_KEY` | Anthropic API 密钥 | 无 |
| `VERCEL_TOKEN` | Vercel Sandbox API Token | 无 |
| `SANDBOX_ENABLED` | 启用沙箱 | `false` |
| `SERPAPI_KEY` | SerpAPI 搜索密钥 | 无 |
| `OPENAI_API_KEY` | OpenAI API 密钥（可选） | 无 |

## Vercel 部署

- **框架**: Next.js（自动检测）
- **区域**: iad1（美东）
- **配置**: `web/vercel.json`
- **认证**: 中间件要求 session cookie，未登录重定向到 `/login`
- **默认凭据**: admin / changeme

### Vercel 部署常见问题

1. **Turbopack 构建错误**: `export` 不能放在 React 组件函数体内，必须放在模块顶层
2. **vitest.config.ts 类型错误**: 在 `tsconfig.json` 的 `exclude` 中添加 `"vitest.config.ts"`
3. **部署未更新**: 检查 Vercel Dashboard 确认最新 commit 构建成功

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

## 斜杠命令菜单架构

### 数据结构
```typescript
interface SlashCommand {
  name: string;        // 如 "/clear", "/permissions"
  hasSubmenu: boolean; // 是否有子菜单
}
```

### 状态管理
- `showCommandMenu`: 显示斜杠命令列表
- `showPermissionSubmenu`: 显示权限子菜单
- `selectedIndex`: 当前选中项索引
- `commandFilter`: 用户输入的过滤文本

### 交互流程
1. 用户输入 `/` → 显示命令列表
2. 继续输入过滤命令（模糊搜索）
3. 选择普通命令 → 填入输入框（不执行）
4. 选择 `/permissions` → 切换到权限子菜单
5. Esc 在子菜单中 → 返回命令列表
6. Esc 在命令列表中 → 关闭菜单

### CC 风格极简原则
- 只显示命令名，无描述、无标题、无提示文字
- 权限子菜单只显示图标 + 名称
- 当前选中权限标记 `*`

## 代码风格

- 中文注释（与用户语言一致）
- 组件使用函数式 + hooks
- 样式使用 Tailwind CSS + cn() 工具函数
- 类型使用 TypeScript strict 模式
