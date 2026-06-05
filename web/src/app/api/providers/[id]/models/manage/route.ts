/**
 * Provider Model Management API — POST/PUT/DELETE /api/providers/[id]/models/manage
 */

import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { getProvider } from "@/lib/providers/storage";
import { createModel, updateModel, deleteModel } from "@/lib/providers/storage";

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

    if (!modelId) {
      return new Response(JSON.stringify({ error: "modelId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const model = await createModel({
      providerId: id,
      modelId,
      displayName: displayName || undefined,
      modelType: modelType || "chat",
      capabilities: {
        vision: capabilities?.vision ?? false,
        reasoning: capabilities?.reasoning ?? false,
        toolUse: capabilities?.toolUse ?? false,
      },
      contextWindow: contextWindow || undefined,
      maxOutputTokens: maxOutputTokens || undefined,
    });

    return new Response(JSON.stringify({ model }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { modelId, ...updates } = body as { modelId?: string } & Record<string, unknown>;

    if (!modelId) {
      return new Response(JSON.stringify({ error: "modelId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const model = await updateModel(modelId, updates);
    if (!model) {
      return new Response(JSON.stringify({ error: "Model not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ model }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function DELETE(
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

  const { id: _providerId } = await params;
  const url = new URL(request.url);
  const modelId = url.searchParams.get("modelId");

  if (!modelId) {
    return new Response(JSON.stringify({ error: "modelId query parameter is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  await deleteModel(modelId);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
