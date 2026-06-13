# Tasks — 输入框只允许文字模型

## Task 1: 新增共享工具函数 isTextModel
- [x] SubTask 1.1: 新建 `web/src/lib/providers/filter.ts`，export `isTextModel(model: { modelType?: "chat" | "embedding" | "image" | string }): boolean`
  - 返回 `model.modelType !== "image" && model.modelType !== "embedding"`
  - 无 modelType 时返回 `true`（与 db default `"chat"` 一致）
- [x] SubTask 1.2: 在文件顶部加 doc comment，说明用途

## Task 2: 在 chat-layout.tsx 拉取逻辑过滤
- [x] SubTask 2.1: import `isTextModel`
- [x] SubTask 2.2: 行 56-72 `for (const model of provider.models || [])` 内加 `if (!isTextModel(model)) continue;`
- [x] SubTask 2.3: 检查 /模型 子菜单、topbar 当前 model 渲染：当前 `currentModel` 为空且 `customModels` 全部为 image 时提示"还没有文字模型"
  - 实现：行 438 `currentModelName` 处：chat-layout 过滤后 `customModels.length === 0` 时 `currentModelName` 自然为""，不影响 UI

## Task 3: 在 topbar.tsx 拉取逻辑过滤
- [x] SubTask 3.1: import `isTextModel`（无需 — topbar 用 chat-layout 传入的已过滤 props，避免 unused-import warning）
- [x] SubTask 3.2: 拉取逻辑内加 `if (!isTextModel(model)) continue;`（无需 — props 已在 chat-layout 过滤）
- [x] SubTask 3.3: 顶栏 model 下拉框空时显示浅色提示"还没有文字模型"（L109-113 `DropdownMenuContent` 空态）

## Task 4: 在 settings/page.tsx 拉取逻辑过滤
- [x] SubTask 4.1: import `isTextModel`（L41）
- [x] SubTask 4.2: 行 145-161 拉取 /api/providers 的循环内加 `if (!isTextModel(m)) continue;`（L154）
- [x] SubTask 4.3: SelectContent 在 `providerModels.length === 0` 时显示"还没有文字模型，请先在模型提供商添加 chat 类型模型"（L360-368）

## Task 5: 在 /settings/providers Provider 卡片显示非 chat 模型徽标
- [x] SubTask 5.1: 找到 Provider 卡片中模型列表的渲染（约行 770-810）
- [x] SubTask 5.2: 给 `type: "image"` 模型加 "图像" 浅灰徽标（L789）
- [x] SubTask 5.3: 给 `type: "embedding"` 模型加 "向量" 浅灰徽标（L790）
- [x] SubTask 5.4: Provider 卡片底部"X 模型" 徽标计数仍按总模型数（不只算 chat）— 保持不变
- [x] SubTask 5.5: 在 Provider 卡片底部加一行小字提示："其中 N 个为文字模型，可在 chat 中使用"（L820-833）

## Task 6: 验证
- [x] SubTask 6.1: `cd /workspace/web && npm run build` 通过（退出码 0）
- [x] SubTask 6.2: `cd /workspace/web && npm run lint` 通过（0 errors, 3 pre-existing warnings）
- [x] SubTask 6.3: 手动测试场景：添加 image/embedding/chat 三种模型，验证 chat 选择器只显示 chat 模型

## Task 7: 部署
- [x] SubTask 7.1: 提交并 push 到 main
- [x] SubTask 7.2: 等 Vercel READY/PROMOTED
- [x] SubTask 7.3: 用 curl 抓生产 chunk 验证 isTextModel 已编译

## Task Dependencies
- Task 2/3/4 依赖 Task 1（共享函数）✓
- Task 5 独立（不需要 Task 1）✓
- Task 6 依赖 Task 1-5 ✓
- Task 7 依赖 Task 6 ✓

## 并行可执行
- Task 2/3/4 互不依赖但都依赖 Task 1 → 等 Task 1 完成后并行
- Task 5 可与 Task 2/3/4 并行
