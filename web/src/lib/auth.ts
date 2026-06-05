import { SignJWT, jwtVerify } from "jose";

const AUTH_USERNAME = process.env.AUTH_USERNAME || "admin";
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || "changeme";
const AUTH_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "default-secret-change-me"
);

const COOKIE_NAME = "session";

export interface SessionPayload {
  username: string;
}

export function validateCredentials(
  username: string,
  password: string
): boolean {
  return username === AUTH_USERNAME && password === AUTH_PASSWORD;
}

export async function createSession(username: string): Promise<string> {
  const token = await new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(AUTH_SECRET);
  return token;
}

export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, AUTH_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function getCookieName(): string {
  return COOKIE_NAME;
}

export function getCookieOptions(): {
  name: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax" as const;
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
