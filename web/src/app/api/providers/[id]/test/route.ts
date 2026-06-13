/**
 * Provider Test Connection API — POST /api/providers/[id]/test
 */

import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { getProviderWithModels } from "@/lib/providers/storage";
import { testProviderConnection } from "@/lib/providers/api";

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
  const provider = await getProviderWithModels(id);

  if (!provider) {
    return new Response(JSON.stringify({ error: "Provider not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Use the first registered chat model for testing instead of hardcoded gpt-4o-mini
  const chatModel = provider.models?.find((m) => m.modelType === "chat");

  const result = await testProviderConnection({
    baseUrl: provider.baseUrl,
    apiKey: provider.apiKey,
    apiPath: provider.apiPath,
    model: chatModel?.modelId,
  });

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
