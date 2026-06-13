import { NextRequest } from "next/server";
import { createAgenticStream } from "@/lib/agent-stream";
import { createSSEResponse } from "@/lib/sse";
import { getSession } from "@/lib/auth";
import { listProvidersWithModels } from "@/lib/providers/storage";
import type { ChatRequest } from "@/types";

export async function POST(request: NextRequest) {
  // Auth check
  const session = await getSession(request);
  if (!session) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body: ChatRequest = await request.json();

    if (!body.messages || !Array.isArray(body.messages)) {
      return new Response(
        JSON.stringify({ error: "messages is required and must be an array" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Resolve the real API key: the frontend receives masked keys from
    // GET /api/providers (***xxxx), so we must look up the original from DB.
    let resolvedApiKey = body.customApiKey;
    if (body.customBaseUrl && (!resolvedApiKey || resolvedApiKey.startsWith("***"))) {
      const providers = await listProvidersWithModels();
      const match = providers.find((p) => p.baseUrl === body.customBaseUrl);
      if (match?.apiKey) {
        resolvedApiKey = match.apiKey;
      }
    }

    const stream = createAgenticStream(body.messages, {
      model: body.model,
      sessionId: body.sessionId,
      permissionMode: body.permissionMode,
      customBaseUrl: body.customBaseUrl,
      customApiKey: resolvedApiKey,
      customApiPath: body.customApiPath,
    });

    return createSSEResponse(stream);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
