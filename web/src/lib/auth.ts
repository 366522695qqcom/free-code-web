import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const AUTH_USERNAME = process.env.AUTH_USERNAME || "admin";
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || "changeme";
const AUTH_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "default-secret-change-me"
);

// M-3: warn on default credentials; fatal in production
const IS_DEFAULT_USERNAME = !process.env.AUTH_USERNAME;
const IS_DEFAULT_PASSWORD = !process.env.AUTH_PASSWORD;
const IS_DEFAULT_SECRET = !process.env.AUTH_SECRET;

if (IS_DEFAULT_USERNAME || IS_DEFAULT_PASSWORD || IS_DEFAULT_SECRET) {
  console.warn(
    "[SECURITY WARNING] Using default credentials detected. " +
      "Set AUTH_USERNAME, AUTH_PASSWORD, and AUTH_SECRET environment variables in production."
  );
  // Note: process.exit(1) is intentionally omitted here because auth.ts is
  // imported by Edge Runtime (middleware). Production env-check should be done in
  // a server-only startup script (e.g. scripts/check-env.ts) instead.
}

const COOKIE_NAME = "session";

export interface SessionPayload {
  username: string;
}

/**
 * Verify username and password against environment variables.
 */
export function verifyCredentials(
  username: string,
  password: string
): boolean {
  return username === AUTH_USERNAME && password === AUTH_PASSWORD;
}

/** @deprecated Use verifyCredentials instead */
export const validateCredentials = verifyCredentials;

/**
 * Create a signed JWT session token.
 */
export async function createSessionToken(
  username: string = AUTH_USERNAME
): Promise<string> {
  const token = await new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(AUTH_SECRET);
  return token;
}

/** @deprecated Use createSessionToken instead */
export const createSession = createSessionToken;

/**
 * Verify a session token and return the payload.
 */
export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, AUTH_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/** @deprecated Use verifySessionToken instead */
export const verifySession = verifySessionToken;

/**
 * Extract and verify session from a Next.js Request (API route or middleware).
 * Works with both NextRequest (middleware) and regular Request objects.
 */
export async function getSession(
  request: NextRequest | Request
): Promise<SessionPayload | null> {
  let token: string | undefined;

  if ("cookies" in request && typeof request.cookies === "object") {
    // NextRequest with cookies accessor
    token = (request as NextRequest).cookies.get(COOKIE_NAME)?.value;
  }

  if (!token) {
    // Fallback: try to parse cookie header manually
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${COOKIE_NAME}=`));
      if (match) {
        token = match.slice(COOKIE_NAME.length + 1);
      }
    }
  }

  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Get session from next/headers cookies() (for use in Server Components / Route Handlers).
 */
export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function getCookieName(): string {
  return COOKIE_NAME;
}

export function getCookieOptions(): {
  name: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };
}
