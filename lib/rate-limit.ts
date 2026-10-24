import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

type Limiter = { limit: (key: string) => Promise<{ success: boolean }> };

// In-memory fallback for local dev (and if Upstash isn't configured). On Vercel each
// instance has its own memory, so production should set the Upstash env vars.
function memoryLimiter(max: number, windowMs: number): Limiter {
  const hits = new Map<string, number[]>();
  return {
    async limit(key) {
      const now = Date.now();
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      recent.push(now);
      hits.set(key, recent);
      return { success: recent.length <= max };
    },
  };
}

function makeLimiter(prefix: string, max: number, windowSeconds: number): Limiter {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    return new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(max, `${windowSeconds} s`),
      prefix: `ofada:${prefix}`,
    });
  }
  return memoryLimiter(max, windowSeconds * 1000);
}

const limiters = {
  checkout: makeLimiter("checkout", 10, 600), // 10 per 10 minutes
  quote: makeLimiter("quote", 30, 600),
  login: makeLimiter("login", 10, 600),
};

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/** true if this request is allowed. */
export async function checkRateLimit(name: keyof typeof limiters): Promise<boolean> {
  const { success } = await limiters[name].limit(await clientIp());
  return success;
}
