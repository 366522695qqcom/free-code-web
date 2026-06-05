# Development Guide

free-code 开发环境搭建与工作流指南。

## 环境要求

- **Bun** >= 1.3.11（必须，运行时和构建工具）
- **OS**: macOS 或 Linux（Windows 通过 WSL）
- **Git**: 用于开发版版本号生成

```bash
# 安装 Bun
curl -fsSL https://bun.sh/install | bash
```

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/paoloanzn/free-code.git
cd free-code

# 安装依赖
bun install

# 从源码运行（开发模式，启动较慢）
bun run dev

# 构建生产版
bun run build
./cli

# 构建完整解锁版（54 个实验特性）
bun run build:dev:full
./cli-dev
```

## 构建命令

| 命令 | 输出 | 说明 |
|------|------|------|
| `bun run build` | `./cli` | 生产版构建，仅启用 VOICE_MODE |
| `bun run build:dev` | `./cli-dev` | 开发版，带时间戳版本号 |
| `bun run build:dev:full` | `./cli-dev` | 开发版 + 全部 54 个实验特性 |
| `bun run compile` | `./dist/cli` | 替代输出路径 |
| `bun run dev` | — | 直接从源码运行，无需构建 |

### 自定义特性标志

```bash
# 启用特定标志
bun run ./scripts/build.ts --feature=ULTRAPLAN --feature=ULTRATHINK

