# Checklist — Web 端 Providers 页应用 Anthropic 品牌色

## brand token 注入 ✅/❓
- [ ] `web/src/app/globals.css` `:root` 块含 `--brand: oklch(0.65 0.13 50);`
- [ ] `web/src/app/globals.css` `.dark` 块含 `--brand: oklch(0.70 0.12 45);`
- [ ] `@theme inline` 块含 `--color-brand: var(--brand);`
- [ ] 浅色模式 `text-brand` 视觉为 `#d97757` 品牌橙
- [ ] 深色模式 `text-brand` 视觉为 `#e08769` 浅品牌橙

## Providers 页侧边栏 ✅/❓
- [ ] "模型提供商" 激活项背景 `bg-brand/10`
- [ ] 激活项文字 `text-brand`
- [ ] 非激活项保持 `text-muted-foreground hover:bg-muted hover:text-foreground`（不变）

## 顶部 brand 标识 ✅/❓
- [ ] 主内容区 "模型提供商" 标题前有 `<span class="text-brand mr-1">▌</span>` 竖条
- [ ] "▌" 颜色为品牌橙

## Provider 卡片选中态 ✅/❓
- [ ] 选中卡片边框 `border-brand/30`
- [ ] 选中卡片背景 `bg-brand/5`
- [ ] "N 模型" 徽标背景 `bg-brand/10`、文字 `text-brand`
- [ ] 非选中卡片保持 `border-border hover:bg-muted/50`（不变）

## 添加提供商按钮 ✅/❓
- [ ] 按钮 `className="bg-brand text-white hover:bg-brand/90"`
- [ ] 浅色模式按钮背景品牌橙
- [ ] 深色模式按钮背景浅品牌橙
- [ ] 鼠标悬停颜色变深（`bg-brand/90`）

## Fetched Models 多选框 ✅/❓
- [ ] 选中态 `border-brand bg-brand text-white`
- [ ] 未选中态 `border-muted-foreground/40 hover:border-muted-foreground`（不变）
- [ ] 已添加（alreadyAdded）态保持 `border-terminal-green bg-terminal-green text-background`（不变）

## 添加选中模型按钮 ✅/❓
- [ ] 按钮 `className="bg-brand text-white hover:bg-brand/90"`
- [ ] 选中 0 个模型时按钮不显示（保持原逻辑）

## 构建与 lint ✅/❓
- [ ] `cd /workspace/web && npm run build` 退出码 0
- [ ] `cd /workspace/web && npm run lint` 退出码 0
- [ ] `cd /workspace/web && npx vitest run` 全部通过
- [ ] 无新增 TypeScript 错误

## 部署验证 ✅/❓
- [ ] git commit + push 到 main 成功
- [ ] Vercel Production deployment `READY` / `PROMOTED`
- [ ] 访问 `https://mybiog.us.ci/settings/providers` 浅色模式可见 brand 橙
- [ ] 切换深色模式（系统设置）后访问，brand 色随主题变化

## 兼容性 ✅/❓
- [ ] 添加/编辑/删除 Provider 流程不受影响
- [ ] 测试连接 / 获取模型 / 新建模型 按钮功能不变
- [ ] Capability 徽标颜色决策（保留 cyan 或换 brand）按 tasks.md 2.8 执行
