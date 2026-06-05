import { NextResponse } from "next/server";
import { listSessions, createSession } from "@/lib/sessions";

export async function GET() {
  const sessions = listSessions();
  return NextResponse.json(sessions);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const session = createSession({
      title: body.title || "New Chat",
      model: body.model || "claude-sonnet-4-20250514",
    });
    return NextResponse.json(session, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
