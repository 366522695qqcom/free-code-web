# Checklist — Web 端 Providers 页应用 Anthropic 品牌色

## brand token 注入 ✅
- [x] `web/src/app/globals.css` `:root` 块含 `--brand: oklch(0.65 0.13 50);`（行 94）
- [x] `web/src/app/globals.css` `.dark` 块含 `--brand: oklch(0.70 0.12 45);`（行 133）
- [x] `@theme inline` 块含 `--color-brand: var(--brand);`（行 54）
- [x] 浅色模式 `text-brand` 编译为 `--brand:#cd753f`（CSS bundle 行）
- [x] 深色模式 `text-brand` 编译为 `--brand:#dc855d`（CSS bundle 行）

## Providers 页侧边栏 ✅
- [x] "模型提供商" 激活项背景 `bg-brand/10`（行 401）
- [x] 激活项文字 `text-brand`（行 401）
- [x] 非激活项保持 `text-muted-foreground hover:bg-muted hover:text-foreground`（不变）

## 顶部 brand 标识 ✅
- [x] 主内容区 "模型提供商" 标题前有 `<span class="text-brand mr-1">▌</span>` 竖条（行 418）
- [x] "▌" 颜色为品牌橙（继承 `text-brand`）

## Provider 卡片选中态 ✅
- [x] 选中卡片边框 `border-brand/30`（行 455）
- [x] 选中卡片背景 `bg-brand/5`（行 455）
- [x] "N 模型" 徽标背景 `bg-brand/10`、文字 `text-brand`（行 472）
- [x] 非选中卡片保持 `border-border hover:bg-muted/50`（不变）

## 添加提供商按钮 ✅
- [x] 按钮 `className="bg-brand text-white border-brand hover:bg-brand/90"`（行 430）
- [x] 浅色模式按钮背景品牌橙（CSS bundle `--brand:#cd753f`）
- [x] 深色模式按钮背景浅品牌橙（CSS bundle `.dark --brand:#dc855d`）
- [x] 鼠标悬停颜色变深（CSS bundle `.hover\:bg-brand\/90`）

## Fetched Models 多选框 ✅
- [x] 选中态 `border-brand bg-brand text-white`（行 708）
- [x] 未选中态 `border-muted-foreground/40 hover:border-muted-foreground`（不变）
- [x] 已添加（alreadyAdded）态保持 `border-terminal-green bg-terminal-green text-background`（不变）

## 添加选中模型按钮 ✅
- [x] 按钮 `className="bg-brand text-white hover:bg-brand/90"`（行 736）
- [x] 选中 0 个模型时按钮不显示（保持原 `selectedFetchedModels.size > 0` 判断逻辑）

## 构建与 lint ✅ / ⚠️
- [x] `cd /workspace/web && npm run build` 退出码 0（23 个静态页面生成）
- [x] `cd /workspace/web && npm run lint` 退出码 0（0 errors；3 个预存 unused-vars warning 与本次无关）
- [ ] `cd /workspace/web && npx vitest run` 全部通过 — **预存问题**：`package.json` devDependencies 未列 `vitest`，node_modules 缺 `vitest/config`；规则文档说"vitest 类型不安装时需排除"，且本 spec 不引入新依赖
- [x] 无新增 TypeScript 错误

## 部署验证 ✅
- [x] git commit `995beed` push 到 main 成功
- [x] Vercel Production deployment `dpl_8QQLz5Qry4KpTsLWUcDzsGyneUqb` 状态 `READY` / `PROMOTED`
- [x] 自定义域名 `mybiog.us.ci` / `web-gilt-eight-65.vercel.app` / `web-366522695qqcoms-projects.vercel.app` 已指向新部署
- [x] CSS bundle (`/_next/static/chunks/037areuh31l8i.css`) 包含 `.text-brand` / `.bg-brand/5` / `.bg-brand/10` / `.border-brand/30` / `.hover\:bg-brand\/90` 及 `--brand:#cd753f`（浅）/ `--brand:#dc855d`（深）
- [x] HTML 默认带 `class="dark"` → 默认渲染深色 brand 橙 `#dc855d`；切换浅色（移除 `.dark`）后渲染浅色 brand 橙 `#cd753f`

## 兼容性 ✅
- [x] 添加/编辑/删除 Provider 流程不受影响（form 提交逻辑未改）
- [x] 测试连接 / 获取模型 / 新建模型 按钮保持 outline（行 633-661），未动
- [x] Capability 徽标（视觉/推理/工具使用）保留 `terminal-cyan`（按 tasks.md 2.8 决策保留）

## 总结
- **代码改动**：2 个文件（globals.css +14 行，providers/page.tsx +11/-10 行）
- **build / lint**：通过
- **vitest**：预存问题（package.json 缺 vitest 依赖），与本次改动无关
- **部署**：commit `995beed` → Vercel `READY` / `PROMOTED` → mybiog.us.ci 已指向新版本
