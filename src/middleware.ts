import NextAuth from "next-auth";
import { authConfig } from "@/server/auth.config";
import { NextResponse, type NextRequest } from "next/server";

// Edge-kompatible Middleware: Verwendet nur auth.config (ohne Prisma/bcrypt)
const { auth } = NextAuth(authConfig);

// Geschützte Routen (Login erforderlich)
const protectedPaths = ["/dashboard", "/patients", "/meal-plans", "/shopping-lists", "/agent", "/settings", "/fhir-export", "/billing", "/profile"];
// Öffentliche Routen (kein Login nötig)
const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/invite", "/impressum", "/datenschutz", "/agb", "/avv", "/api/auth", "/api/trpc", "/api/health", "/api/webhooks/stripe"];

// ─── Rate-Limiting (In-Memory, Edge-kompatibel) ─────────────────────────────
// Schützt Auth-Endpoints gegen Brute-Force-Angriffe.
// Begrenzt: 15 Requests pro 15 Minuten pro IP.
// Hinweis: Setzt sich bei Serverless-Cold-Start zurück — akzeptabel für MVP.

const RATE_LIMIT_MAX = 15;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 Minuten

// Pfade, die rate-limited werden sollen (tRPC Auth-Prozeduren)
const RATE_LIMITED_PATHS = [
  "/api/trpc/auth.login",
  "/api/trpc/auth.register",
  "/api/trpc/auth.forgotPassword",
  "/api/trpc/auth.resetPassword",
  "/api/trpc/auth.resendVerification",
];

type RateLimitEntry = { count: number; resetAt: number };
const rateLimitStore = new Map<string, RateLimitEntry>();

function getRateLimitKey(req: NextRequest): string | null {
  const pathname = req.nextUrl.pathname;
  const isRateLimited = RATE_LIMITED_PATHS.some((p) => pathname.startsWith(p));
  if (!isRateLimited) return null;

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  return `${ip}:${pathname}`;
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    // Neues Fenster starten
    const resetAt = now + RATE_LIMIT_WINDOW_MS;
    rateLimitStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt };
  }

  entry.count++;
  const remaining = Math.max(0, RATE_LIMIT_MAX - entry.count);

  if (entry.count > RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining, resetAt: entry.resetAt };
}

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────

function isProtectedRoute(pathname: string): boolean {
  return protectedPaths.some((path) => pathname === path || pathname.startsWith(path + "/"));
}

function isPublicRoute(pathname: string): boolean {
  return publicPaths.some((path) => pathname === path || pathname.startsWith(path + "/"));
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // Rate-Limit auf Auth-Endpoints prüfen
  const rateLimitKey = getRateLimitKey(req);
  if (rateLimitKey) {
    const { allowed, remaining, resetAt } = checkRateLimit(rateLimitKey);
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ error: "Too Many Requests. Bitte warten Sie kurz." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
            "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
          },
        }
      );
    }
    // Erfolgreiche Rate-Limit-Header anhängen
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", String(RATE_LIMIT_MAX));
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    response.headers.set("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));
    return response;
  }

  const isLoggedIn = !!req.auth;

  // Öffentliche Routen und API-Routes durchlassen
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Root-URL → Landing Page (öffentlich)
  if (pathname === "/") {
    return NextResponse.next();
  }

  // Nicht eingeloggt auf geschützter Route → Redirect zu Login
  if (!isLoggedIn && isProtectedRoute(pathname)) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Admin-Seiten nur für Admins
  if ((pathname.startsWith("/settings") || pathname.startsWith("/fhir-export")) && isLoggedIn) {
    const role = req.auth?.user?.role;
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Seiten (keine Assets)
    "/((?!_next|.*\\..*).*)",
  ],
};
