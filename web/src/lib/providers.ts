/**
 * In-memory store for custom model providers.
 * In production, this would be backed by a database.
 */

export interface CustomModel {
  id: string;
  displayName?: string;
  type: "chat" | "embedding" | "image";
  capabilities: string[]; // e.g., ["vision", "reasoning", "tool_use"]
  contextWindow?: number;
  maxOutputTokens?: number;
}

export interface CustomProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  apiPath: string;
  models: CustomModel[];
  createdAt: string;
  updatedAt: string;
}

const providers = new Map<string, CustomProvider>();

export function listProviders(): CustomProvider[] {
  return Array.from(providers.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getProvider(id: string): CustomProvider | undefined {
  return providers.get(id);
}

export function createProvider(data: Omit<CustomProvider, "id" | "models" | "createdAt" | "updatedAt">): CustomProvider {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const provider: CustomProvider = {
    id,
    ...data,
    models: [],
    createdAt: now,
    updatedAt: now,
  };
  providers.set(id, provider);
  return provider;
}

export function updateProvider(
  id: string,
  updates: Partial<Pick<CustomProvider, "name" | "baseUrl" | "apiKey" | "apiPath">>
): CustomProvider | undefined {
  const provider = providers.get(id);
  if (!provider) return undefined;
  Object.assign(provider, updates, { updatedAt: new Date().toISOString() });
  return provider;
}

export function deleteProvider(id: string): boolean {
  return providers.delete(id);
}

export function addModel(providerId: string, model: Omit<CustomModel, "id">): CustomModel | undefined {
  const provider = providers.get(providerId);
  if (!provider) return undefined;
  const id = crypto.randomUUID();
  const newModel: CustomModel = { id, ...model };
  provider.models.push(newModel);
  provider.updatedAt = new Date().toISOString();
  return newModel;
}

export function updateModel(providerId: string, modelId: string, updates: Partial<Omit<CustomModel, "id">>): CustomModel | undefined {
  const provider = providers.get(providerId);
  if (!provider) return undefined;
  const model = provider.models.find((m) => m.id === modelId);
  if (!model) return undefined;
  Object.assign(model, updates);
  provider.updatedAt = new Date().toISOString();
  return model;
}

export function deleteModel(providerId: string, modelId: string): boolean {
  const provider = providers.get(providerId);
  if (!provider) return false;
  const idx = provider.models.findIndex((m) => m.id === modelId);
  if (idx === -1) return false;
  provider.models.splice(idx, 1);
  provider.updatedAt = new Date().toISOString();
  return true;
}
