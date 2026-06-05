/**
 * Tool Execution API — POST /api/tools/execute
 *
 * Executes a tool by name with the given parameters.
 * Requires authentication.
 */

import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { getTool, initializeTools } from "@/lib/tools";

// Ensure tools are registered
initializeTools();

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
    const body = await request.json();
    const { toolName, params } = body;

    if (!toolName || typeof toolName !== "string") {
      return new Response(
        JSON.stringify({ error: "toolName is required and must be a string" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const tool = getTool(toolName);
    if (!tool) {
      return new Response(
        JSON.stringify({ error: `Unknown tool: ${toolName}` }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await tool.execute(params || {});

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
