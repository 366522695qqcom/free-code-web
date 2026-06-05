import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, getCookieName } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(getCookieName())?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const session = await verifySessionToken(token);

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user: { username: session.username } });
}
