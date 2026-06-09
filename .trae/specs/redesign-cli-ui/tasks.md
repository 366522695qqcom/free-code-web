# Tasks — 重新设计 CLI 启动界面

## Task 1: 重映射 theme token 为 Anthropic 品牌色
- [ ] SubTask 1.1: 打开 [utils/theme.ts](file:///workspace/src/utils/theme.ts)，定位以下 token 在所有主题（light/light-daltonized/light-ansi/dark/dark-daltonized/dark-ansi）的十六进制值
- [ ] SubTask 1.2: 按 [spec.md](file:///workspace/.trae/specs/redesign-cli-ui/spec.md#requirement-品牌色映射anthropic) 表格替换（**不动 `clawd_*`**）
- [ ] SubTask 1.3: 验证：`bun run build:dev` 通过；启动 `./cli-dev` 后 `/theme` 切换浅/深模式，色彩正确

## Task 2: LogoV2 外框圆角化
- [ ] SubTask 2.1: 在 [LogoV2.tsx](file:///workspace/src/components/LogoV2/LogoV2.tsx) 中找到外层 Pane/Box 边框渲染处
- [ ] SubTask 2.2: 改为 `╭─╮│╰─╯` 圆角字符（基于 [ink `Box borderStyle="round"`](file:///workspace/src/ink) 的封装）
- [ ] SubTask 2.3: 添加 `env.terminal === "Apple_Terminal"` 时回退到方角
- [ ] SubTask 2.4: 边框色用 `startupAccent` token

## Task 3: 顶部品牌首字
- [ ] SubTask 3.1: 在 LogoV2 顶部第 1 行加 `<Text>` 节点：`<Text color="startupAccent">▌ </Text><Text bold color="claude">Free Code</Text><Text dimColor> v{MACRO.VERSION}</Text>`
- [ ] SubTask 3.2: 若空间允许（>= 100 列），加一个 `  · Claude Code, free of telemetry` 副标识
- [ ] SubTask 3.3: 验证：终端 80 / 120 / 160 列均显示

## Task 4: 简化 buddy 重绘
- [ ] SubTask 4.1: 重写 [Clawd.tsx](file:///workspace/src/components/LogoV2/Clawd.tsx) 的 `POSES` 常量（高度 6 行，宽度 9 列）
- [ ] SubTask 4.2: 保留 4 个 pose 的 `Segments` API 不变
- [ ] SubTask 4.3: 保留 `APPLE_EYES` 回退实现（Apple Terminal 使用 bg-fill）
- [ ] SubTask 4.4: 验证：默认 / 看左 / 看右 / 举手 4 个 pose 视觉正确

## Task 5: Welcome 信息左对齐
- [ ] SubTask 5.1: 在 LogoV2 渲染 "Welcome back {name}!" 的位置，改为左对齐
- [ ] SubTask 5.2: 副标题（model + organization）保留当前 `claude` 主色 + dimColor 区分
- [ ] SubTask 5.3: 验证：80 列终端下文本不被截断

## Task 6: Feed 小标题大写化 + 竖条
- [ ] SubTask 6.1: 在 [feedConfigs.tsx](file:///workspace/src/components/LogoV2/feedConfigs.tsx) 的标题渲染前加 `<Text color="startupAccent">▌ </Text>`
- [ ] SubTask 6.2: 标题文本大写（`"Recent activity".toUpperCase()`）
- [ ] SubTask 6.3: 字间加一个空格（letter-spacing 模拟）
- [ ] SubTask 6.4: 验证：`./cli-dev` 启动时右栏显示 "▌ RECENT ACTIVITY" / "▌ WHAT'S NEW"

## Task 7: 底部状态脚注圆形 icon
- [ ] SubTask 7.1: 在 LogoV2 状态行（model / permission / effort）每项前加 `<Text color={...}>●</Text>` 或 `○`
- [ ] SubTask 7.2: 激活状态用 `success` 色，停用用 `inactive` 色
- [ ] SubTask 7.3: 行间距从 0 调到 0.5（`Box gap` 或 `marginTop`）

## Task 8: Ultraplan 弹窗品牌化
- [ ] SubTask 8.1: [UltraplanLaunchDialog.tsx](file:///workspace/src/components/UltraplanLaunchDialog.tsx) 改 `<Dialog color="planMode">`
- [ ] SubTask 8.2: 标题 "Launch ultraplan?" 保持粗体
- [ ] SubTask 8.3: 描述段落行高 1.4（`<Box flexDirection="column" gap={0}>`）
- [ ] SubTask 8.4: [UltraplanChoiceDialog.tsx](file:///workspace/src/components/UltraplanChoiceDialog.tsx) 同步应用

## Task 9: 输入脚注紧凑化
- [ ] SubTask 9.1: 在 [Byline.tsx](file:///workspace/src/components/design-system/Byline.tsx) 的默认渲染处，替换为 `[↵] confirm   [esc] cancel`
- [ ] SubTask 9.2: 验证：Dialog 脚注宽度 < 30 列

## Task 10: 构建与验证
- [ ] SubTask 10.1: `cd /workspace && bun run build:dev` 通过
- [ ] SubTask 10.2: `./cli-dev` 启动，截图保存为 `/tmp/cli-redesign-light.png` 与 `/tmp/cli-redesign-dark.png`
- [ ] SubTask 10.3: 在 Apple Terminal（如果可用）跑一次，确认方角回退生效
- [ ] SubTask 10.4: 终端宽度 80 / 120 / 160 各跑一次，布局不破版
- [ ] SubTask 10.5: 触发 ultraplan 弹窗，截图保存

## Task Dependencies
- Task 2-9 依赖 Task 1（theme token）完成
- Task 4 独立（Clawd 重画）
- Task 10 依赖 Task 1-9 全部完成

## 并行可执行
- Task 4（Clawd 重画）与 Task 6（Feed 标题）可并行
- Task 8（弹窗）与 Task 9（脚注）可并行
