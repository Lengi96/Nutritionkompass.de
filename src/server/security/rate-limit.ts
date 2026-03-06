interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitEntry>();

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function consumeFixedWindowRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitDecision {
  const now = Date.now();
  const current = memoryStore.get(key);

  if (!current || now > current.resetAt) {
    const resetAt = now + windowMs;
    memoryStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  current.count += 1;
  const remaining = Math.max(0, maxRequests - current.count);
  return {
    allowed: current.count <= maxRequests,
    remaining,
    resetAt: current.resetAt,
  };
}
