export interface CustomProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  apiPath: string;
  createdAt: number;
  updatedAt: number;
}

export interface CustomModel {
  id: string;
  providerId: string;
  modelId: string;
  displayName?: string;
  modelType: "chat" | "embedding" | "image";
  capabilities: {
    vision: boolean;
    reasoning: boolean;
    toolUse: boolean;
  };
  contextWindow?: number;
  maxOutputTokens?: number;
  createdAt: number;
}

export interface ProviderWithModels extends CustomProvider {
  models: CustomModel[];
}
