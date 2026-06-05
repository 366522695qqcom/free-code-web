import { NextRequest, NextResponse } from "next/server";
import { verifySession, getCookieName } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow auth routes
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // Allow health route
  if (pathname === "/api/health") {
    return NextResponse.next();
  }

  // Allow login page and its static assets
  if (pathname === "/login") {
    return NextResponse.next();
  }

  // Allow Next.js internal routes
  if (pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  // Allow static files
  if (pathname.startsWith("/favicon") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // Check for session cookie
  const token = request.cookies.get(getCookieName())?.value;

  if (!token) {
    // API routes: return 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Page routes: redirect to login
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const session = await verifySession(token);

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set(getCookieName(), "", { maxAge: 0, path: "/" });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     */
    "/((?!_next/static|_next/image).*)",
  ],
};
