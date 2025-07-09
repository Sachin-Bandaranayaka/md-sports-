import { NextRequest } from 'next/server';

/**
 * Simple distributed rate-limiter for Edge + Node runtimes.
 *
 * Strategy hierarchy:
 * 1. If the environment exposes `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`,
 *    we use Upstash's HTTP API (works inside the Next.js Edge runtime).
 * 2. Otherwise we fall back to the old in-memory Map so local dev keeps working.
 */

interface RateLimitResult {
  allowed: boolean;
  count: number;
  remaining: number;
  resetTimeMs: number; // epoch millis when the window resets
}

export class RateLimiter {
  private readonly maxRequests: number;
  private readonly windowSec: number;
  private readonly useUpstash: boolean;
  private readonly upstashUrl?: string;
  private readonly upstashToken?: string;
  private readonly memoryStore: Map<string, { count: number; reset: number }> = new Map();

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowSec = Math.ceil(windowMs / 1000);

    this.upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
    this.upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    this.useUpstash = !!this.upstashUrl && !!this.upstashToken;
  }

  /**
   * Checks + increments the counter for the given key (usually an IP).
   */
  async check(key: string): Promise<RateLimitResult> {
    if (this.useUpstash) {
      return this.checkUpstash(key);
    }
    return this.checkMemory(key);
  }

  // ---------------- private helpers ----------------
  private async checkUpstash(key: string): Promise<RateLimitResult> {
    const base = this.upstashUrl!;
    const tokenParam = `?_token=${this.upstashToken}`;
    const incrRes = await fetch(`${base}/incr/rate:${key}${tokenParam}`, {
      method: 'POST',
    });
    const { result: count } = (await incrRes.json()) as { result: number };

    // First increment => set expiry on the key
    if (count === 1) {
      await fetch(`${base}/expire/rate:${key}/${this.windowSec}${tokenParam}`, {
        method: 'POST',
      }).catch(() => {}); // best-effort
    }

    // Get TTL to calculate reset time
    const ttlRes = await fetch(`${base}/ttl/rate:${key}${tokenParam}`);
    const { result: ttl } = (await ttlRes.json()) as { result: number };
    const resetTimeMs = Date.now() + ttl * 1000;

    return {
      allowed: count <= this.maxRequests,
      count,
      remaining: Math.max(0, this.maxRequests - count),
      resetTimeMs,
    };
  }

  private async checkMemory(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const existing = this.memoryStore.get(key);
    if (!existing || existing.reset < now) {
      this.memoryStore.set(key, {
        count: 1,
        reset: now + this.windowSec * 1000,
      });
    } else {
      existing.count += 1;
    }

    const entry = this.memoryStore.get(key)!;
    return {
      allowed: entry.count <= this.maxRequests,
      count: entry.count,
      remaining: Math.max(0, this.maxRequests - entry.count),
      resetTimeMs: entry.reset,
    };
  }
}

// Convenience singleton using env vars so callers don’t have to instantiate.
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
export const rateLimiter = new RateLimiter(RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS); 