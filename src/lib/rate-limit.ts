import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate-limit dùng chung cho các endpoint công khai (`/api/track`, `/api/auth/username`).
 *
 * - Có `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` → dùng Upstash (sliding window),
 *   giới hạn CHIA SẺ giữa mọi instance/edge → chống spam thật sự.
 * - Thiếu env → fallback in-memory per-instance (best-effort, đủ cho dev/preview).
 *
 * Tương thích cả edge lẫn node runtime (Upstash giao tiếp qua REST).
 */

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const limiters = new Map<string, Ratelimit>();

function getLimiter(limit: number, windowSeconds: number): Ratelimit | null {
  if (!redis) return null;
  const key = `${limit}:${windowSeconds}`;
  let limiter = limiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      prefix: "bio_rl",
      analytics: false,
    });
    limiters.set(key, limiter);
  }
  return limiter;
}

const memory = new Map<string, { count: number; reset: number }>();

function memoryLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || now > entry.reset) {
    memory.set(key, { count: 1, reset: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > limit;
}

/**
 * Trả `true` khi `identifier` đã vượt ngưỡng `limit` trong cửa sổ `windowSeconds`.
 * Lỗi mạng Redis → tự fallback in-memory để không chặn nhầm người dùng thật.
 */
export async function isRateLimited(
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const limiter = getLimiter(limit, windowSeconds);
  if (limiter) {
    try {
      const { success } = await limiter.limit(identifier);
      return !success;
    } catch {
      return memoryLimited(identifier, limit, windowSeconds * 1000);
    }
  }
  return memoryLimited(identifier, limit, windowSeconds * 1000);
}

/** Lấy IP client từ header CDN/proxy (best-effort). */
export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
