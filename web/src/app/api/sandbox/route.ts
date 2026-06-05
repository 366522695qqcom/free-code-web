import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sandboxManager } from "@/lib/sandbox/manager";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (sessionId) {
      const sandbox = sandboxManager.getSandboxForSession(sessionId);
      return NextResponse.json(sandbox ?? null);
    }

    const sandboxes = sandboxManager.listSandboxes();
    return NextResponse.json(sandboxes);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { sessionId, runtime, vCpus, memory, persistent } = body as {
      sessionId?: string;
      runtime?: string;
      vCpus?: number;
      memory?: number;
      persistent?: boolean;
    };

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const sandbox = await sandboxManager.createSandbox(sessionId, {
      runtime: runtime as "node26" | "node24" | "node22" | "python3.13" | undefined,
      vCpus,
      memory,
      persistent,
    });

    return NextResponse.json(sandbox, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
