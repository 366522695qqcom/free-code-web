# CC Web — Claude Code Web UI

基于 Next.js 16 的 Claude Code Web 界面。

## 技术栈

- Next.js 16.2.7 (Turbopack) + React 19.2.4
- Tailwind CSS v4 + shadcn/ui
- Vitest + @testing-library/react（单元测试）
- jose（JWT 认证）
- @vercel/sandbox（沙箱执行）

## 开发命令

```bash
npm run dev          # 开发服务器
npm run build        # 生产构建
npm run lint         # ESLint
npx vitest run       # 单元测试
npx vitest           # 监听模式
```

## 环境变量

复制 `.env.example` 为 `.env.local` 并填入实际值：

```bash
cp .env.example .env.local
```

关键变量：
- `ANTHROPIC_API_KEY` — Claude API 密钥（必需）
- `VERCEL_TOKEN` — Vercel Sandbox API Token
- `AUTH_USERNAME` / `AUTH_PASSWORD` — 登录凭据（默认 admin/changeme）
- `AUTH_SECRET` — JWT 签名密钥

## 项目结构

```
src/
├── app/              # Next.js App Router
├── components/
│   ├── chat/         # 聊天组件（chat-input.tsx 核心输入框）
│   └── layout/       # 布局组件
├── lib/
│   ├── auth.ts       # JWT 认证
│   ├── sandbox/      # Vercel Sandbox
│   └── ...
├── middleware.ts     # 认证中间件
└── types/            # TypeScript 类型
```

## 注意事项

- **Next.js 16 有 breaking changes**，参考 `node_modules/next/dist/docs/`
- **export 必须在模块顶层**，不能放在 React 组件函数体内（Turbopack 会报错）
- **vitest.config.ts** 已在 tsconfig.json 的 exclude 中，避免类型冲突
- **认证中间件**要求 session cookie，未登录重定向到 `/login`
