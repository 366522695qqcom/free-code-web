/**
 * Providers API — GET /api/providers, POST /api/providers
 */

import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import {
  listProvidersWithModels,
  createProvider,
} from "@/lib/providers/storage";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const providers = await listProvidersWithModels();
  return new Response(JSON.stringify(providers), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { name, baseUrl, apiKey, apiPath } = body as {
      name?: string;
      baseUrl?: string;
      apiKey?: string;
      apiPath?: string;
    };

    if (!name || typeof name !== "string") {
      return new Response(JSON.stringify({ error: "name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!baseUrl || typeof baseUrl !== "string") {
      return new Response(JSON.stringify({ error: "baseUrl is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!apiKey || typeof apiKey !== "string") {
      return new Response(JSON.stringify({ error: "apiKey is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const provider = await createProvider({
      name,
      baseUrl,
      apiKey,
      apiPath: apiPath || "/chat/completions",
    });

    return new Response(JSON.stringify(provider), {
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
