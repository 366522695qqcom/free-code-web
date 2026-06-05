/**
 * MCP Server Resources API — GET/POST /api/mcp/servers/[id]/resources
 */

import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { getMCPManager } from "@/lib/mcp/manager";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const manager = getMCPManager();
  const resources = manager.getServerResources(id);

  return new Response(JSON.stringify({ resources }), {
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

  try {
    const body = await request.json();
    const { uri } = body as { uri?: string };

    if (!uri || typeof uri !== "string") {
      return new Response(
        JSON.stringify({ error: "uri is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const manager = getMCPManager();
    const content = await manager.readResource(id, uri);

    return new Response(JSON.stringify({ content }), {
      status: 200,
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
