/**
 * Provider Models API — GET/POST /api/providers/[id]/models
 */

import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { getProvider } from "@/lib/providers/storage";
import { listModels, createModel } from "@/lib/providers/storage";
import { fetchProviderModels } from "@/lib/providers/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(request);
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = await params;
  const provider = await getProvider(id);

  if (!provider) {
    return new Response(JSON.stringify({ error: "Provider not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const result = await fetchProviderModels({
    baseUrl: provider.baseUrl,
    apiKey: provider.apiKey,
    apiPath: provider.apiPath,
  });

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(request);
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = await params;
  const provider = await getProvider(id);

  if (!provider) {
    return new Response(JSON.stringify({ error: "Provider not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { modelId, displayName, modelType, capabilities, contextWindow, maxOutputTokens } = body as {
      modelId?: string;
      displayName?: string;
      modelType?: "chat" | "embedding" | "image";
      capabilities?: { vision?: boolean; reasoning?: boolean; toolUse?: boolean };
      contextWindow?: number;
      maxOutputTokens?: number;
    };

    if (!modelId || typeof modelId !== "string") {
      return new Response(JSON.stringify({ error: "modelId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const model = await createModel({
      providerId: id,
      modelId,
      displayName,
      modelType: modelType || "chat",
      capabilities: {
        vision: capabilities?.vision ?? false,
        reasoning: capabilities?.reasoning ?? false,
        toolUse: capabilities?.toolUse ?? false,
      },
      contextWindow,
      maxOutputTokens,
    });

    return new Response(JSON.stringify(model), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
