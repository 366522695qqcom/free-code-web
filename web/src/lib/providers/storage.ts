/**
 * Provider store backed by Turso (SQLite).
 *
 * Providers and models are persisted in the database.
 * Capabilities are stored as JSON in a TEXT column.
 */

import { v4 as uuidv4 } from "uuid";
import type { InValue } from "@libsql/client";
import { getDb, initDb } from "@/lib/db";
import type { CustomProvider, CustomModel, ProviderWithModels } from "./types";

function rowToProvider(row: Record<string, unknown>): CustomProvider {
  return {
    id: row.id as string,
    name: row.name as string,
    baseUrl: row.base_url as string,
    apiKey: row.api_key as string,
    apiPath: row.api_path as string,
    createdAt: row.created_at as number,
    updatedAt: row.updated_at as number,
  };
}

function rowToModel(row: Record<string, unknown>): CustomModel {
  return {
    id: row.id as string,
    providerId: row.provider_id as string,
    modelId: row.model_id as string,
    displayName: (row.display_name as string) || undefined,
    modelType: (row.model_type as "chat" | "embedding" | "image") || "chat",
    capabilities: JSON.parse(row.capabilities as string || "{}"),
    contextWindow: (row.context_window as number) || undefined,
    maxOutputTokens: (row.max_output_tokens as number) || undefined,
    createdAt: row.created_at as number,
  };
}

// --- Provider CRUD ---

export async function listProviders(): Promise<CustomProvider[]> {
  await initDb();
  const db = getDb();
  const result = await db.execute("SELECT * FROM providers ORDER BY created_at DESC");
  return result.rows.map((row) => rowToProvider(row as Record<string, unknown>));
}

export async function getProvider(id: string): Promise<CustomProvider | null> {
  await initDb();
  const db = getDb();
  const result = await db.execute({ sql: "SELECT * FROM providers WHERE id = ?", args: [id] });
  if (result.rows.length === 0) return null;
  return rowToProvider(result.rows[0] as Record<string, unknown>);
}

export async function createProvider(
  provider: Omit<CustomProvider, "id" | "createdAt" | "updatedAt">
): Promise<CustomProvider> {
  await initDb();
  const db = getDb();
  const now = Date.now();
  const id = uuidv4();

  await db.execute({
    sql: "INSERT INTO providers (id, name, base_url, api_key, api_path, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [id, provider.name, provider.baseUrl, provider.apiKey, provider.apiPath, now, now],
  });

  return { ...provider, id, createdAt: now, updatedAt: now };
}

export async function updateProvider(
  id: string,
  updates: Partial<CustomProvider>
): Promise<CustomProvider | null> {
  await initDb();
  const db = getDb();

  const existing = await getProvider(id);
  if (!existing) return null;

  const now = Date.now();
  const sets: string[] = ["updated_at = ?"];
  const args: InValue[] = [now];

  if (updates.name !== undefined) { sets.push("name = ?"); args.push(updates.name); }
  if (updates.baseUrl !== undefined) { sets.push("base_url = ?"); args.push(updates.baseUrl); }
  if (updates.apiKey !== undefined) { sets.push("api_key = ?"); args.push(updates.apiKey); }
  if (updates.apiPath !== undefined) { sets.push("api_path = ?"); args.push(updates.apiPath); }

  args.push(id);
  await db.execute({ sql: `UPDATE providers SET ${sets.join(", ")} WHERE id = ?`, args });

  return getProvider(id);
}

export async function deleteProvider(id: string): Promise<void> {
  await initDb();
  const db = getDb();
  // Models are deleted via CASCADE
  await db.execute({ sql: "DELETE FROM providers WHERE id = ?", args: [id] });
  // Also delete models explicitly in case CASCADE doesn't work with libsql
  await db.execute({ sql: "DELETE FROM models WHERE provider_id = ?", args: [id] });
}

// --- Model CRUD ---

export async function listModels(providerId?: string): Promise<CustomModel[]> {
  await initDb();
  const db = getDb();

  if (providerId) {
    const result = await db.execute({ sql: "SELECT * FROM models WHERE provider_id = ?", args: [providerId] });
    return result.rows.map((row) => rowToModel(row as Record<string, unknown>));
  }

  const result = await db.execute("SELECT * FROM models ORDER BY created_at DESC");
  return result.rows.map((row) => rowToModel(row as Record<string, unknown>));
}

export async function createModel(
  model: Omit<CustomModel, "id" | "createdAt">
): Promise<CustomModel> {
  await initDb();
  const db = getDb();
  const now = Date.now();
  const id = uuidv4();

  await db.execute({
    sql: "INSERT INTO models (id, provider_id, model_id, display_name, model_type, capabilities, context_window, max_output_tokens, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    args: [
      id,
      model.providerId,
      model.modelId,
      model.displayName || null,
      model.modelType,
      JSON.stringify(model.capabilities),
      model.contextWindow || null,
      model.maxOutputTokens || null,
      now,
    ],
  });

  return { ...model, id, createdAt: now };
}

export async function updateModel(
  id: string,
  updates: Partial<CustomModel>
): Promise<CustomModel | null> {
  await initDb();
  const db = getDb();

  const sets: string[] = [];
  const args: InValue[] = [];

  if (updates.modelId !== undefined) { sets.push("model_id = ?"); args.push(updates.modelId); }
  if (updates.displayName !== undefined) { sets.push("display_name = ?"); args.push(updates.displayName); }
  if (updates.modelType !== undefined) { sets.push("model_type = ?"); args.push(updates.modelType); }
  if (updates.capabilities !== undefined) { sets.push("capabilities = ?"); args.push(JSON.stringify(updates.capabilities)); }
  if (updates.contextWindow !== undefined) { sets.push("context_window = ?"); args.push(updates.contextWindow); }
  if (updates.maxOutputTokens !== undefined) { sets.push("max_output_tokens = ?"); args.push(updates.maxOutputTokens); }

  if (sets.length === 0) {
    const existing = await db.execute({ sql: "SELECT * FROM models WHERE id = ?", args: [id] });
    if (existing.rows.length === 0) return null;
    return rowToModel(existing.rows[0] as Record<string, unknown>);
  }

  args.push(id);
  await db.execute({ sql: `UPDATE models SET ${sets.join(", ")} WHERE id = ?`, args });

  const result = await db.execute({ sql: "SELECT * FROM models WHERE id = ?", args: [id] });
  if (result.rows.length === 0) return null;
  return rowToModel(result.rows[0] as Record<string, unknown>);
}

export async function deleteModel(id: string): Promise<void> {
  await initDb();
  const db = getDb();
  await db.execute({ sql: "DELETE FROM models WHERE id = ?", args: [id] });
}

export async function deleteModelsByProvider(providerId: string): Promise<void> {
  await initDb();
  const db = getDb();
  await db.execute({ sql: "DELETE FROM models WHERE provider_id = ?", args: [providerId] });
}

// --- Provider with models ---

export async function getProviderWithModels(id: string): Promise<ProviderWithModels | null> {
  const provider = await getProvider(id);
  if (!provider) return null;
  const models = await listModels(id);
  return { ...provider, models };
}

export async function listProvidersWithModels(): Promise<ProviderWithModels[]> {
  const providers = await listProviders();
  const allModels = await listModels();

  return providers.map((provider) => ({
    ...provider,
    models: allModels.filter((m) => m.providerId === provider.id),
  }));
}
