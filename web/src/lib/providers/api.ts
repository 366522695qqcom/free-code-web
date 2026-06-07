/**
 * Provider API utilities — test connection and fetch models from OpenAI-compatible APIs.
 */

export function extractBaseUrl(baseUrl: string, apiPath?: string): string {
  let base = baseUrl.replace(/\/+$/, "");
  if (apiPath) {
    const path = apiPath.startsWith("/") ? apiPath : `/${apiPath}`;
    if (base.endsWith(path)) {
      base = base.slice(0, -path.length);
    }
  }
  return base;
}

export async function testProviderConnection(provider: {
  baseUrl: string;
  apiKey: string;
  apiPath?: string;
}): Promise<{ success: boolean; message: string }> {
  const base = extractBaseUrl(provider.baseUrl, provider.apiPath);

  // Try GET /models first
  try {
    const response = await fetch(`${base}/models`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      return { success: true, message: "Connection successful" };
    }

    // If /models fails, try a minimal chat completion request
    const chatPath = provider.apiPath || "/chat/completions";
    const chatResponse = await fetch(`${base}${chatPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 1,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (chatResponse.ok || chatResponse.status === 400) {
      // 400 might mean the model doesn't exist but the connection works
      return { success: true, message: "Connection successful" };
    }

    const errorBody = await chatResponse.text().catch(() => "");
    return {
      success: false,
      message: `Connection failed: ${chatResponse.status} ${errorBody}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, message: `Connection failed: ${message}` };
  }
}

export async function fetchProviderModels(provider: {
  baseUrl: string;
  apiKey: string;
  apiPath?: string;
}): Promise<{
  success: boolean;
  models: Array<{ id: string; owned_by?: string }>;
  error?: string;
}> {
  const base = extractBaseUrl(provider.baseUrl, provider.apiPath);

  try {
    const response = await fetch(`${base}/models`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      return {
        success: false,
        models: [],
        error: `Failed to fetch models: ${response.status} ${errorBody}`,
      };
    }

    const body = (await response.json()) as {
      data?: Array<{ id: string; object?: string; owned_by?: string }>;
    };

    const models = (body.data || []).map((m) => ({
      id: m.id,
      owned_by: m.owned_by,
    }));

    return { success: true, models };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      models: [],
      error: `Failed to fetch models: ${message}`,
    };
  }
}
