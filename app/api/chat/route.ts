import { NextResponse, type NextRequest } from "next/server";
import { runBookingChat, type ChatMessage } from "@/lib/ai/booking-agent";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { getCurrentPatient } from "@/lib/auth/patient";
import { clearChatHistory, getChatHistory, saveChatMessage } from "@/lib/chat-history";
import { getClientIdentifier, rateLimit } from "@/lib/rate-limit";

const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 2000;

function parseMessages(body: unknown): ChatMessage[] | null {
  if (typeof body !== "object" || body === null) return null;
  const raw = (body as { messages?: unknown }).messages;
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_MESSAGES) return null;

  const messages: ChatMessage[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) return null;
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string" || content.trim().length === 0) return null;
    messages.push({ role, content: content.slice(0, MAX_CONTENT_LENGTH) });
  }
  return messages;
}

export async function POST(request: NextRequest) {
  if (!isGeminiConfigured()) {
    return NextResponse.json(
      { error: "The booking assistant is not configured." },
      { status: 503 },
    );
  }

  const limiter = rateLimit(`chat:${getClientIdentifier(request.headers)}`, 20, 60_000);
  if (!limiter.allowed) {
    return NextResponse.json(
      { error: `Too many messages. Please wait ${limiter.retryAfterSeconds} seconds and try again.` },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const messages = parseMessages(body);
  if (!messages) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const patient = await getCurrentPatient();
  if (!patient) {
    return NextResponse.json({
      requiresLogin: true,
      reply: "Please sign in to your account so I can book on your behalf.",
    });
  }

  try {
    const result = await runBookingChat(messages, patient);

    const lastUserMessage = [...messages].reverse().find((message) => message.role === "user");
    try {
      if (lastUserMessage) await saveChatMessage(patient.id, lastUserMessage);
      await saveChatMessage(patient.id, { role: "assistant", content: result.reply });
    } catch (error) {
      console.error("[chat] could not persist history", error);
    }

    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[chat] assistant failed", error);
    return NextResponse.json(
      { error: "The assistant is unavailable right now. Please try again in a moment." },
      { status: 502 },
    );
  }
}

export async function GET() {
  const patient = await getCurrentPatient();
  if (!patient) {
    return NextResponse.json({ requiresLogin: true, messages: [] });
  }

  try {
    const messages = await getChatHistory(patient.id);
    return NextResponse.json({ messages }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[chat] could not load history", error);
    return NextResponse.json(
      { error: "Could not load your chat history right now." },
      { status: 502 },
    );
  }
}

export async function DELETE() {
  const patient = await getCurrentPatient();
  if (!patient) {
    return NextResponse.json({ requiresLogin: true });
  }

  try {
    await clearChatHistory(patient.id);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[chat] could not clear history", error);
    return NextResponse.json(
      { error: "Could not clear your chat history right now." },
      { status: 502 },
    );
  }
}
