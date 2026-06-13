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
    let resolvedBaseUrl = body.customBaseUrl;
    if (body.customBaseUrl && (!resolvedApiKey || resolvedApiKey.startsWith("***"))) {
      const providers = await listProvidersWithModels();
      // Match by baseUrl prefix (user may store full URL including path)
      const match = providers.find((p) =>
        p.baseUrl === body.customBaseUrl ||
        body.customBaseUrl.startsWith(p.baseUrl) ||
        p.baseUrl.startsWith(body.customBaseUrl)
      );
      if (match?.apiKey) {
        resolvedApiKey = match.apiKey;
        // If the provider's baseUrl already includes the path (e.g. /v1/chat/completions),
        // use it as the full URL and clear customApiPath to avoid double-path.
        if (match.baseUrl.includes("/chat/completions") && !body.customApiPath) {
          resolvedBaseUrl = match.baseUrl.replace(/\/chat\/completions$/, "");
        }
      }
    }

    const stream = createAgenticStream(body.messages, {
      model: body.model,
      sessionId: body.sessionId,
      permissionMode: body.permissionMode,
      customBaseUrl: resolvedBaseUrl,
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
