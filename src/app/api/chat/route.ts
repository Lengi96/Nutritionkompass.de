/**
 * Demo Chat API Route - Security-Layer Referenz-Implementierung
 *
 * Diese Route existiert als Showcase, wie die AI Security Guards in einer
 * direkten Next.js API Route (ausserhalb von tRPC) eingebunden werden.
 */

import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { validateSameOriginRequest } from "@/server/security/same-origin";
import { validateInput, sanitizeOutput } from "@/lib/ai-security/guardrails";

const chatRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const CHAT_RATE_LIMIT = 20;
const CHAT_RATE_WINDOW_MS = 15 * 60 * 1000;

function checkChatRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = chatRateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    chatRateLimitMap.set(userId, { count: 1, resetAt: now + CHAT_RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= CHAT_RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

const openaiProvider = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const NUTRITION_SYSTEM_PROMPT = `Du bist ein spezialisierter Ernaehrungsassistent fuer eine Healthcare-Anwendung.
Du hilfst ausschliesslich mit Fragen zu Ernaehrung, Lebensmitteln, Rezepten und Mahlzeiten.
Du gibst keine medizinischen Diagnosen und keine Informationen ausserhalb des Ernaehrungsthemas.
Antworte auf Deutsch, freundlich und professionell.`;

export async function POST(req: Request) {
  const sameOriginError = validateSameOriginRequest(req);
  if (sameOriginError) {
    return sameOriginError;
  }

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  if (!checkChatRateLimit(session.user.id)) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte versuchen Sie es spaeter erneut." },
      { status: 429 }
    );
  }

  let messages: Array<{ role: string; content: string }>;
  try {
    const body = (await req.json()) as { messages?: unknown };
    if (!Array.isArray(body.messages)) {
      return NextResponse.json({ error: "Ungueltiges Request-Format." }, { status: 400 });
    }
    messages = body.messages as Array<{ role: string; content: string }>;
  } catch {
    return NextResponse.json({ error: "Ungueltiger JSON-Body." }, { status: 400 });
  }

  const lastUserMessage = messages.findLast((message) => message.role === "user")?.content ?? "";
  if (!lastUserMessage) {
    return NextResponse.json({ error: "Keine Nachricht gefunden." }, { status: 400 });
  }

  const validation = await validateInput(lastUserMessage);
  if (!validation.safe) {
    return NextResponse.json(
      { error: "Anfrage konnte nicht verarbeitet werden. Bitte ueberpruefen Sie Ihre Eingabe." },
      { status: 400 }
    );
  }

  try {
    const result = streamText({
      model: openaiProvider("gpt-4o-mini"),
      system: NUTRITION_SYSTEM_PROMPT,
      messages: messages.map((message) => ({
        role: message.role as "user" | "assistant" | "system",
        content: sanitizeOutput(message.content),
      })),
      temperature: 0.3,
      maxTokens: 800,
    });

    return result.toDataStreamResponse();
  } catch {
    return NextResponse.json(
      { error: "Die Anfrage konnte nicht bearbeitet werden. Bitte versuchen Sie es erneut." },
      { status: 500 }
    );
  }
}

export function GET() {
  return NextResponse.json({ error: "Methode nicht erlaubt." }, { status: 405 });
}
