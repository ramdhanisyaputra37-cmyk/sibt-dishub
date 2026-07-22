import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiting untuk endpoint publik/tanpa-sesi (login, kios) — docs/01 §4.6.
 * Produksi: Upstash Redis (REST, cocok serverless). Bila kredensial belum ada
 * (mis. dev lokal), fallback ke limiter in-memory dengan PERINGATAN eksplisit
 * bahwa itu tidak aman untuk multi-instance production.
 */

type LimitResult = { success: boolean; remaining: number; reset: number };

interface Limiter {
  limit(identifier: string): Promise<LimitResult>;
}

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

function createUpstashLimiter(prefix: string, max: number, windowSec: number): Limiter {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  const rl = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, `${windowSec} s`),
    prefix: `sibt:${prefix}`,
    analytics: false,
  });
  return {
    async limit(identifier: string) {
      const r = await rl.limit(identifier);
      return { success: r.success, remaining: r.remaining, reset: r.reset };
    },
  };
}

// Fallback in-memory: sliding window sederhana per identifier. TIDAK dibagi
// antar instance serverless — hanya untuk dev / single-instance.
const memoryStore = new Map<string, number[]>();
let warnedOnce = false;

function createMemoryLimiter(prefix: string, max: number, windowSec: number): Limiter {
  if (!warnedOnce && process.env.NODE_ENV === "production") {
    console.warn(
      "[rate-limiter] PERINGATAN: kredensial Upstash tidak diset. " +
        "Menggunakan limiter in-memory yang TIDAK aman untuk deployment " +
        "multi-instance (Vercel serverless). Set UPSTASH_REDIS_REST_URL & " +
        "UPSTASH_REDIS_REST_TOKEN sebelum go-live (docs/01 §4.6).",
    );
    warnedOnce = true;
  }
  const windowMs = windowSec * 1000;
  return {
    async limit(identifier: string) {
      const key = `${prefix}:${identifier}`;
      const now = Date.now();
      const hits = (memoryStore.get(key) ?? []).filter(
        (t) => now - t < windowMs,
      );
      if (hits.length >= max) {
        return {
          success: false,
          remaining: 0,
          reset: hits[0]! + windowMs,
        };
      }
      hits.push(now);
      memoryStore.set(key, hits);
      return { success: true, remaining: max - hits.length, reset: now + windowMs };
    },
  };
}

function makeLimiter(prefix: string, max: number, windowSec: number): Limiter {
  return hasUpstash
    ? createUpstashLimiter(prefix, max, windowSec)
    : createMemoryLimiter(prefix, max, windowSec);
}

// 5 percobaan login / menit / identifier (email+IP).
export const loginLimiter = makeLimiter("login", 5, 60);
// 10 aksi kios / menit / IP.
export const kioskLimiter = makeLimiter("kiosk", 10, 60);
