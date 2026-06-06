/**
 * In-memory provider store.
 *
 * Uses in-memory storage instead of filesystem so it works on
 * Vercel's read-only filesystem. Can be upgraded to a database
 * later without changing the API surface.
 */

import { v4 as uuidv4 } from "uuid";
import type { CustomProvider, CustomModel, ProviderWithModels } from "./types";

interface ProvidersData {
  providers: CustomProvider[];
  models: CustomModel[];
}

const data: ProvidersData = {
  providers: [],
  models: [],
};

// --- Provider CRUD ---

export async function listProviders(): Promise<CustomProvider[]> {
  return data.providers;
}

export async function getProvider(
  id: string
): Promise<CustomProvider | null> {
  return data.providers.find((p) => p.id === id) ?? null;
}

export async function createProvider(
  provider: Omit<CustomProvider, "id" | "createdAt" | "updatedAt">
): Promise<CustomProvider> {
  const now = Date.now();
  const newProvider: CustomProvider = {
    ...provider,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };
  data.providers.push(newProvider);
  return newProvider;
}

export async function updateProvider(
  id: string,
  updates: Partial<CustomProvider>
): Promise<CustomProvider | null> {
  const index = data.providers.findIndex((p) => p.id === id);
  if (index === -1) return null;
  data.providers[index] = {
    ...data.providers[index],
    ...updates,
    id,
    updatedAt: Date.now(),
  };
  return data.providers[index];
}

export async function deleteProvider(id: string): Promise<void> {
  data.providers = data.providers.filter((p) => p.id !== id);
  data.models = data.models.filter((m) => m.providerId !== id);
}

// --- Model CRUD ---

export async function listModels(providerId?: string): Promise<CustomModel[]> {
  if (providerId) {
    return data.models.filter((m) => m.providerId === providerId);
  }
  return data.models;
}

export async function createModel(
  model: Omit<CustomModel, "id" | "createdAt">
): Promise<CustomModel> {
  const newModel: CustomModel = {
    ...model,
    id: uuidv4(),
    createdAt: Date.now(),
  };
  data.models.push(newModel);
  return newModel;
}

export async function updateModel(
  id: string,
  updates: Partial<CustomModel>
): Promise<CustomModel | null> {
  const index = data.models.findIndex((m) => m.id === id);
  if (index === -1) return null;
  data.models[index] = {
    ...data.models[index],
    ...updates,
    id,
  };
  return data.models[index];
}

export async function deleteModel(id: string): Promise<void> {
  data.models = data.models.filter((m) => m.id !== id);
}

export async function deleteModelsByProvider(
  providerId: string
): Promise<void> {
  data.models = data.models.filter((m) => m.providerId !== providerId);
}

// --- Provider with models ---

export async function getProviderWithModels(
  id: string
): Promise<ProviderWithModels | null> {
  const provider = data.providers.find((p) => p.id === id);
  if (!provider) return null;
  const models = data.models.filter((m) => m.providerId === id);
  return { ...provider, models };
}

export async function listProvidersWithModels(): Promise<ProviderWithModels[]> {
  return data.providers.map((provider) => ({
    ...provider,
    models: data.models.filter((m) => m.providerId === provider.id),
  }));
}
