/**
 * Demo Chat API Route — Security-Layer Referenz-Implementierung
 *
 * Diese Route existiert als Showcase, wie die AI Security Guards in einer
 * direkten Next.js API Route (außerhalb von tRPC) eingebunden werden.
 *
 * Architektur:
 *   Request → validateInput() → streamText() via Vercel AI SDK → sanitizeOutput()
 *
 * In Produktion: Die eigentliche Meal-Plan-Generierung läuft über tRPC
 * (src/trpc/routers/mealPlans.ts) — dort ist der Security-Layer ebenfalls aktiv.
 *
 * Verwendung als Referenz wenn zukünftig Chat-Funktionalität hinzugefügt wird.
 */

import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { validateInput, sanitizeOutput } from "@/lib/ai-security/guardrails";

const openaiProvider = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Nutrition-fokussierter System-Prompt — bewusst eingeschränkt
const NUTRITION_SYSTEM_PROMPT = `Du bist ein spezialisierter Ernährungsassistent für eine Healthcare-Anwendung.
Du hilfst ausschließlich mit Fragen zu Ernährung, Lebensmitteln, Rezepten und Mahlzeiten.
Du gibst keine medizinischen Diagnosen und keine Informationen außerhalb des Ernährungsthemas.
Antworte auf Deutsch, freundlich und professionell.`;

export async function POST(req: Request) {
  // 1. Authentifizierung prüfen (Session-basiert via NextAuth)
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "Nicht autorisiert." },
      { status: 401 }
    );
  }

  // 2. Request parsen
  let messages: Array<{ role: string; content: string }>;
  try {
    const body = (await req.json()) as { messages?: unknown };
    if (!Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: "Ungültiges Request-Format." },
        { status: 400 }
      );
    }
    messages = body.messages as Array<{ role: string; content: string }>;
  } catch {
    return NextResponse.json(
      { error: "Ungültiger JSON-Body." },
      { status: 400 }
    );
  }

  // 3. Letzten User-Input extrahieren und validieren
  const lastUserMessage = messages.findLast((m) => m.role === "user")?.content ?? "";

  if (!lastUserMessage) {
    return NextResponse.json(
      { error: "Keine Nachricht gefunden." },
      { status: 400 }
    );
  }

  // 4. SECURITY LAYER: Prompt-Injection-Check
  //    Zweistufig: Regex (~0ms) → LLM Classifier (~300ms)
  //    Fail-Safe: Bei Fehler im Classifier → Anfrage ablehnen
  const validation = await validateInput(lastUserMessage);
  if (!validation.safe) {
    // Bewusst generische Fehlermeldung (kein Hinweis auf das Blocking-System)
    return NextResponse.json(
      { error: "Anfrage konnte nicht verarbeitet werden. Bitte überprüfen Sie Ihre Eingabe." },
      { status: 400 }
    );
  }

  // 5. LLM-Antwort generieren (Vercel AI SDK — streamText für Streaming-Support)
  try {
    const result = streamText({
      model: openaiProvider("gpt-4o-mini"),
      system: NUTRITION_SYSTEM_PROMPT,
      messages: messages.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: sanitizeOutput(m.content), // Output vorheriger Turns ebenfalls sanitizen
      })),
      temperature: 0.3,
      maxTokens: 800,
    });

    // 6. Stream zurückgeben (Vercel AI SDK Data Stream Protocol)
    return result.toDataStreamResponse();
  } catch {
    return NextResponse.json(
      { error: "Die Anfrage konnte nicht bearbeitet werden. Bitte versuchen Sie es erneut." },
      { status: 500 }
    );
  }
}

// GET-Requests ablehnen (nur POST erlaubt)
export function GET() {
  return NextResponse.json({ error: "Methode nicht erlaubt." }, { status: 405 });
}
