# Checklist — 重新设计 CLI 启动界面

## 品牌色映射
- [ ] `startupAccent` 浅色为 `#d97757`、深色为 `#e08769`
- [ ] `planMode` 浅色为 `#d97757`、深色为 `#e08769`
- [ ] `permission` 浅色为 `#6a9bcc`、深色为 `#7aabe0`
- [ ] `success` 浅色为 `#788c5d`、深色为 `#8aa071`
- [ ] `error` / `warning` 重新映射（仅改色不改名）
- [ ] `claude` / `claudeShimmer` 重新映射
- [ ] `clawd_body` / `clawd_background` 保持原值（未修改）

## LogoV2 外框
- [ ] iTerm2 / WezTerm 渲染 `╭─╮│╰─╯` 圆角
- [ ] Apple Terminal 回退 `┌─┐│└─┘` 方角
- [ ] 边框色为 `startupAccent`（品牌橙）

## 顶部品牌首字
- [ ] 第 1 行显示 `▌ Free Code v{VERSION}`
- [ ] `▌` 用 `startupAccent` 色
- [ ] "Free Code" 粗体 + `claude` 主色
- [ ] 80 / 120 / 160 列下不破版

## 简化 buddy
- [ ] 高度 6 行、宽度 9 列
- [ ] default / arms-up / look-left / look-right 4 个 pose 正常渲染
- [ ] Apple Terminal 走 `APPLE_EYES` 路径不破版
- [ ] `ClawdPose` 类型与所有调用点签名不变

## Welcome 信息
- [ ] "Welcome back {name}!" 左对齐
- [ ] model + organization 副标题分两行
- [ ] 80 列终端下文本完整不截断

## Feed 标题
- [ ] 右侧 Feed 标题显示为大写
- [ ] 标题前 4px 橙色竖条 `▌`
- [ ] 标题字母间有空格（letter-spacing 模拟）
- [ ] "RECENT ACTIVITY" / "WHAT'S NEW" 都已大写化

## 底部状态脚注
- [ ] 每项前圆形 icon（`●` 激活 / `○` 停用）
- [ ] 激活用 `success` 色，停用用 `inactive` 色
- [ ] 切换 model/permission 时 icon 实时变化
- [ ] 行间距 0.5

## 弹窗（UltraplanLaunchDialog / UltraplanChoiceDialog）
- [ ] 弹窗边框色为 `planMode`（品牌橙）
- [ ] 标题加粗
- [ ] 描述段落行高 1.4
- [ ] 弹窗宽度自适应终端

## 输入脚注
- [ ] 脚注为 `[↵] confirm   [esc] cancel` 形式
- [ ] 宽度 < 30 列
- [ ] 不影响 Dialog 默认 keybinding 行为

## 构建与启动
- [ ] `cd /workspace && bun run build:dev` 通过
- [ ] 生成 `./cli-dev` 可执行文件
- [ ] `./cli-dev` 启动时无运行时错误

## 视觉验收
- [ ] 浅色模式：欢迎屏顶部品牌首字、圆角外框、简化 buddy、Feed 大写标题、底部圆形 icon
- [ ] 深色模式：以上所有视觉在 `#141413` 背景上正常显示
- [ ] Apple Terminal：方角外框 + bg-fill buddy 正常
- [ ] 终端 80 列：所有信息不截断、不破版
- [ ] 终端 120 列：信息分布合理
- [ ] 终端 160 列：信息居中或左对齐可读

## 触发 ultraplan 弹窗
- [ ] 边框为品牌橙
- [ ] 标题加粗
- [ ] 选项菜单可上下选择
- [ ] Enter 触发 Launch，Esc 取消

## 兼容性
- [ ] 现有斜杠命令（/clear、/help 等）正常
- [ ] 现有工具（bash、file、search 等）正常
- [ ] 主题切换（/theme）正常
- [ ] 模型选择（/model）正常
- [ ] 会话创建、恢复、删除正常
