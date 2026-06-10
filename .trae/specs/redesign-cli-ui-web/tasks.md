# Tasks — Web 端 Providers 页应用 Anthropic 品牌色

## Task 1: 在 globals.css 注入 brand 色 token
- [ ] SubTask 1.1: 在 `:root` 块加 `--brand: oklch(0.65 0.13 50);`（≈ `#d97757`）
- [ ] SubTask 1.2: 在 `.dark` 块加 `--brand: oklch(0.70 0.12 45);`（≈ `#e08769`）
- [ ] SubTask 1.3: 在 `@theme inline` 块加 `--color-brand: var(--brand);`，启用 Tailwind `text-brand` / `bg-brand` / `border-brand` / `bg-brand/N` / `border-brand/N`

## Task 2: Providers 页应用 brand 色
- [ ] SubTask 2.1: 侧边栏激活项：`bg-accent text-accent-foreground` → `bg-brand/10 text-brand`
- [ ] SubTask 2.2: 顶部主标题前加 `<span className="text-brand mr-1">▌</span>` 竖条
- [ ] SubTask 2.3: Provider 卡片选中态：`border-terminal-cyan/30 bg-terminal-cyan/5` → `border-brand/30 bg-brand/5`
- [ ] SubTask 2.4: "N 模型" 徽标：`bg-terminal-cyan/10 text-terminal-cyan` → `bg-brand/10 text-brand`
- [ ] SubTask 2.5: "添加提供商" 按钮加 `className="bg-brand text-white hover:bg-brand/90"`
- [ ] SubTask 2.6: Fetched Models 多选框选中态：`border-terminal-cyan bg-terminal-cyan` → `border-brand bg-brand`
- [ ] SubTask 2.7: "添加选中的模型" 按钮加 `className="bg-brand text-white hover:bg-brand/90"`
- [ ] SubTask 2.8: 模型 capability 徽标（视觉/推理/工具使用）`bg-terminal-cyan/10 text-terminal-cyan` → `bg-brand/10 text-brand`（**可选**——保持 cyan 也可，因为这是辅助信息）

## Task 3: 验证
- [ ] SubTask 3.1: `cd /workspace/web && npm run build` 通过
- [ ] SubTask 3.2: `cd /workspace/web && npm run lint` 通过
- [ ] SubTask 3.3: `cd /workspace/web && npx vitest run` 通过
- [ ] SubTask 3.4: 本地 dev 服务器 `npm run dev` 启动后访问 `/settings/providers`，人工目检 brand 色

## Task 4: 推送到 GitHub + Vercel
- [ ] SubTask 4.1: 提交并 push 到 main
- [ ] SubTask 4.2: 等 Vercel 部署完成（curl api.vercel.com 查 latest deployment）
- [ ] SubTask 4.3: 访问 `https://mybiog.us.ci/settings/providers` 验证视觉

## Task Dependencies
- Task 2 依赖 Task 1（brand token 必须先注入）
- Task 3 依赖 Task 1 + Task 2
- Task 4 依赖 Task 3

## 并行可执行
- Task 1 与 SubTask 2.8（capability 徽标颜色决策）独立可先做
