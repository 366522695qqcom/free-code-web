import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const prefix = request.nextUrl.searchParams.get("prefix") || "";
  const cwd = process.cwd();

  // Security: prevent path traversal
  const searchDir = prefix ? path.resolve(cwd, prefix) : cwd;
  if (!searchDir.startsWith(cwd)) {
    return new Response("Forbidden", { status: 403 });
  }

  const MAX_RESULTS = 50;
  const results: { path: string; type: "file" | "dir" }[] = [];

  async function walk(dir: string, relativeTo: string): Promise<void> {
    if (results.length >= MAX_RESULTS) return;

    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (results.length >= MAX_RESULTS) return;

      // Skip hidden dirs and common non-project dirs
      if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === ".git") {
        continue;
      }

      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(relativeTo, entry.name);

      if (entry.isDirectory()) {
        results.push({ path: relPath, type: "dir" });
        // If prefix matches or we're within a prefix match, recurse
        await walk(fullPath, relPath);
      } else if (entry.isFile()) {
        results.push({ path: relPath, type: "file" });
      }
    }
  }

  // If prefix points to a specific directory, walk it; otherwise walk cwd
  try {
    const stat = await fs.stat(searchDir);
    if (stat.isDirectory()) {
      await walk(searchDir, prefix);
    } else {
      // prefix points to a file — return just that file
      results.push({ path: prefix, type: "file" });
    }
  } catch {
    // prefix doesn't exist yet — try to find partial matches
    // Walk from parent directory and filter
    const parentDir = path.dirname(searchDir);
    const baseName = path.basename(searchDir);
    const parentRelative = path.dirname(prefix);

    if (parentDir.startsWith(cwd)) {
      let entries;
      try {
        entries = await fs.readdir(parentDir, { withFileTypes: true });
      } catch {
        // Parent doesn't exist either
      }

      if (entries) {
        for (const entry of entries) {
          if (results.length >= MAX_RESULTS) break;
          if (entry.name.startsWith(baseName)) {
            const relPath = path.join(parentRelative, entry.name);
            results.push({
              path: relPath,
              type: entry.isDirectory() ? "dir" : "file",
            });
          }
        }
      }
    }
  }

  return Response.json({ files: results });
}
