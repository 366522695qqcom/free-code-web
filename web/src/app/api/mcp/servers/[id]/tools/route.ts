/**
 * MCP Server Tools API — GET/POST /api/mcp/servers/[id]/tools
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
  const tools = manager.getServerTools(id);

  return new Response(JSON.stringify({ tools }), {
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
    const { toolName, args } = body as {
      toolName?: string;
      args?: Record<string, unknown>;
    };

    if (!toolName || typeof toolName !== "string") {
      return new Response(
        JSON.stringify({ error: "toolName is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const manager = getMCPManager();
    const result = await manager.executeTool(id, toolName, args || {});

    return new Response(JSON.stringify(result), {
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
