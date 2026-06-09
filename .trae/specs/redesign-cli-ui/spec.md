# 重新设计 CLI 启动界面 Spec

## Why
当前 CLI 启动时（`./cli-dev` 或 `npm run dev`）的欢迎界面是 ASCII 矩形边框 + 像素 buddy sprite + 朴素的 1/2 行选项菜单（参考用户截图）。视觉风格偏"通用 ANSI 终端工具"，缺乏 Anthropic 品牌识别度。需要保留功能与终端兼容性，重做以下三处：欢迎主屏（`LogoV2`）、底部状态脚注、关键交互弹窗（`UltraplanLaunchDialog` / `UltraplanChoiceDialog`），让视觉更精致、更具品牌识别度。

## What Changes
- **重做欢迎主屏边框**：把当前的 `┌─┐`/`└─┘` 单线方角边框替换为 `╭─╮` / `╰─╯` **圆角边框**（带 fallback 检测）；边框色采用品牌橙 `#d97757`，主标题色用品牌暗 `#141413` 浅色 / `#faf9f5` 深色
- **替换 buddy 占位图**：把当前 [Clawd.tsx](file:///workspace/src/components/LogoV2/Clawd.tsx) 像素方块换成更小的、含眼睛和微笑的极简字符画（约 9×6 行）；保留"pose"参数 API 行为不变
- **加品牌首字大标**：在欢迎框顶部加一行 "▌ Free Code" 标识（橙色竖条 + 等宽品牌名），约 1 行高度
- **重做左栏 Welcome 信息**：把 "Welcome back {name}!" 从居中改为左对齐，副标题分两行：`Opus 4.6 (1M context) with hi…` 与 `paolo@gladium.ai's Organization` 用不同明度区分
- **重做右栏 Feed**：把 "Recent activity" / "What's new" 两个 `<Divider>` 横线替换为左侧 4px 橙色竖条 + 小标题大写字母 "RECENT ACTIVITY"（letter-spacing 模拟），并增加 1 行空隙
- **重做底部状态脚注**：当前使用 `dimColor` 平铺，改为带圆形 icon（`●` 绿 / `○` 灰）的小型 status row，浅色 + 深色模式各自配色
- **重做交互弹窗**：[UltraplanLaunchDialog.tsx](file:///workspace/src/components/UltraplanLaunchDialog.tsx) 与 [UltraplanChoiceDialog.tsx](file:///workspace/src/components/UltraplanChoiceDialog.tsx) 改用 `Dialog` 的 `color="planMode"` token（淡橙色），底部脚注加 "Enter to confirm · Esc to cancel" 改为更紧凑的 `[↵] confirm  [esc] cancel` 形式

## Impact
- **Affected specs**: 无
- **Affected code**:
  - [LogoV2/LogoV2.tsx](file:///workspace/src/components/LogoV2/LogoV2.tsx) — 整体布局微调
  - [LogoV2/WelcomeV2.tsx](file:///workspace/src/components/LogoV2/WelcomeV2.tsx) — 标题与上边框
  - [LogoV2/Clawd.tsx](file:///workspace/src/components/LogoV2/Clawd.tsx) — buddy 重画
  - [LogoV2/FeedColumn.tsx](file:///workspace/src/components/LogoV2/FeedColumn.tsx) — Feed 容器
  - [LogoV2/Feed.tsx](file:///workspace/src/components/LogoV2/Feed.tsx) — 单个 Feed 卡片
  - [LogoV2/feedConfigs.tsx](file:///workspace/src/components/LogoV2/feedConfigs.tsx) — "Recent activity" / "What's new" 标题
  - [LogoV2/CondensedLogo.tsx](file:///workspace/src/components/LogoV2/CondensedLogo.tsx) — 顶部小品牌标
  - [LogoV2/Divider.tsx](file:///workspace/src/components/LogoV2/Divider.tsx) — 若涉及小竖条
  - [components/UltraplanLaunchDialog.tsx](file:///workspace/src/components/UltraplanLaunchDialog.tsx) — 弹窗样式
  - [components/UltraplanChoiceDialog.tsx](file:///workspace/src/components/UltraplanChoiceDialog.tsx) — 弹窗样式
  - [components/design-system/Dialog.tsx](file:///workspace/src/components/design-system/Dialog.tsx) — `inputGuide` 显示形式（可选）
  - [components/design-system/Byline.tsx](file:///workspace/src/components/design-system/Byline.tsx) — `[↵] confirm` 形式（可选）
- **新增文件**: 无
- **删除/简化**: 不动 `theme.ts` 中的 token 命名，只调整映射值

## ADDED Requirements

### Requirement: 圆角边框支持
系统 SHALL 在 [LogoV2.tsx](file:///workspace/src/components/LogoV2/LogoV2.tsx) 的外层 Pane 使用圆角 Unicode 字符 `╭─╮│╰─╯`，在 `env.terminal` 为 `Apple_Terminal`（已知不支持宽字符）时回退到 `┌─┐│└─┘`。

#### Scenario: 现代终端渲染
- **WHEN** 终端为 iTerm2 / WezTerm / Alacritty / VS Code
- **THEN** LogoV2 外框呈现圆角 `╭` / `╯`，视觉上更柔和

#### Scenario: Apple Terminal 回退
- **WHEN** `env.terminal === "Apple_Terminal"`
- **THEN** LogoV2 外框使用 `┌─┐` 矩形，宽度字符不破版

### Requirement: 品牌色映射（Anthropic）
系统 SHALL 在 [utils/theme.ts](file:///workspace/src/utils/theme.ts) 中将以下 token 重新映射为 Anthropic 品牌色（仅改十六进制值，不改 token 名与下游 API）：

| Token | 浅色 | 深色 |
|---|---|---|
| `startupAccent` | `#d97757`（品牌橙） | `#e08769`（浅橙） |
| `planMode` | `#d97757` | `#e08769` |
| `permission` | `#6a9bcc`（品牌蓝） | `#7aabe0`（浅蓝） |
| `success` | `#788c5d`（品牌绿） | `#8aa071`（浅绿） |
| `error` | `#c14545` | `#d96565` |
| `warning` | `#d9a259` | `#e8b774` |
| `claude` | `#141413` | `#faf9f5` |
| `claudeShimmer` | `#3a3a37` | `#b0aea5` |

**严禁修改**：`clawd_body` / `clawd_background`（保持原值，保证 buddy 角色视觉一致）。

#### Scenario: 深浅模式色彩正确
- **WHEN** 切换 theme 为 `dark` 或 `light-daltonized`
- **THEN** 上述 token 输出对应模式的十六进制值（验证：`/logos` 命令或 LSP 截屏）

### Requirement: 简化 buddy 重绘
系统 SHALL 重画 [Clawd.tsx](file:///workspace/src/components/LogoV2/Clawd.tsx)：
- 高度从 9 行降到 6 行，宽度保持 9 列
- 4 种 pose（default / arms-up / look-left / look-right）保留
- 视觉更圆（用 `●` / `o` 替代 `▙▟▛▜`）
- 保持 `ClawdPose` 类型与所有调用点不变

#### Scenario: 渲染 buddy
- **WHEN** LogoV2 渲染中
- **THEN** 中间位置显示一个 6×9 字符画的简化角色（圆眼睛、微笑），下方留 1 行

### Requirement: 品牌首字
系统 SHALL 在 LogoV2 顶部第 1 行增加品牌标识：
```
▌ Free Code
```
- `▌` 用 `startupAccent` 色（品牌橙）
- "Free Code" 用 `claude` 主色 + 粗体
- 后面紧跟一个版本号 `v{VERSION}`（dimColor）

#### Scenario: 启动时显示
- **WHEN** CLI 启动完成
- **THEN** 第 1 行可见品牌标识

### Requirement: Feed 小标题大写化
系统 SHALL 在 [feedConfigs.tsx](file:///workspace/src/components/LogoV2/feedConfigs.tsx) 中：
- 把 "Recent activity" / "What's new" 的渲染改为大写 + letter-spacing（用空格模拟）
- 在标题前加 4px 橙色竖条（`▌` 用 startupAccent 色）

#### Scenario: 渲染右栏
- **WHEN** FeedColumn 渲染中
- **THEN** "RECENT ACTIVITY" 与 "WHAT'S NEW" 标题以大写形式呈现，左侧有橙色竖条

### Requirement: 底部状态脚注
系统 SHALL 替换 LogoV2 底部状态区（model/permission/effort 行）：
- 每项前加圆形 icon（`●` 激活 / `○` 停用）
- 行间距从 0 改为 0.5
- 文字 dimColor 保持

#### Scenario: 状态变化
- **WHEN** 切换 model 或 permission
- **THEN** 对应行前的 icon 实时变 `●`/`○`

### Requirement: 弹窗使用 planMode 颜色
系统 SHALL 在 [UltraplanLaunchDialog.tsx](file:///workspace/src/components/UltraplanLaunchDialog.tsx) 与 [UltraplanChoiceDialog.tsx](file:///workspace/src/components/UltraplanChoiceDialog.tsx) 中：
- `<Dialog color="planMode">`（替换默认的 `permission`）
- 标题 "Launch ultraplan?" 用粗体 + 品牌橙
- 描述段落行高 1.4

#### Scenario: 渲染弹窗
- **WHEN** 启动 ultraplan 流程
- **THEN** 弹窗边框为品牌橙色，标题加粗

### Requirement: 输入脚注紧凑化
系统 SHALL 重写 [Byline.tsx](file:///workspace/src/components/design-system/Byline.tsx) 的默认渲染：
- 旧：`Enter to confirm · Esc to cancel`
- 新：`[↵] confirm   [esc] cancel`
- 等宽字体保证对齐

#### Scenario: 显示脚注
- **WHEN** 任何 Dialog 渲染底部
- **THEN** 脚注为 `[↵] confirm   [esc] cancel` 形式，宽度 < 30 列

## MODIFIED Requirements
无（纯视觉调整，不改交互行为）

## REMOVED Requirements
无

## 验证标准（karpathy-guidelines "Goal-Driven Execution"）

1. `cd /workspace && bun run build:dev` 通过（生成 `./cli-dev`）
2. `./cli-dev` 在本地终端启动，能看到：
   - 顶部第 1 行 `▌ Free Code v2.1.87-dev.xxx`
   - 圆角外框（iTerm2）或方角外框（Apple Terminal）
   - 简化 6 行 buddy
   - 右栏 "RECENT ACTIVITY" / "WHAT'S NEW" 大写 + 橙色竖条
3. 触发 ultraplan 弹窗：
   - 边框为品牌橙
   - 底部脚注 `[↵] confirm   [esc] cancel`
4. 切换 theme（`/theme` 命令）到 dark / light / daltonized 三档，色彩不破版
5. 终端宽度 80 / 120 / 160 三档，布局不破版
6. Apple Terminal 回退方案生效（`env.terminal === "Apple_Terminal"`）
7. 现有功能（启动后输入、模型选择、命令执行）不受影响

## 不做的事（karpathy-guidelines "Simplicity First"）

- 不动 `commands.ts` / `tools.ts` / `QueryEngine.ts` 等核心逻辑
- 不引入新依赖（仅用现有 Ink + chalk）
- 不替换 ASCII 字符为图形（如 Nerd Font icons）— 兼容性优先
- 不修改 theme token 命名（仅映射十六进制值）
- 不实现新动画（仅静态美化）
- 不重写 `Pane` / `Dialog` / `Divider` 的内部实现，只调整传入 props
- 不修改 model picker / theme picker 等已成熟组件
