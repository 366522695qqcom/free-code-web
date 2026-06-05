/**
 * Provider Test Connection API — POST /api/providers/[id]/test
 */

import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { getProvider } from "@/lib/providers/storage";
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
  const provider = await getProvider(id);

  if (!provider) {
    return new Response(JSON.stringify({ error: "Provider not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const result = await testProviderConnection({
    baseUrl: provider.baseUrl,
    apiKey: provider.apiKey,
    apiPath: provider.apiPath,
  });

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
