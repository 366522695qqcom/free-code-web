# Plan: 重做 CLI 启动界面 UI（修订版 v3 — 收紧范围）

> 实现依据：[.trae/specs/redesign-cli-ui/](file:///workspace/.trae/specs/redesign-cli-ui/)（已定稿 spec + tasks + checklist）
> 用户三轮反馈收敛范围：
>   1. **可加新动画**（解除 spec 原"不实现新动画"约束）
>   2. **CLI 源码保持成熟** — `src/` 改动以最小触碰 / 通过 config & theme 配置层为主
>   3. **新增功能聚焦"模型提供商页"** — `web/src/app/settings/providers/`（已存在） + CLI 端读取
> 目标参考图：用户提供的 CLI 启动截图（圆角外框、简化 buddy、橙色品牌色、大写 Feed 标题）

## Scope（用户已批准）

| 层 | 范围 | 文件区域 |
|---|---|---|
| **L1** | Theme token 重映射（仅改 hex 值） | `src/utils/theme.ts` |
| **L2** | CLI 启动屏 6 项视觉/动画微调（最小触碰） | `src/components/LogoV2/` 下 5 个文件 + `Ultraplan*Dialog.tsx` |
| **L3** | **模型提供商页 → CLI 启动屏** 数据流（新增 2 个小文件） | `web/src/lib/providers/cliSync.ts` + `src/utils/customProvider.ts` |
| **L4** | 构建 + 截图 + checklist 验证 | （无文件改动） |

**不做**：web 端 UI 改造、OAuth 流程、新动画库、新增对其他 web 页面、CLI 核心逻辑修改。

## Current State Analysis（基于 Phase 1 探索）

### L1 — theme tokens
- [src/utils/theme.ts](file:///workspace/src/utils/theme.ts) 已有 8 个目标 token（`startupAccent` / `planMode` / `permission` / `success` / `error` / `warning` / `claude` / `claudeShimmer`）+ `clawd_*`（**禁动**）
- 现有 hex 需重映射为 Anthropic 品牌色（spec 表格）

### L2 — LogoV2/ 已成熟组件
- [LogoV2.tsx](file:///workspace/src/components/LogoV2/LogoV2.tsx): 已有 `borderStyle="round"`、5 种 feed 组合（onboarding/guestpasses/overage/default/condensed）、6 种 notice 插槽（debug/tmux/announcement/sandbox/voice/op1m）+ EmergencyTip
- [Clawd.tsx](file:///workspace/src/components/LogoV2/Clawd.tsx): 9×3 块字符画 + APPLE_EYES 回退 + 4 pose
- [Feed.tsx](file:///workspace/src/components/LogoV2/Feed.tsx): 标题非大写、无竖条
- **已存在动画**: [AnimatedClawd.tsx](file:///workspace/src/components/LogoV2/AnimatedClawd.tsx)（JUMP_WAVE/LOOK_AROUND 点击动画）+ [AnimatedAsterisk.tsx](file:///workspace/src/components/LogoV2/AnimatedAsterisk.tsx)（hue 扫描 1500ms × 2）
- [UltraplanLaunchDialog.tsx](file:///workspace/src/components/UltraplanLaunchDialog.tsx) + [UltraplanChoiceDialog.tsx](file:///workspace/src/components/UltraplanChoiceDialog.tsx): 默认 Dialog 色

### L3 — Web 端"模型提供商" 已成熟
- [web/src/app/settings/providers/page.tsx](file:///workspace/web/src/app/settings/providers/page.tsx)（826 行，已完整）：
  - 左侧栏导航（7 项：模型提供商/对话/外观/沙箱/权限/会话/关于）
  - Provider 列表 + 添加/编辑/删除
  - BaseURL/API Key/API Path 表单
  - 连接测试（4 态：idle/testing/connected/error）
  - 模型获取（fetchedModels） + 勾选添加
  - 已添加模型（带 capabilities 标签：视觉/推理/工具使用）
  - ModelDialog 子弹窗（chat/embedding/image 三类）
- 数据层：
  - [web/src/lib/providers/types.ts](file:///workspace/web/src/lib/providers/types.ts)（`CustomProvider` / `CustomModel` / `ProviderWithModels`）
  - [web/src/lib/providers/storage.ts](file:///workspace/web/src/lib/providers/storage.ts)（Turso/libSQL 持久化）
  - [web/src/lib/providers/api.ts](file:///workspace/web/src/lib/providers/api.ts)（`testProviderConnection` / `fetchProviderModels`）
  - 5 个 API routes：`/api/providers` / `/api/providers/[id]` / `/api/providers/[id]/models` / `/api/providers/[id]/models/manage` / `/api/providers/[id]/test`
- 已有 spec: [fix-custom-model-chat-auth](file:///workspace/.trae/specs/fix-custom-model-chat-auth/spec.md) + [fix-provider-api-mismatch](file:///workspace/.trae/specs/fix-provider-api-mismatch/spec.md)
- 颜色 tokens: `--terminal-green/cyan/amber/red` 已定义（globals.css）

**关键发现**：web 端模型提供商页**已经完整** — 我要做的不是"造它"，而是"在 web 端导出 CLI 同步函数 + CLI 端读取"，让 CLI 启动屏的 `modelLine` 反映用户在 web 端添加的自定义模型。

## Proposed Changes（仅 4 步，紧凑）

### Change 1 — L1: Theme token 重映射
- **文件**：[src/utils/theme.ts](file:///workspace/src/utils/theme.ts)
- **what**: 在 `lightTheme` / `darkTheme` 中替换 8 个 token 的 hex 值（**仅改值**）：
  - `startupAccent` / `planMode`: 浅 `#d97757` / 深 `#e08769`
  - `permission`: 浅 `#6a9bcc` / 深 `#7aabe0`
  - `success`: 浅 `#788c5d` / 深 `#8aa071`
  - `error`: 浅 `#c14545` / 深 `#d96565`
  - `warning`: 浅 `#d9a259` / 深 `#e8b774`
  - `claude`: 浅 `#141413` / 深 `#faf9f5`
  - `claudeShimmer`: 浅 `#3a3a37` / 深 `#b0aea5`
- **forbidden**: `clawd_body` / `clawd_background` 保持原值
- **why**: 颜色基础

### Change 2 — L2: LogoV2 顶部品牌首字（极简）
- **文件**：[src/components/LogoV2/LogoV2.tsx](file:///workspace/src/components/LogoV2/LogoV2.tsx)
- **what**:
  - 保留 `borderStyle="round"`，加 `env.terminal === "Apple_Terminal"` → `"single"` 回退
  - 在外框内容首行插入 `<Text color="startupAccent">▌ </Text><Text bold color="claude">Free Code</Text><Text dimColor> v{MACRO.VERSION}</Text>`（column ≥ 100 时追加 `· Claude Code, free of telemetry`）
- **why**: spec 顶部首字
- **caution**: 不修改其它布局与 feed 组合逻辑

### Change 3 — L2: 简化 buddy + 已有动画保留
- **文件**：[src/components/LogoV2/Clawd.tsx](file:///workspace/src/components/LogoV2/Clawd.tsx)
- **what**: 重写 `POSES` 用 6 行 9 列 ASCII 艺术（`o`/`●` 眼、`‿` 嘴），保留 4 个 pose + `Segments` 类型 + APPLE_EYES 回退
- **保留**: [AnimatedClawd.tsx](file:///workspace/src/components/LogoV2/AnimatedClawd.tsx) 的 JUMP_WAVE/LOOK_AROUND 不动；[AnimatedAsterisk.tsx](file:///workspace/src/components/LogoV2/AnimatedAsterisk.tsx) 不动
- **why**: spec 简化 buddy；动画已存在不重建

### Change 4 — L2: Welcome 左对齐 + Feed 大写化 + 弹窗品牌化
- **文件**：[src/components/LogoV2/LogoV2.tsx](file:///workspace/src/components/LogoV2/LogoV2.tsx) + [src/components/LogoV2/Feed.tsx](file:///workspace/src/components/LogoV2/Feed.tsx) + [src/components/UltraplanLaunchDialog.tsx](file:///workspace/src/components/UltraplanLaunchDialog.tsx) + [src/components/UltraplanChoiceDialog.tsx](file:///workspace/src/components/UltraplanChoiceDialog.tsx)
- **what**:
  - Welcome Box `alignItems="center"` → `"flex-start"`（仅 Welcome 行 + 副标题，Clawd 居中保持）
  - 副标题分两行 `<Text>`（modelLine / cwdLine，不同明度）
  - Feed 标题改为 `<Box flexDirection="row"><Text color="startupAccent">▌ </Text><Text bold>{title.toUpperCase().split('').join(' ')}</Text></Box>`
  - Ultraplan*Dialog 用 `<Dialog color="planMode">` + 标题 `<Text bold color="startupAccent">`
  - 弹窗内紧凑脚注：`<Text dimColor>[↵] confirm</Text>   <Text dimColor>[esc] cancel</Text>`（弹窗内自绘，不动 Byline.tsx）
- **why**: spec 4 项

### Change 5 — L2: 新动画（最小化，1 文件）
- **新文件**：[src/components/LogoV2/AnimatedWelcome.tsx](file:///workspace/src/components/LogoV2/AnimatedWelcome.tsx)
- **what**:
  - 复用 `useTerminalSize` 判断列宽
  - 用 `useState`/`useEffect`/`setInterval`（无新依赖）实现：
    - "▌ Free Code" **打字机效果**（50ms / 字符，单次）
    - Clawd **随机眨眼**（每 3-5s 一次，叠加在现有 JUMP_WAVE 之外）
    - Feed 列表**逐行 fade-in**（每 100ms 一行，用 `dimColor` 切换）
    - "No recent activity" **空状态脉冲**（`success` 色心跳，1s 周期）
  - 包 `<feature('WELCOME_ANIMATION')>` 开关（默认 true，env 关掉即退化）
  - 尊重 `prefers-reduced-motion`（用 env.terminalSupportsUnicode 旁路）
- **集成**: 在 [LogoV2.tsx](file:///workspace/src/components/LogoV2/LogoV2.tsx) 第 480 行附近用 `<AnimatedWelcome>` 包裹原渲染
- **why**: 用户明确"可加新动画"；spec 6×9 buddy 也需要动画配合
- **保留**: 已有 AnimatedClawd/AnimatedAsterisk 不动；本组件与之并存（点击 Clawd 仍触发 JUMP_WAVE）

### Change 6 — L3: web 端导出 CLI 同步函数
- **新文件**：[web/src/lib/providers/cliSync.ts](file:///workspace/web/src/lib/providers/cliSync.ts)
- **what**: 导出 `writeProvidersForCli()` 函数 — 从 libSQL 读所有 provider + model，写入 `~/.claude/providers.json`
- **格式**:
  ```json
  {
    "default": "provider-id-1",
    "providers": [
      {
        "id": "...",
        "name": "...",
        "baseUrl": "...",
        "apiKey": "...",
        "apiPath": "...",
        "defaultModel": "gpt-4o"
      }
    ]
  }
  ```
- **触发**: 不自动触发；导出 `getDefaultProviderForCli()` 供未来 `useProvidersSync` hook 调用（**仅导出函数，不实现 hook** — 保持本次范围紧凑）
- **API 复用**: 内部用 `listProvidersWithModels()` 已有函数
- **why**: L3 集成基础
- **caution**: 不写调用方（避免扩大范围）

### Change 7 — L3: CLI 端读取 + 启动屏集成
- **新文件**：[src/utils/customProvider.ts](file:///workspace/src/utils/customProvider.ts)
- **what**:
  - 导出 `readCustomProviderFromDisk(): { name, model, baseUrl } | null`
  - 同步读 `~/.claude/providers.json`（try/catch 包裹，缺文件返回 null）
  - 导出 `getDisplayModelLine(): string` — 优先返回自定义 provider 名称 + 默认 model；否则返回上游 `getLogoDisplayData().modelLine`
- **集成点**: 在 [src/utils/logoV2Utils.ts](file:///workspace/src/utils/logoV2Utils.ts) 的 `getLogoDisplayData()` 末尾合并 `getDisplayModelLine()`
- **why**: 让 CLI 启动屏的 `modelLine` 反映 web 端自定义提供商
- **向后兼容**: 无 `providers.json` 时不破版

### Change 8 — L4: 构建 + 截图 + checklist
- **what**:
  ```bash
  # CLI 构建
  cd /workspace && bun run build:dev

  # Web 端构建（验证不破版）
  cd /workspace/web && npm run build && npm run lint && npx vitest run

  # 启动 + 截图
  ./cli-dev &
  # agent-browser 截 /tmp/cli-redesign-{light,dark,with-custom-provider}.png
  # 触发 ultraplan 弹窗 + 截图

  # 终端宽度 80 / 120 / 160 三档
  ```
- **为什么 3 个截图**: light / dark / with-custom-provider（验证 Change 7）

## Assumptions & Decisions

1. **图片 = spec 目标**。图片是当前 CLI 实现的真实截图，spec 是用户期望的改造后形态。
2. **CLI 源码最小触碰**。Change 4、5 仅修改 `LogoV2/` + 2 个 Dialog；核心 `QueryEngine.ts` / `commands.ts` / `tools.ts` 不动。
3. **不重建已存在动画**。AnimatedClawd / AnimatedAsterisk 已有 JUMP_WAVE/LOOK_AROUND/hue-sweep，**保持不动**；新动画只补 4 个新行为（打字机/眨眼/fade-in/脉冲）。
4. **Byline 不改**。弹窗内自绘紧凑脚注，避免影响非 Dialog 场景。
5. **不引入新依赖**。动画用 Ink + `useState`/`useEffect`/`setInterval`；不用 framer-motion。
6. **L3 仅函数导出**。`web/src/lib/providers/cliSync.ts` 只导出函数，**不实现 hook / 触发机制**（避免扩大范围到 "自动同步" 流程）。
7. **CLI 端读文件**。`providers.json` 写由 web 端触发，CLI 仅读 — 单向数据流，最简单稳定。

## Verification（karpathy "Goal-Driven Execution"）

```bash
# L1 验证
[ -f ./cli-dev ] && echo "build ok"
./cli-dev --help  # 不应崩

# L2 验证（截图）
# /tmp/cli-redesign-light.png   — 浅色主题
# /tmp/cli-redesign-dark.png    — 深色主题
# /tmp/cli-redesign-dialog.png  — 触发 ultraplan 弹窗

# L3 验证
# 1. Web 端在 /settings/providers 添加自定义 provider
# 2. 手动触发 writeProvidersForCli() 写入 ~/.claude/providers.json
# 3. ./cli-dev 启动，modelLine 显示自定义 provider 名称
# 4. 删除 providers.json，再启动 → 不报错（向后兼容）

# 跨层
cd /workspace/web && npm run build && npm run lint && npx vitest run
```

**成功标准**：
- ✅ `bun run build:dev` + `npm run build` + `npm run lint` + `vitest` 全过
- ✅ 浅 / 深主题下颜色与 spec 表格一致
- ✅ 80/120/160 三宽度不破版
- ✅ Apple Terminal 走方角回退
- ✅ ultraplan 弹窗边框为品牌橙
- ✅ 弹窗脚注为 `[↵] confirm   [esc] cancel`
- ✅ 添加自定义 provider 后 CLI modelLine 反映该 provider
- ✅ 无 providers.json 时 CLI 启动不报错

## Skills to Use During Implementation

| 阶段 | 技能 | 用途 |
|---|---|---|
| 规划期 | `karpathy-guidelines` | 行为准则（已用） |
| 规划期 | `brainstorming` | 设计对话（已用） |
| 实施 — 颜色 | `web-design-guidelines` | 检查色值与对比度合规 |
| 实施 — 动画 | `frontend-skill` | 动画节奏与转场参考 |
| 验证 — 截图 | `agent-browser` | CLI 启动屏截屏（无 TTY 环境） |
| 验证 — 端到端 | `webapp-testing` | Web 端提供商管理页测试（如需要） |
| 验证 — 编码 | `test-driven-development` | `readCustomProviderFromDisk` 函数 |

## 不做的事（karpathy "Simplicity First"）

- 不重写 `QueryEngine.ts` / `commands.ts` / `tools.ts`
- 不动 `Pane` / `Dialog` / `Divider` 内部
- 不替换 ASCII 为 Nerd Font 图标
- 不修改 theme token 命名
- 不实现 OAuth 流程
- 不实现 `useProvidersSync` hook
- 不修改 `page.tsx` / `model-dialog.tsx` 的现有结构
- 不顺手"改进"无关代码

## Task Order（执行序列）

```
[串行 1]  Change 1: theme token 重映射（前置依赖）
[并行]    ├─ Change 2: LogoV2 顶部首字
         ├─ Change 3: 简化 buddy
         ├─ Change 4: Welcome 左对齐 + Feed 大写化 + 弹窗品牌化
         └─ Change 5: 新动画组件
[串行 6-7] Change 6: web 端 cliSync.ts → Change 7: CLI 端 customProvider.ts
[殿后 8]  Change 8: 构建 + 截图 + 验证
```
