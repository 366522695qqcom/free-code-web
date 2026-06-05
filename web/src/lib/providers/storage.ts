import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type { CustomProvider, CustomModel, ProviderWithModels } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const PROVIDERS_FILE = path.join(DATA_DIR, "providers.json");

interface ProvidersData {
  providers: CustomProvider[];
  models: CustomModel[];
}

async function ensureDataFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(PROVIDERS_FILE);
  } catch {
    await fs.writeFile(
      PROVIDERS_FILE,
      JSON.stringify({ providers: [], models: [] }, null, 2),
      "utf-8"
    );
  }
}

async function readData(): Promise<ProvidersData> {
  await ensureDataFile();
  const raw = await fs.readFile(PROVIDERS_FILE, "utf-8");
  return JSON.parse(raw) as ProvidersData;
}

async function writeData(data: ProvidersData): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(PROVIDERS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// --- Provider CRUD ---

export async function listProviders(): Promise<CustomProvider[]> {
  const data = await readData();
  return data.providers;
}

export async function getProvider(
  id: string
): Promise<CustomProvider | null> {
  const data = await readData();
  return data.providers.find((p) => p.id === id) ?? null;
}

export async function createProvider(
  provider: Omit<CustomProvider, "id" | "createdAt" | "updatedAt">
): Promise<CustomProvider> {
  const data = await readData();
  const now = Date.now();
  const newProvider: CustomProvider = {
    ...provider,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };
  data.providers.push(newProvider);
  await writeData(data);
  return newProvider;
}

export async function updateProvider(
  id: string,
  updates: Partial<CustomProvider>
): Promise<CustomProvider | null> {
  const data = await readData();
  const index = data.providers.findIndex((p) => p.id === id);
  if (index === -1) return null;
  data.providers[index] = {
    ...data.providers[index],
    ...updates,
    id,
    updatedAt: Date.now(),
  };
  await writeData(data);
  return data.providers[index];
}

export async function deleteProvider(id: string): Promise<void> {
  const data = await readData();
  data.providers = data.providers.filter((p) => p.id !== id);
  data.models = data.models.filter((m) => m.providerId !== id);
  await writeData(data);
}

// --- Model CRUD ---

export async function listModels(providerId?: string): Promise<CustomModel[]> {
  const data = await readData();
  if (providerId) {
    return data.models.filter((m) => m.providerId === providerId);
  }
  return data.models;
}

export async function createModel(
  model: Omit<CustomModel, "id" | "createdAt">
): Promise<CustomModel> {
  const data = await readData();
  const newModel: CustomModel = {
    ...model,
    id: uuidv4(),
    createdAt: Date.now(),
  };
  data.models.push(newModel);
  await writeData(data);
  return newModel;
}

export async function updateModel(
  id: string,
  updates: Partial<CustomModel>
): Promise<CustomModel | null> {
  const data = await readData();
  const index = data.models.findIndex((m) => m.id === id);
  if (index === -1) return null;
  data.models[index] = {
    ...data.models[index],
    ...updates,
    id,
  };
  await writeData(data);
  return data.models[index];
}

export async function deleteModel(id: string): Promise<void> {
  const data = await readData();
  data.models = data.models.filter((m) => m.id !== id);
  await writeData(data);
}

export async function deleteModelsByProvider(
  providerId: string
): Promise<void> {
  const data = await readData();
  data.models = data.models.filter((m) => m.providerId !== providerId);
  await writeData(data);
}

// --- Provider with models ---

export async function getProviderWithModels(
  id: string
): Promise<ProviderWithModels | null> {
  const data = await readData();
  const provider = data.providers.find((p) => p.id === id);
  if (!provider) return null;
  const models = data.models.filter((m) => m.providerId === id);
  return { ...provider, models };
}

export async function listProvidersWithModels(): Promise<ProviderWithModels[]> {
  const data = await readData();
  return data.providers.map((provider) => ({
    ...provider,
    models: data.models.filter((m) => m.providerId === provider.id),
  }));
}
