import { NextResponse } from "next/server";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function isLoopbackOrigin(origin: string): boolean {
  try {
    return LOOPBACK_HOSTS.has(new URL(origin).hostname);
  } catch {
    return false;
  }
}

function getConfiguredOrigins(): Set<string> {
  const origins = new Set<string>();

  for (const candidate of [
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ]) {
    if (!candidate) continue;
    const origin = normalizeOrigin(candidate);
    if (origin) {
      origins.add(origin);
    }
  }

  return origins;
}

function getRequestSourceOrigin(request: Request): string | null {
  const originHeader = request.headers.get("origin");
  if (originHeader) {
    return normalizeOrigin(originHeader);
  }

  const refererHeader = request.headers.get("referer");
  if (refererHeader) {
    return normalizeOrigin(refererHeader);
  }

  return null;
}

export function validateSameOriginRequest(request: Request): NextResponse | null {
  if (SAFE_METHODS.has(request.method.toUpperCase())) {
    return null;
  }

  const sourceOrigin = getRequestSourceOrigin(request);
  if (!sourceOrigin) {
    return NextResponse.json(
      { error: "Origin-Pruefung fehlgeschlagen." },
      { status: 403 }
    );
  }

  const allowedOrigins = getConfiguredOrigins();
  if (allowedOrigins.has(sourceOrigin)) {
    return null;
  }

  if (process.env.NODE_ENV !== "production" && isLoopbackOrigin(sourceOrigin)) {
    return null;
  }

  return NextResponse.json(
    { error: "Origin-Pruefung fehlgeschlagen." },
    { status: 403 }
  );
}
