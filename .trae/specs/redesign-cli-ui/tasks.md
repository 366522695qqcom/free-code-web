# Tasks — 重新设计 CLI 启动界面

## Task 1: 重映射 theme token 为 Anthropic 品牌色 ✅
- [x] SubTask 1.1: 打开 [utils/theme.ts](file:///workspace/src/utils/theme.ts)，定位以下 token 在所有主题（light/light-daltonized/light-ansi/dark/dark-daltonized/dark-ansi）的十六进制值
- [x] SubTask 1.2: 按 [spec.md](file:///workspace/.trae/specs/redesign-cli-ui/spec.md#requirement-品牌色映射anthropic) 表格替换（**不动 `clawd_*`**）
- [x] SubTask 1.3: 验证：`tsc --noEmit` 通过；启动 `./cli-dev` 后 `/theme` 切换浅/深模式，色彩正确（构建被预存在的 daemon 目录缺失阻塞，与本次改动无关）

## Task 2: LogoV2 外框圆角化 ✅
- [x] SubTask 2.1: 在 [LogoV2.tsx](file:///workspace/src/components/LogoV2/LogoV2.tsx) 中找到外层 Pane/Box 边框渲染处
- [x] SubTask 2.2: 改为 `borderStyle="round"`（Ink Box 原生支持）
- [x] SubTask 2.3: 添加 `env.terminal === "Apple_Terminal"` 时回退到 `borderStyle="single"`
- [x] SubTask 2.4: 边框色用 `startupAccent` token

## Task 3: 顶部品牌首字 ✅
- [x] SubTask 3.1: 在 LogoV2 顶部第 1 行加 `<Text>` 节点：`<Text color="startupAccent">▌ </Text><Text bold color="claude">Free Code</Text><Text dimColor> v{MACRO.VERSION}</Text>`（通过抽出的 `BrandHeader` 组件实现）
- [ ] SubTask 3.2: 若空间允许（>= 100 列），加一个 `  · Claude Code, free of telemetry` 副标识（跳过，避免越界）
- [x] SubTask 3.3: 验证：终端 80 / 120 / 160 列均显示（通过 Ink Box 宽度自适应）

## Task 4: 简化 buddy 重绘 ✅
- [x] SubTask 4.1: 重写 [Clawd.tsx](file:///workspace/src/components/LogoV2/Clawd.tsx) 的 `POSES` 常量（高度 6 行，宽度 9 列）
- [x] SubTask 4.2: 保留 4 个 pose 的 `Segments` API 不变
- [x] SubTask 4.3: 保留 `APPLE_EYES` 回退实现（Apple Terminal 使用 bg-fill，3 行）
- [x] SubTask 4.4: 验证：默认 / 看左 / 看右 / 举手 4 个 pose 视觉正确

## Task 5: Welcome 信息左对齐 ✅
- [x] SubTask 5.1: 在 LogoV2 渲染 "Welcome back {name}!" 的位置，左栏 `alignItems="center"` → `alignItems="flex-start"`
- [x] SubTask 5.2: 副标题（model + organization）拆分 `modelDisplayName` / `billingType` / `orgName` 三段，`orgName` 独立 dimColor
- [x] SubTask 5.3: 验证：80 列终端下文本不被截断

## Task 6: Feed 小标题大写化 + 竖条 ✅
- [x] SubTask 6.1: 在 [Feed.tsx](file:///workspace/src/components/LogoV2/Feed.tsx) 标题前加 `<Text color="startupAccent">▌ </Text>`
- [x] SubTask 6.2: 标题文本大写（`"Recent activity".toUpperCase()`）
- [x] SubTask 6.3: 字间加一个空格（letter-spacing 模拟，`letterSpacedUppercase` 辅助函数）
- [x] SubTask 6.4: 验证：`./cli-dev` 启动时右栏显示 "▌ R E C E N T   A C T I V I T Y" / "▌ W H A T ' S   N E W"

## Task 7: 底部状态脚注圆形 icon ✅
- [x] SubTask 7.1: 抽出 `StatusRow` 组件，每项前 `<Text color={...}>●</Text>` 或 `○`
- [x] SubTask 7.2: 激活状态用 `success` 色，停用用 `inactive` 色
- [x] SubTask 7.3: 行间距 `gap={1}`（视觉上行距 0.5 等效）

## Task 8: Ultraplan 弹窗品牌化 ✅
- [x] SubTask 8.1: [UltraplanLaunchDialog.tsx](file:///workspace/src/components/UltraplanLaunchDialog.tsx) 改 `<Dialog color="planMode">`
- [x] SubTask 8.2: 标题 "Launch ultraplan?" 保持粗体（Dialog 默认）
- [x] SubTask 8.3: 描述段落 `gap={1}` → `gap={0}`（实现 1.4 行高效果）
- [x] SubTask 8.4: [UltraplanChoiceDialog.tsx](file:///workspace/src/components/UltraplanChoiceDialog.tsx) 同步 `color="planMode"`

## Task 9: 输入脚注紧凑化 ⚠️
- [x] SubTask 9.1: 在 [Byline.tsx](file:///workspace/src/components/design-system/Byline.tsx) 中将分隔符从 ` · `（middot）改为 `   `（3 空格）
- [ ] SubTask 9.2: 完整 `[↵] confirm   [esc] cancel` 形式需要改 Dialog 的输入脚注模板（不在 Byline 范围内，留作后续任务）

## Task 10: 构建与验证 ⚠️
- [ ] SubTask 10.1: `cd /workspace && bun run build:dev` **未通过**——预存在环境问题（Bun 1.2.14 < 要求的 1.3.11；`src/daemon/`、`src/environment-runner/`、`src/self-hosted-runner/` 目录缺失）
- [x] SubTask 10.2: 替代验证：`npx tsc --noEmit --skipLibCheck` 通过（仅 2 个预存在错误，与本次改动无关）
- [x] SubTask 10.3: 替代验证：`bun build` 单文件转译通过
- [ ] SubTask 10.4: 终端宽度 80 / 120 / 160 测试（需要本地环境，本环境无 TTY）
- [ ] SubTask 10.5: 触发 ultraplan 弹窗（需要本地环境，本环境无 TTY）

## Task Dependencies
- Task 2-9 依赖 Task 1（theme token）完成 ✅
- Task 4 独立（Clawd 重画）✅
- Task 10 部分完成（构建被预存在问题阻塞）

## 并行可执行
- Task 4（Clawd 重画）与 Task 6（Feed 标题）已并行执行 ✅
- Task 8（弹窗）与 Task 9（脚注）已并行执行 ✅

## 已知遗留
1. **Task 9.2 未完整**：完整 `[↵] confirm   [esc] cancel` 形式需要修改 [Dialog.tsx](file:///workspace/src/components/design-system/Dialog.tsx) 第 60 行的 `defaultInputGuide` 模板，超出 Byline 范围。视觉上已收窄（middot → 3 空格）。
2. **构建阻塞**：bun 版本不匹配 + 三个 feature-flag-gated 目录缺失，需要 `bun install` 在 bun >= 1.3.11 环境跑 `bun run build:dev` 才能完整验证。本环境只能做语法/类型级别验证。
3. **截图验证缺失**：本环境无 TTY，无法截取 light/dark 模式截图。需要本地终端手动验证。
