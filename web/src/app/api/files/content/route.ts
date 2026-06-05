import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const filePath = request.nextUrl.searchParams.get("path");
  if (!filePath) return new Response("Missing path", { status: 400 });

  // Security: prevent path traversal
  const cwd = process.cwd();
  const resolved = path.resolve(cwd, filePath);
  if (!resolved.startsWith(cwd)) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const stat = await fs.stat(resolved);
    if (!stat.isFile()) {
      return new Response("Not a file", { status: 400 });
    }
  } catch {
    return new Response("File not found", { status: 404 });
  }

  // Limit file size to 1MB
  const stat = await fs.stat(resolved);
  if (stat.size > 1024 * 1024) {
    return new Response("File too large (max 1MB)", { status: 413 });
  }

  const content = await fs.readFile(resolved, "utf-8");
  return Response.json({ path: filePath, content });
}
