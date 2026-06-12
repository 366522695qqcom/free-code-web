/**
 * Provider model 过滤工具
 *
 * 用于在 chat 模型选择器中只保留文字模型（modelType === "chat"），
 * 排除图像生成（image）和向量嵌入（embedding）模型。
 */

/** 模型类型联合。匹配 lib/providers/types.ts 的 CustomModel.modelType */
export type ModelType = "chat" | "embedding" | "image";

/**
 * 判断一个 model 是否为 chat 可用的文字模型。
 *
 * 规则：
 * - 缺省 modelType → true（与 db default "chat" 一致）
 * - "chat" → true
 * - "image" → false（图像生成）
 * - "embedding" → false（向量嵌入）
 */
export function isTextModel(model: { modelType?: ModelType | string } | null | undefined): boolean {
  if (!model) return true;
  const t = model.modelType;
  return t !== "image" && t !== "embedding";
}
