/**
 * Web tools — fetch URLs and perform web searches.
 *
 * - WebFetchTool: Fetch URL content and return as text
 * - WebSearchTool: Basic web search (if API key configured)
 */

import type { ToolExecutor, ToolResult } from "./registry";

// ─── WebFetchTool ────────────────────────────────────────────────────────────

export const webFetchTool: ToolExecutor = {
  name: "web_fetch",
  description:
    "Fetch content from a URL and return it as text. Supports HTML pages (converted to readable text), JSON, and plain text.",
  parameters: {
    properties: {
      url: {
        type: "string",
        description: "The URL to fetch",
      },
      format: {
        type: "string",
        description:
          'Desired output format: "text" (default), "json", or "raw"',
      },
    },
    required: ["url"],
  },
  requiresConfirmation: false,

  async execute(params: Record<string, unknown>): Promise<ToolResult> {
    const url = params.url as string;
    const format = (params.format as string) || "text";

    if (!url) {
      return {
        output: "",
        error: "url is required",
        exitCode: 1,
      };
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return {
        output: "",
        error: `Invalid URL: ${url}`,
        exitCode: 1,
      };
    }

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; FreeCodeBot/1.0; +https://freecode.dev)",
          Accept: "text/html,application/json,text/plain,*/*",
        },
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        return {
          output: "",
          error: `HTTP ${response.status} ${response.statusText}`,
          exitCode: 1,
        };
      }

      const contentType = response.headers.get("content-type") || "";
      const body = await response.text();

      if (format === "raw") {
        return { output: body };
      }

      if (format === "json" || contentType.includes("application/json")) {
        try {
          const parsed = JSON.parse(body);
          return { output: JSON.stringify(parsed, null, 2) };
        } catch {
          return { output: body };
        }
      }

      // For HTML, strip tags to get readable text
      if (contentType.includes("text/html")) {
        const text = htmlToText(body);
        // Truncate if too long
        const maxLen = 50_000;
        if (text.length > maxLen) {
          return {
            output: text.slice(0, maxLen) + "\n\n... [truncated]",
          };
        }
        return { output: text };
      }

      // Plain text or other
      const maxLen = 50_000;
      if (body.length > maxLen) {
        return {
          output: body.slice(0, maxLen) + "\n\n... [truncated]",
        };
      }
      return { output: body };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        output: "",
        error: `Failed to fetch URL: ${message}`,
        exitCode: 1,
      };
    }
  },
};

/**
 * Simple HTML to text conversion — strips tags and normalizes whitespace.
 */
function htmlToText(html: string): string {
  return html
    // Remove scripts and styles
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    // Convert common block elements to newlines
    .replace(/<\/?(p|div|br|h[1-6]|li|tr|hr)[^>]*>/gi, "\n")
    // Remove all other HTML tags
    .replace(/<[^>]+>/g, "")
    // Decode common HTML entities
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    // Normalize whitespace
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ─── WebSearchTool ───────────────────────────────────────────────────────────

export const webSearchTool: ToolExecutor = {
  name: "web_search",
  description:
    "Search the web for information. Requires a search API key to be configured (SERPAPI_KEY or GOOGLE_SEARCH_API_KEY).",
  parameters: {
    properties: {
      query: {
        type: "string",
        description: "The search query",
      },
      num_results: {
        type: "number",
        description: "Number of results to return (default: 5, max: 10)",
      },
    },
    required: ["query"],
  },
  requiresConfirmation: false,

  async execute(params: Record<string, unknown>): Promise<ToolResult> {
    const query = params.query as string;
    const numResults = Math.min((params.num_results as number) || 5, 10);

    if (!query) {
      return {
        output: "",
        error: "query is required",
        exitCode: 1,
      };
    }

    const serpApiKey = process.env.SERPAPI_KEY;
    const googleApiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const googleCx = process.env.GOOGLE_SEARCH_CX;

    // Try SerpAPI first
    if (serpApiKey) {
      try {
        const response = await fetch(
          `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&num=${numResults}&api_key=${serpApiKey}`,
          { signal: AbortSignal.timeout(10_000) }
        );

        if (!response.ok) {
          return {
            output: "",
            error: `SerpAPI error: ${response.status}`,
            exitCode: 1,
          };
        }

        const data = await response.json();
        const results = (data.organic_results || []).slice(0, numResults);

        if (results.length === 0) {
          return { output: "No search results found." };
        }

        const formatted = results
          .map(
            (r: { title?: string; link?: string; snippet?: string }, i: number) =>
              `${i + 1}. ${r.title || "No title"}\n   ${r.link || ""}\n   ${r.snippet || ""}`
          )
          .join("\n\n");

        return { output: formatted };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          output: "",
          error: `SerpAPI search failed: ${message}`,
          exitCode: 1,
        };
      }
    }

    // Try Google Custom Search
    if (googleApiKey && googleCx) {
      try {
        const response = await fetch(
          `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCx}&q=${encodeURIComponent(query)}&num=${numResults}`,
          { signal: AbortSignal.timeout(10_000) }
        );

        if (!response.ok) {
          return {
            output: "",
            error: `Google Search error: ${response.status}`,
            exitCode: 1,
          };
        }

        const data = await response.json();
        const results = (data.items || []).slice(0, numResults);

        if (results.length === 0) {
          return { output: "No search results found." };
        }

        const formatted = results
          .map(
            (r: { title?: string; link?: string; snippet?: string }, i: number) =>
              `${i + 1}. ${r.title || "No title"}\n   ${r.link || ""}\n   ${r.snippet || ""}`
          )
          .join("\n\n");

        return { output: formatted };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          output: "",
          error: `Google Search failed: ${message}`,
          exitCode: 1,
        };
      }
    }

    return {
      output:
        "Web search is not configured. Set SERPAPI_KEY or GOOGLE_SEARCH_API_KEY + GOOGLE_SEARCH_CX environment variables to enable web search.",
      exitCode: 0,
    };
  },
};
