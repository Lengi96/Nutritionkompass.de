import NextAuth from "next-auth";
import { authConfig } from "@/server/auth.config";
import { NextResponse } from "next/server";

// Edge-kompatible Middleware: Verwendet nur auth.config (ohne Prisma/bcrypt)
const { auth } = NextAuth(authConfig);

// Geschützte Routen (Login erforderlich)
const protectedPaths = ["/dashboard", "/patients", "/meal-plans", "/shopping-lists", "/settings", "/billing", "/profile"];
// Öffentliche Routen (kein Login nötig)
const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/invite", "/impressum", "/datenschutz", "/agb", "/api/auth", "/api/trpc", "/api/health", "/api/webhooks/stripe"];

function isProtectedRoute(pathname: string): boolean {
  return protectedPaths.some((path) => pathname === path || pathname.startsWith(path + "/"));
}

function isPublicRoute(pathname: string): boolean {
  return publicPaths.some((path) => pathname === path || pathname.startsWith(path + "/"));
}

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const pathname = nextUrl.pathname;

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

  // Settings-Seite nur für Admins
  if (pathname.startsWith("/settings") && isLoggedIn) {
    const role = req.auth?.user?.role;
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Keine Middleware für Next-Assets, API-Routen oder Dateipfade (z.B. .css, .js, .png)
    "/((?!api|_next|.*\\..*).*)",
  ],
};
