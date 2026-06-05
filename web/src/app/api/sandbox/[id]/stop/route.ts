import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sandboxManager } from "@/lib/sandbox/manager";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const sandbox = sandboxManager.getSandbox(id);

    if (!sandbox) {
      return NextResponse.json(
        { error: "Sandbox not found" },
        { status: 404 }
      );
    }

    await sandboxManager.stopSandbox(id);
    const updated = sandboxManager.getSandbox(id);
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