# 在开发版基础上添加标志
bun run ./scripts/build.ts --dev --feature=BRIDGE_MODE
```

## 构建系统详解

`scripts/build.ts` 执行以下步骤：

1. 解析命令行参数（`--dev`, `--compile`, `--feature`, `--feature-set`）
2. 收集特性标志集合（默认：`VOICE_MODE`）
3. 生成版本号（开发版含日期+时间+git SHA）
4. 调用 `bun build --compile` 生成独立可执行文件
5. 设置可执行权限 (chmod 0o755)

### 构建参数

| 参数 | 说明 |
|------|------|
| `--dev` | 开发版，带时间戳版本号和实验标志 |
| `--compile` | 输出到 `./dist/` |
| `--feature=FLAG` | 启用指定特性标志 |
| `--feature-set=dev-full` | 启用全部 54 个实验特性 |

### 外部化包

以下包不会被打包进可执行文件，需要在运行时可用：

- `@ant/*` — Anthropic 内部包
- `audio-capture-napi` — 原生音频捕获
- `image-processor-napi` — 原生图片处理
- `modifiers-napi` — 原生修饰键检测
- `url-handler-napi` — 原生 URL 处理

### 编译时定义

| 定义 | 值 | 说明 |
|------|-----|------|
| `process.env.USER_TYPE` | `'external'` | 区分内部/外部构建 |
| `MACRO.VERSION` | 版本号 | 构建时注入 |
| `MACRO.BUILD_TIME` | ISO 时间戳 | 构建时间 |
| `MACRO.PACKAGE_URL` | 包名 | 包标识 |
| `MACRO.FEEDBACK_CHANNEL` | `'github'` | 反馈渠道 |
| `process.env.CLAUDE_CODE_VERIFY_PLAN` | `'false'` | 计划验证开关 |

## 认证

### API Key 方式

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
./cli
```

### OAuth 方式

```bash
./cli /login
```

### 多提供商

```bash
# OpenAI Codex
export CLAUDE_CODE_USE_OPENAI=1

# AWS Bedrock
export CLAUDE_CODE_USE_BEDROCK=1
export AWS_REGION="us-east-1"

# Google Vertex AI
export CLAUDE_CODE_USE_VERTEX=1

# Anthropic Foundry
export CLAUDE_CODE_USE_FOUNDRY=1
export ANTHROPIC_FOUNDRY_API_KEY="..."
```

## 项目结构

```
free-code/
├── scripts/
│   └── build.ts              # 构建脚本
├── src/
│   ├── entrypoints/          # CLI 入口
│   │   ├── cli.tsx           # 主入口（快速路径分发）
│   │   ├── init.ts           # 初始化逻辑
│   │   └── mcp.ts            # MCP 入口
│   ├── main.tsx              # 完整 CLI 初始化
│   ├── screens/              # 屏幕组件
│   │   ├── REPL.tsx          # 主交互界面
│   │   └── Doctor.tsx        # 诊断界面
│   ├── QueryEngine.ts        # 查询引擎
│   ├── commands.ts           # 命令注册
│   ├── tools.ts              # 工具注册
│   ├── query.ts              # 查询入口
│   ├── commands/             # 命令实现 (40+)
│   ├── tools/                # 工具实现 (25+)
│   ├── components/           # UI 组件 (120+)
│   ├── hooks/                # React hooks (100+)
│   ├── bridge/               # IDE 桥接
│   ├── state/                # 状态管理
│   ├── tasks/                # 后台任务
│   ├── skills/               # 技能系统
│   ├── plugins/              # 插件系统
│   ├── services/             # API/MCP/OAuth
│   ├── constants/            # 常量
│   ├── keybindings/          # 快捷键
│   ├── ink/                  # Ink 框架定制
│   ├── migrations/           # 数据迁移
│   ├── coordinator/          # 协调器
│   ├── outputStyles/         # 输出样式
│   ├── query/                # 查询配置
│   ├── remote/               # 远程会话
│   ├── voice/                # 语音输入
│   ├── utils/                # 工具函数 (200+)
│   └── types/                # 类型定义
├── assets/                   # 静态资源
├── package.json
├── tsconfig.json
├── ARCHITECTURE.md           # 架构文档
├── FEATURES.md               # 特性标志审计
└── CLAUDE.md                 # Claude Code 工作指南
```

## 开发模式

### 从源码运行

```bash
bun run dev
```

这会直接运行 `src/entrypoints/cli.tsx`，无需构建。启动较慢但修改即时生效。

### 添加新命令

1. 在 `src/commands/` 下创建命令目录或文件
2. 在 `src/commands.ts` 中导入并注册
3. 如果命令需要特性标志，使用条件导入：

```typescript
const myCommand = feature('MY_FLAG')
  ? require('./commands/my-command/index.js').default
  : null
```

### 添加新工具

1. 在 `src/tools/` 下创建工具目录
2. 实现 `Tool` 接口（定义于 `src/Tool.ts`）
3. 在 `src/tools.ts` 中导入并注册
4. 如果工具需要特性标志，使用条件导入

### 添加新特性标志

1. 在 `scripts/build.ts` 的 `fullExperimentalFeatures` 数组中添加标志名
2. 在代码中使用 `feature('FLAG')` 进行条件判断
3. Bun 编译器会自动对 `false` 分支执行死代码消除

## 特性标志参考

详见 [FEATURES.md](FEATURES.md)，包含 88 个标志的完整审计。

### 常用标志

| 标志 | 说明 | 运行时依赖 |
|------|------|------------|
| `VOICE_MODE` | 语音输入 | claude.ai OAuth + SoX/原生音频 |
| `BRIDGE_MODE` | IDE 远程控制 | claude.ai OAuth + GrowthBook |
| `ULTRAPLAN` | 多 Agent 规划 | claude.ai OAuth |
| `ULTRATHINK` | 深度思考模式 | 无 |
| `AGENT_TRIGGERS` | Cron 触发器 | 无 |
| `BUILTIN_EXPLORE_PLAN_AGENTS` | 内置 Agent 预设 | 无 |
| `TOKEN_BUDGET` | Token 预算追踪 | 无 |

## 常见问题

### 构建失败

- 确认 Bun 版本 >= 1.3.11：`bun --version`
- 清除缓存后重试：`rm -rf node_modules && bun install`

### 运行时缺少原生模块

某些特性标志需要原生 Node 模块：
- `VOICE_MODE` → 需要 `audio-capture-napi` 或 SoX
- `NATIVE_CLIPBOARD_IMAGE` → 需要 `image-processor-napi`（仅 macOS）

### 开发版版本号格式

```
2.1.87-dev.20260605.t143022.sha1a2b3c4d
       │       │        │        └── git short SHA
       │       │        └── 时间 (HHMMSS)
       │       └── 日期 (YYYYMMDD)
       └── 基础版本号
```
