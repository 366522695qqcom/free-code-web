/**
 * MCP Servers API — GET /api/mcp/servers, POST /api/mcp/servers
 */

import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { getMCPManager } from "@/lib/mcp/manager";

export async function GET() {
  const manager = getMCPManager();
  const servers = manager.listServers();

  return new Response(JSON.stringify({ servers }), {
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
    const { name, type, command, args, url, env } = body as {
      name?: string;
      type?: "stdio" | "sse";
      command?: string;
      args?: string[];
      url?: string;
      env?: Record<string, string>;
    };

    if (!name || typeof name !== "string") {
      return new Response(JSON.stringify({ error: "name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!type || (type !== "stdio" && type !== "sse")) {
      return new Response(
        JSON.stringify({ error: "type must be 'stdio' or 'sse'" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (type === "stdio" && !command) {
      return new Response(
        JSON.stringify({ error: "command is required for stdio type" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (type === "sse" && !url) {
      return new Response(
        JSON.stringify({ error: "url is required for sse type" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const manager = getMCPManager();
    const server = manager.addServer({ name, type, command, args, url, env });

    return new Response(JSON.stringify({ server }), {
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
