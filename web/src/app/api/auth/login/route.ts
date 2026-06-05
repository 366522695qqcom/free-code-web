import { NextRequest, NextResponse } from "next/server";
import {
  validateCredentials,
  createSession,
  getCookieOptions,
} from "@/lib/auth";
import type { LoginResponseBody } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json<LoginResponseBody>(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    if (!validateCredentials(username, password)) {
      return NextResponse.json<LoginResponseBody>(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await createSession(username);
    const cookieOptions = getCookieOptions();

    const response = NextResponse.json<LoginResponseBody>({ success: true });
    response.cookies.set({
      ...cookieOptions,
      value: token,
    });

    return response;
  } catch {
    return NextResponse.json<LoginResponseBody>(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
