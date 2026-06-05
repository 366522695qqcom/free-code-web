/**
 * Tool Confirmation API — POST /api/tools/confirm
 *
 * Handles the permission flow for tools that require confirmation.
 * The agentic stream checks for pending confirmations before executing tools.
 */

import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import {
  resolveConfirmation,
  hasPendingConfirmation,
} from "@/lib/tools/confirmations";

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
    const { toolCallId, approved } = body;

    if (!toolCallId || typeof toolCallId !== "string") {
      return new Response(
        JSON.stringify({ error: "toolCallId is required and must be a string" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (typeof approved !== "boolean") {
      return new Response(
        JSON.stringify({ error: "approved is required and must be a boolean" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!hasPendingConfirmation(toolCallId)) {
      return new Response(
        JSON.stringify({ error: "No pending confirmation found for this tool call" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const resolved = resolveConfirmation(toolCallId, approved);

    return new Response(
      JSON.stringify({
        success: resolved,
        toolCallId,
        approved,
      }),
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
