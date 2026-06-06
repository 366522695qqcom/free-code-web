import { NextRequest, NextResponse } from "next/server";
import { getActiveProvider } from "@/lib/llm/providers";
import { streamAnthropic } from "@/lib/llm/anthropic";
import { streamOpenAI } from "@/lib/llm/openai";
import { getSession } from "@/lib/auth";
import type { Message } from "@/types";

const COMPACT_SYSTEM_PROMPT = `You are a conversation compaction agent. Your job is to summarize the conversation so far in a concise way that preserves:
1. Key decisions and their rationale
2. Important code changes made (file paths, what was changed)
3. Current task state and progress
4. Any errors encountered and how they were resolved
5. User preferences and constraints mentioned

Output ONLY the summary, no preamble or explanation. Be thorough but concise.`;

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { messages, model } = body as {
      messages: Array<{ role: string; content: string }>;
      model?: string;
    };

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "No messages to compact" }, { status: 400 });
    }

    const modelName = model || "claude-sonnet-4-20250514";

    // Build a text representation of the conversation for summarization
    const conversationText = messages
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n---\n\n");

    // Build messages in the Message format expected by the LLM streaming functions
    const compactMessages: Message[] = [
      {
        id: `user-compact-${Date.now()}`,
        role: "user",
        content: [
          {
            type: "text",
            text: `Please summarize this conversation concisely, preserving key context, decisions, and code changes:\n\n${conversationText}`,
          },
        ],
        timestamp: new Date().toISOString(),
      },
    ];

    // Call LLM to generate summary
    let summary = "";
    const provider = getActiveProvider();

    const streamOptions = {
      model: modelName,
      systemPrompt: COMPACT_SYSTEM_PROMPT,
      maxTokens: 8000,
    };

    if (provider === "anthropic") {
      for await (const event of streamAnthropic(compactMessages, streamOptions)) {
        if (event.type === "text") {
          const data = event.data as { text?: string };
          summary += data.text || "";
        }
      }
    } else if (provider === "openai") {
      for await (const event of streamOpenAI(compactMessages, streamOptions)) {
        if (event.type === "text") {
          const data = event.data as { text?: string };
          summary += data.text || "";
        }
      }
    } else {
      return NextResponse.json(
        { error: `Provider "${provider}" is not supported for compaction` },
        { status: 500 }
      );
    }

    if (!summary.trim()) {
      return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
    }

    // Return compacted messages: a single user message with the summary
    const compactedMessages = [
      {
        id: `user-compacted-${Date.now()}`,
        role: "user",
        content: `[Conversation summary]\n\n${summary}`,
        timestamp: Date.now(),
      },
    ];

    return NextResponse.json({
      compactedMessages,
      summary,
    });
  } catch (error) {
    console.error("Compact error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Compact failed" },
      { status: 500 }
    );
  }
}
