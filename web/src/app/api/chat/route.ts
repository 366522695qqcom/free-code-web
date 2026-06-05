import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createLLMProvider } from "@/lib/llm";
import { createSSEResponse } from "@/lib/sse";
import type { ChatRequest } from "@/types";

export const POST = requireAuth(async (request: NextRequest) => {
  try {
    const body: ChatRequest = await request.json();

    if (!body.messages || !Array.isArray(body.messages)) {
      return new Response(
        JSON.stringify({ error: "messages is required and must be an array" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const provider = createLLMProvider({ model: body.model });

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          for await (const event of provider.run(body.messages)) {
            const line = `event: ${event.event}\ndata: ${event.data}\n\n`;
            controller.enqueue(encoder.encode(line));
          }
          controller.close();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ error: message })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return createSSEResponse(stream);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
