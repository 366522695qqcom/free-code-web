# Web 端 Providers 页应用 Anthropic 品牌色 Spec

## Why
之前的 `redesign-cli-ui` spec 把 CLI 端 (`./cli-dev`) 启动界面改成了 Anthropic 品牌色（`#d97757` 橙、圆角外框、简化 buddy、Feed 大写化），但这些改动只存在于 CLI 端的 Ink TUI 组件里，**不在 web 端的 Next.js 产物中**。Vercel 部署 `mybiog.us.ci` 是 web 端（`/workspace/web/`），所以用户打开看到的是 shadcn/ui 默认色，UI 没有变化。

需要把 CLI 端的 brand 色同步到 web 端的 `/settings/providers` 页（CLI ↔ web 集成的核心页），至少让 web 端这一页看上去与 CLI 启动屏是同一套品牌。

## What Changes
- **范围极小**：只改 `web/src/app/settings/providers/page.tsx` + `web/src/app/globals.css`，**不动 chat 主页、其它设置页、布局组件**
- 在 `globals.css` 注入 `--color-brand` token（Anthropic 品牌橙 `#d97757`，浅色模式；深色模式 `#e08769`）
- `/settings/providers` 页：
  - 侧边栏激活项背景用 brand 橙（替代 `bg-accent`）
  - Provider 卡片选中态边框 + 背景用 brand 橙 30% / 5%
  - "添加提供商" / "添加选中的模型" 主按钮用 brand 橙
  - Fetched Models 多选框选中用 brand 橙填充
  - 模型 "N 模型" 徽标背景用 brand 橙
  - 已连接成功提示用现有 `terminal-green`（保留）
- 顶部标题加 `▌` 橙色竖条 + "模型提供商" 保持原文（不强制大写，**仅在标题前加竖条**）
- 保持现有 `font-mono` + `bg-background` 不变
- 保留所有现有交互逻辑（添加/编辑/删除/测试/获取模型）

**BREAKING**: 无

## Impact
- **Affected specs**: 无
- **Affected code**:
  - [web/src/app/globals.css](file:///workspace/web/src/app/globals.css) — 加 `--color-brand` 变量
  - [web/src/app/settings/providers/page.tsx](file:///workspace/web/src/app/settings/providers/page.tsx) — 替换 cyan 类名 → brand 类名
- **新增文件**: 无
- **删除/简化**: 无

## ADDED Requirements

### Requirement: brand 色 token
系统 SHALL 在 [globals.css](file:///workspace/web/src/app/globals.css) 添加：
```css
:root {
  --brand: oklch(0.65 0.13 50);   /* ≈ #d97757 品牌橙，浅色 */
}
.dark {
  --brand: oklch(0.70 0.12 45);   /* ≈ #e08769 品牌橙，深色 */
}
```
并在 `@theme inline` 块添加 `--color-brand: var(--brand);` 让 Tailwind 工具类 `text-brand` / `bg-brand` / `border-brand` 可用。

#### Scenario: 浅色模式渲染
- **WHEN** `html` 不带 `.dark` 类
- **THEN** `text-brand` 显示 `#d97757` 橙色

#### Scenario: 深色模式渲染
- **WHEN** `html.dark` 类启用
- **THEN** `text-brand` 显示 `#e08769` 浅橙色

### Requirement: Providers 页侧边栏激活项
系统 SHALL 在 Providers 页左侧设置导航的"模型提供商"激活项上用 brand 色：背景 `bg-brand/10` + 文字 `text-brand`。

#### Scenario: 渲染
- **WHEN** 用户在 `/settings/providers`
- **THEN** 侧边栏"模型提供商"项背景为淡橙色、文字为品牌橙

### Requirement: Provider 卡片选中态
系统 SHALL 在 Provider 列表卡片选中态用 brand 色：边框 `border-brand/30` + 背景 `bg-brand/5`，徽标背景 `bg-brand/10` + 文字 `text-brand`。

#### Scenario: 选中 Provider
- **WHEN** 用户点击某个 Provider 卡片
- **THEN** 该卡片边框淡橙、背景淡橙、"N 模型" 徽标橙色

### Requirement: 主操作按钮 brand 色
系统 SHALL 在"添加提供商"、"添加选中的模型"主按钮上用 `bg-brand text-white hover:bg-brand/90`。

#### Scenario: 添加提供商按钮
- **WHEN** 用户点击"添加提供商"按钮
- **THEN** 按钮背景为品牌橙

#### Scenario: 添加选中模型按钮
- **WHEN** 用户勾选 fetched 模型后点击"添加选中的模型"
- **THEN** 按钮背景为品牌橙

### Requirement: Fetched Models 多选框 brand 色
系统 SHALL 在 fetched models 多选框选中态用 `bg-brand border-brand text-white`。

#### Scenario: 勾选模型
- **WHEN** 用户点击多选框
- **THEN** 选中态填充品牌橙背景 + 白勾

### Requirement: 顶部 brand 标识
系统 SHALL 在 `/settings/providers` 主内容顶部标题前加 `<span class="text-brand">▌</span>` 竖条（与 CLI 端 LogoV2 顶部 brand 标识一致）。

#### Scenario: 渲染
- **WHEN** 用户进入 Providers 页
- **THEN** 标题 "模型提供商" 前面有橙色 `▌` 竖条

## MODIFIED Requirements
无（保留所有原有交互逻辑）

## REMOVED Requirements
无

## 验证标准
1. `cd /workspace/web && npm run build` 通过
2. `cd /workspace/web && npm run lint` 通过
3. `cd /workspace/web && npx vitest run` 通过
4. 浅色模式访问 `/settings/providers`：侧边栏激活项淡橙、Provider 卡片选中态淡橙、添加按钮橙色、多选框选中橙色
5. 深色模式（`<html class="dark">`）：以上所有 brand 色在 `#faf9f5` 背景上对比度足够
6. 现有添加/编辑/删除/测试/获取模型流程不受影响

## 不做的事
- 不动 chat 主页（`web/src/app/page.tsx`）
- 不动 MCP 页（`web/src/app/mcp/page.tsx`）
- 不动其他设置页
- 不引入新依赖
- 不改 Tailwind 配置（用 inline @theme 已足够）
- 不改 brand token 以外的任何 CSS 变量
