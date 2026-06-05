import { NextResponse } from "next/server";
import { listSessions, createSession } from "@/lib/store";
import type { Session } from "@/types";

export async function GET() {
  const sessions = listSessions();
  return NextResponse.json(sessions);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const now = new Date().toISOString();
    const session: Session = {
      id: crypto.randomUUID(),
      title: body.title || "New Chat",
      messages: [],
      createdAt: now,
      updatedAt: now,
      model: body.model || "claude-sonnet-4-20250514",
      tokenUsage: { inputTokens: 0, outputTokens: 0, cost: 0 },
    };
    createSession(session);
    return NextResponse.json(session, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
