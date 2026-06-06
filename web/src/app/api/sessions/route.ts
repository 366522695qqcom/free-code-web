import { NextResponse } from "next/server";
import { listSessions, createSession } from "@/lib/sessions";

export async function GET() {
  const sessions = await listSessions();
  return NextResponse.json(sessions);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const session = await createSession({
      title: body.title,
      model: body.model,
    });
    return NextResponse.json(session, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
