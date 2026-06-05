/**
 * Server-Sent Events (SSE) streaming infrastructure.
 *
 * Provides helper functions for:
 * - Creating SSE streams from ReadableStream on the server
 * - Parsing SSE events on the client side
 */

/** SSE event data structure */
export interface SSEEvent {
  event?: string;
  data: string;
  id?: string;
  retry?: number;
}

/**
 * Create an SSE-formatted ReadableStream from a source ReadableStream<Uint8Array>.
 * Used on the server side in API routes.
 *
 * @param source - The source ReadableStream to convert
 * @returns A new ReadableStream that formats data as SSE events
 */
export function createSSEStream(source: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const reader = source.getReader();
  const encoder = new TextEncoder();

  return new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }
        const text = new TextDecoder().decode(value);
        controller.enqueue(encoder.encode(`data: ${text}\n\n`));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: message })}\n\n`));
        controller.close();
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}

/**
 * Create an SSE Response object suitable for Next.js API routes.
 *
 * @param source - The source ReadableStream to convert
 * @param init - Optional ResponseInit for status/headers
 * @returns A Response with SSE headers and streamed body
 */
export function createSSEResponse(
  source: ReadableStream<Uint8Array>,
  init?: ResponseInit
): Response {
  const stream = createSSEStream(source);

  return new Response(stream, {
    ...init,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      ...init?.headers,
    },
  });
}

/**
 * Parse an SSE event stream on the client side.
 * Yields parsed SSEEvent objects as they arrive.
 *
 * @param response - The fetch Response object
 * @returns An async generator of SSEEvent objects
 */
export async function* parseSSEStream(response: Response): AsyncGenerator<SSEEvent> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Response body is not readable");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent: Partial<SSEEvent> = {};

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      // Keep the last (potentially incomplete) line in the buffer
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line === "") {
          // Empty line signals end of event
          if (currentEvent.data !== undefined) {
            yield currentEvent as SSEEvent;
          }
          currentEvent = {};
          continue;
        }

        if (line.startsWith(":")) {
          // Comment, ignore
          continue;
        }

        const colonIndex = line.indexOf(":");
        if (colonIndex === -1) {
          // Field with no value
          const field = line.trim();
          if (field === "data") {
            currentEvent.data = currentEvent.data ? currentEvent.data + "\n" : "";
          }
          continue;
        }

        const field = line.slice(0, colonIndex).trim();
        const value = line.slice(colonIndex + 1).trimStart();

        switch (field) {
          case "event":
            currentEvent.event = value;
            break;
          case "data":
            if (value === "[DONE]") return;
            currentEvent.data = currentEvent.data ? currentEvent.data + "\n" + value : value;
            break;
          case "id":
            currentEvent.id = value;
            break;
          case "retry":
            currentEvent.retry = parseInt(value, 10);
            break;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Connect to an SSE endpoint and return an async generator of parsed events.
 *
 * @param url - The SSE endpoint URL
 * @param init - Optional fetch RequestInit
 * @returns An async generator of SSEEvent objects
 */
export async function* connectSSE(
  url: string,
  init?: RequestInit
): AsyncGenerator<SSEEvent> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "text/event-stream",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`SSE connection failed: ${response.status} ${response.statusText}`);
  }

  yield* parseSSEStream(response);
}
