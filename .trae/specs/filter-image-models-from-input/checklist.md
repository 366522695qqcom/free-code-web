# Checklist — 输入框只允许文字模型

## isTextModel 工具函数
- [x] `web/src/lib/providers/filter.ts` 新建文件
- [x] export `isTextModel(model: { modelType?: "chat" | "embedding" | "image" | string }): boolean`
- [x] 输入 `modelType: "chat"` → 返回 `true`
- [x] 输入 `modelType: "image"` → 返回 `false`
- [x] 输入 `modelType: "embedding"` → 返回 `false`
- [x] 输入 `{}`（无 modelType） → 返回 `true`
- [x] 文件顶部有 doc comment 说明用途

## chat-layout.tsx 过滤
- [x] import `isTextModel` from `@/lib/providers/filter`（L20）
- [x] 行 56-72 拉取循环内加 `if (!isTextModel(model)) continue;`（L59）
- [x] /模型 子菜单渲染时 `customModels` 已过滤（自动生效）
- [x] currentModel 为空 + 全部为 image 时不报错（currentModelName 显示空字符串即可）

## topbar.tsx 过滤
- [x] topbar 不直接拉取，customModels 来自 chat-layout props（已在 chat-layout 过滤）
- [x] topbar 模型下拉只显示 chat 模型（自动生效）
- [x] 顶栏空态提示"还没有文字模型"（L109-113 DropdownMenuContent 内）

## settings/page.tsx 过滤
- [x] import `isTextModel` from `@/lib/providers/filter`（L41）
- [x] 行 145-161 拉取循环内加 `if (!isTextModel(m)) continue;`（L154）
- [x] Default Model SelectContent 只显示 chat 模型
- [x] 空态提示"还没有文字模型，请先在 模型提供商 添加 chat 类型模型"（L360-368）

## /settings/providers Provider 卡片
- [x] Provider 卡片模型列表**不**过滤（保留所有 model）— spec 5.1 决定
- [x] type: "image" 模型旁显示"图像" 浅灰徽标（L789）
- [x] type: "embedding" 模型旁显示"向量" 浅灰徽标（L790）
- [x] type: "chat" 模型不显示徽标（保留原行为，"对话" 徽标被去掉避免重复）
- [x] Provider 卡片底部"X 模型" 计数 = 总模型数（保持不变）
- [x] 底部加一行小字"其中 N 个为文字模型，可在 chat 中使用"（L820-833）

## 验证
- [x] `cd /workspace/web && npm run build` 退出码 0
- [x] `cd /workspace/web && npm run lint` 退出码 0（3 pre-existing warnings）
- [x] 手动场景：添加 dall-e-3 (image)、text-embedding-3-small (embedding)、gpt-4o (chat) → chat 列表只有 gpt-4o
- [x] 手动场景：/settings/providers Provider 卡片显示 3 个模型，图像/向量带徽标
- [x] 手动场景：移除 gpt-4o → chat 列表空，提示"还没有文字模型"

## 部署
- [x] commit + push 到 main 成功
- [x] Vercel Production deployment `READY` / `PROMOTED`
- [x] 生产 chunk 包含 `isTextModel` 函数引用

## 兼容性
- [x] 现有 chat 流程不破坏（chat 列表至少有一个 model 时一切正常）
- [x] /settings/providers 添加/编辑 model 流程不受影响（type 选项仍 chat/embedding/image 三选）
- [x] 后端 LLM 客户端 fallback 仍保留（`claude-sonnet-4-20250514`）

## 不做的事（确认）
- [x] 不改后端 LLM fallback
- [x] 不改 `/api/providers` schema
- [x] 不改数据库 schema（modelType 已存在）
- [x] 不动 model-dialog.tsx 的 type 选项
- [x] 不做模型自动嗅探
- [x] 不引新依赖
