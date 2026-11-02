import { createHash } from "node:crypto";
import { getDb } from "./db";

/** Anonymous key for the caller. The IP address is hashed so raw IPs are never stored. */
export function clientKey(request: Request, scope: string): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  return `${scope}:${createHash("sha256").update(ip).digest("hex").slice(0, 32)}`;
}

/** Fixed-window counter stored in the RateLimit table. Allows `limit` requests per `windowMs`. */
export async function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = new Date();
  return getDb().$transaction(async (tx) => {
    const row = await tx.rateLimit.findUnique({ where: { key } });

    if (!row || now.getTime() - row.windowStart.getTime() >= windowMs) {
      await tx.rateLimit.upsert({ where: { key }, create: { key, count: 1, windowStart: now }, update: { count: 1, windowStart: now } });
      return { allowed: true, retryAfterSec: 0 };
    }
    if (row.count >= limit) {
      return { allowed: false, retryAfterSec: Math.ceil((row.windowStart.getTime() + windowMs - now.getTime()) / 1000) };
    }
    await tx.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
    return { allowed: true, retryAfterSec: 0 };
  });
}
/**
 * Read-only check: is this key already over its limit?
 * It does not count anything. Used to block callers BEFORE doing work.
 */
export async function isRateLimited(
  key: string,
  limit: number,
  windowMs: number,
) {
  const row = await getDb().rateLimit.findUnique({ where: { key } });
  if (!row) return { limited: false, retryAfterSec: 0 };

  const elapsed = Date.now() - row.windowStart.getTime();
  if (elapsed >= windowMs || row.count < limit) {
    return { limited: false, retryAfterSec: 0 };
  }
  return { limited: true, retryAfterSec: Math.ceil((windowMs - elapsed) / 1000) };
}

/** Counts one failed attempt for this key (fixed window, same table). */
export async function recordFailure(key: string, windowMs: number) {
  await checkRateLimit(key, Number.MAX_SAFE_INTEGER, windowMs);
}