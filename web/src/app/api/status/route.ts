import { NextResponse } from "next/server";
import { getMCPManager } from "@/lib/mcp/manager";

export async function GET() {
  const manager = getMCPManager();
  const servers = manager.listServers();

  return NextResponse.json({
    sandboxEnabled: process.env.SANDBOX_ENABLED === "true",
    mcpConnections: servers.length,
  });
}
