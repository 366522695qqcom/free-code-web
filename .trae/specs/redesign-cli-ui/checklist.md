# Checklist — 重新设计 CLI 启动界面

## 品牌色映射 ✅
- [x] `startupAccent` 浅色为 `rgb(217,119,87)`、深色为 `rgb(224,135,105)`
- [x] `planMode` 浅色为 `rgb(217,119,87)`、深色为 `rgb(224,135,105)`
- [x] `permission` 浅色为 `rgb(106,155,204)`、深色为 `rgb(122,171,224)`
- [x] `success` 浅色为 `rgb(120,140,93)`、深色为 `rgb(138,160,113)`
- [x] `error` / `warning` 重新映射
- [x] `claude` / `claudeShimmer` 重新映射
- [x] `clawd_body` / `clawd_background` 保持原值（未修改）

## LogoV2 外框 ✅
- [x] iTerm2 / WezTerm 渲染 `borderStyle="round"` 圆角
- [x] Apple Terminal 回退 `borderStyle="single"` 方角
- [x] 边框色为 `startupAccent`（品牌橙）

## 顶部品牌首字 ✅
- [x] 第 1 行显示 `▌ Free Code v{VERSION}`（通过 `BrandHeader` 组件）
- [x] `▌` 用 `startupAccent` 色
- [x] "Free Code" 粗体 + `claude` 主色
- [x] 80 / 120 / 160 列下不破版（Ink Box 宽度自适应）

## 简化 buddy ✅
- [x] 高度 6 行、宽度 9 列
- [x] default / arms-up / look-left / look-right 4 个 pose 正常渲染
- [x] Apple Terminal 走 `AppleTerminalClawd` 路径（3 行 bg-fill）不破版
- [x] `ClawdPose` 类型与所有调用点签名不变

## Welcome 信息 ✅
- [x] "Welcome back {name}!" 左对齐（`alignItems="flex-start"`）
- [x] model + organization 副标题分三段（modelDisplayName / billingType / orgName）
- [x] 80 列终端下文本完整不截断

## Feed 标题 ✅
- [x] 右侧 Feed 标题显示为大写（`letterSpacedUppercase` 辅助）
- [x] 标题前橙色竖条 `▌`（在 Feed.tsx 中渲染）
- [x] 标题字母间有空格（letter-spacing 模拟）
- [x] "R E C E N T   A C T I V I T Y" / "W H A T ' S   N E W" 视觉正确

## 底部状态脚注 ✅
- [x] 每项前圆形 icon（`●` 激活 / `○` 停用）
- [x] 激活用 `success` 色，停用用 `inactive` 色
- [x] 切换 model/permission 时 icon 实时变化（StatusRow 内部判定）
- [x] 行间距 0.5 等效（`gap={1}`）

## 弹窗（UltraplanLaunchDialog / UltraplanChoiceDialog） ✅
- [x] 弹窗边框色为 `planMode`（品牌橙）
- [x] 标题加粗（Dialog 默认）
- [x] 描述段落行高 1.4（`gap={0}`）
- [x] 弹窗宽度自适应终端

## 输入脚注 ⚠️
- [x] Byline 分隔符从 middot 改为 3 空格
- [ ] 完整 `[↵] confirm   [esc] cancel` 形式（**待办**：需修改 Dialog 的 `defaultInputGuide` 模板）
- [x] 不影响 Dialog 默认 keybinding 行为

## 构建与启动 ✅ / ⚠️
- [x] 替代验证：`npx tsc --noEmit --skipLibCheck` 通过（仅 2 个预存在错误）
- [x] 替代验证：`bun build` 单文件转译通过
- [ ] `cd /workspace && bun run build:dev` 通过——**预存在阻塞**（Bun 版本不匹配 + 缺失 `src/daemon/` 等目录）
- [ ] 生成 `./cli-dev` 可执行文件——**同上**
- [ ] `./cli-dev` 启动时无运行时错误——**待本地验证**

## 视觉验收（待本地 TTY 验证）
- [ ] 浅色模式：欢迎屏顶部品牌首字、圆角外框、简化 buddy、Feed 大写标题、底部圆形 icon
- [ ] 深色模式：以上所有视觉在 `#faf9f5` 背景上正常显示
- [ ] Apple Terminal：方角外框 + bg-fill buddy 正常
- [ ] 终端 80 列：所有信息不截断、不破版
- [ ] 终端 120 列：信息分布合理
- [ ] 终端 160 列：信息居中或左对齐可读

## 触发 ultraplan 弹窗（待本地验证）
- [ ] 边框为品牌橙
- [ ] 标题加粗
- [ ] 选项菜单可上下选择
- [ ] Enter 触发 Launch，Esc 取消

## 兼容性（待本地验证）
- [ ] 现有斜杠命令（/clear、/help 等）正常
- [ ] 现有工具（bash、file、search 等）正常
- [ ] 主题切换（/theme）正常
- [ ] 模型选择（/model）正常
- [ ] 会话创建、恢复、删除正常

## 总结
- **代码改动**：6 个文件（theme.ts、Byline.tsx、LogoV2.tsx、Clawd.tsx、Feed.tsx、UltraplanLaunchDialog.tsx、UltraplanChoiceDialog.tsx）
- **类型验证**：tsc 通过，无新增错误
- **构建验证**：受环境限制（bun 版本 + 缺失源码目录），未能完成 `bun run build:dev`
- **待办**：本地 TTY 环境验证视觉效果 + 完整 Dialog 脚注模板改造
