import { NextResponse } from "next/server";
import { getCookieOptions } from "@/lib/auth";

export async function POST() {
  const cookieOptions = getCookieOptions();
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    ...cookieOptions,
    value: "",
    maxAge: 0,
  });
  return response;
}
