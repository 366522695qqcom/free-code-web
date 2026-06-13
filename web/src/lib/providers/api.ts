/**
 * Provider API utilities — test connection and fetch models from OpenAI-compatible APIs.
 */

/**
 * Normalize a baseUrl by stripping trailing slashes and common API paths
 * (e.g. /chat/completions) that users may accidentally include.
 */
function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "").replace(/\/chat\/completions$/, "");
}

export async function testProviderConnection(provider: {
  baseUrl: string;
  apiKey: string;
  apiPath?: string;
  model?: string;
}): Promise<{ success: boolean; message: string }> {
  const baseUrl = normalizeBaseUrl(provider.baseUrl);

  // Try GET /models first
  try {
    const response = await fetch(`${baseUrl}/models`, {
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
    const testModel = provider.model || "gpt-4o-mini";
    const chatResponse = await fetch(`${baseUrl}${chatPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: testModel,
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
}): Promise<{
  success: boolean;
  models: Array<{ id: string; owned_by?: string }>;
  error?: string;
}> {
  const baseUrl = normalizeBaseUrl(provider.baseUrl);

  try {
    const response = await fetch(`${baseUrl}/models`, {
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
