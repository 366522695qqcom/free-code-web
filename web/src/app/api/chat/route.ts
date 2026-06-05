import { NextRequest } from "next/server";
import { createQueryEngine } from "@/lib/query-engine";
import { createSSEResponse } from "@/lib/sse";
import type { ChatRequest, QueryEngineEvent } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();

    if (!body.messages || !Array.isArray(body.messages)) {
      return new Response(
        JSON.stringify({ error: "messages is required and must be an array" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const provider = process.env.MODEL_PROVIDER || "anthropic";

    if (provider !== "anthropic") {
      return new Response(
        JSON.stringify({
          error: `Provider "${provider}" is not yet implemented. Only "anthropic" is supported currently.`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const engine = createQueryEngine({
      model: body.model,
    });

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          for await (const event of engine.run(body.messages)) {
            const sseEvent: QueryEngineEvent = event;
            const line = `event: ${sseEvent.event}\ndata: ${sseEvent.data}\n\n`;
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
}
