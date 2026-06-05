/**
 * MCP Server Detail API — GET/DELETE/POST /api/mcp/servers/[id]
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
  const server = manager.getServer(id);

  if (!server) {
    return new Response(JSON.stringify({ error: "Server not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ server }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
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

  const { id } = await params;
  const manager = getMCPManager();
  const removed = manager.removeServer(id);

  if (!removed) {
    return new Response(JSON.stringify({ error: "Server not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
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
  const manager = getMCPManager();
  const server = manager.getServer(id);

  if (!server) {
    return new Response(JSON.stringify({ error: "Server not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { action } = body as { action?: string };

    if (action === "connect") {
      await manager.connectServer(id);
    } else if (action === "disconnect") {
      manager.disconnectServer(id);
    } else {
      return new Response(
        JSON.stringify({ error: "action must be 'connect' or 'disconnect'" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const updated = manager.getServer(id);
    return new Response(JSON.stringify({ server: updated }), {
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
