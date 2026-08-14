import { NextResponse } from 'next/server';

/**
 * High-Performance Sliding Window In-Memory Rate Limiter
 */
class RateLimiter {
  constructor() {
    this.hits = new Map(); // key -> [timestamp, timestamp, ...]
    
    // Auto-cleanup stale entries every 2 minutes
    if (typeof setInterval !== 'undefined') {
      const timer = setInterval(() => this.cleanup(), 1000 * 60 * 2);
      if (timer.unref) timer.unref();
    }
  }

  /**
   * Check if a request exceeds rate limit
   * @param {string} identifier IP address or user ID
   * @param {number} limit Max requests allowed in window
   * @param {number} windowMs Window duration in milliseconds (default 1 min)
   * @returns {{ success: boolean, limit: number, remaining: number, resetMs: number }}
   */
  check(identifier, limit = 60, windowMs = 60 * 1000) {
    const now = Date.now();
    const windowStart = now - windowMs;

    let timestamps = this.hits.get(identifier) || [];
    
    // Filter timestamps within current sliding window
    timestamps = timestamps.filter(ts => ts > windowStart);

    if (timestamps.length >= limit) {
      const oldest = timestamps[0];
      const resetMs = Math.max(0, (oldest + windowMs) - now);
      return {
        success: false,
        limit,
        remaining: 0,
        resetMs
      };
    }

    timestamps.push(now);
    this.hits.set(identifier, timestamps);

    return {
      success: true,
      limit,
      remaining: limit - timestamps.length,
      resetMs: windowMs
    };
  }

  cleanup() {
    const now = Date.now();
    const maxWindow = 1000 * 60 * 15; // 15 mins
    for (const [key, timestamps] of this.hits.entries()) {
      const active = timestamps.filter(ts => ts > now - maxWindow);
      if (active.length === 0) {
        this.hits.delete(key);
      } else {
        this.hits.set(key, active);
      }
    }
  }
}

// Global Singleton RateLimiter
let rateLimiterInstance = global.__oneStopRateLimiter;
if (!rateLimiterInstance) {
  rateLimiterInstance = global.__oneStopRateLimiter = new RateLimiter();
}

/**
 * Extract client IP from Next.js request headers
 */
export function getClientIp(request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || '127.0.0.1';
}

/**
 * Rate limit guard helper for Next.js route handlers
 * 
 * @param {Request} request Next.js request
 * @param {Object} options { limit, windowMs, prefix }
 * @returns {NextResponse | null} Returns 429 response if rate limited, or null if allowed
 */
export function rateLimitGuard(request, { limit = 60, windowMs = 60 * 1000, prefix = 'global' } = {}) {
  const ip = getClientIp(request);
  const key = `${prefix}:${ip}`;
  
  const result = rateLimiterInstance.check(key, limit, windowMs);
  
  if (!result.success) {
    const retryAfterSec = Math.ceil(result.resetMs / 1000);
    return NextResponse.json(
      { 
        error: 'Too many requests. Please try again later.',
        retryAfter: retryAfterSec
      }, 
      { 
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSec),
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil((Date.now() + result.resetMs) / 1000))
        }
      }
    );
  }

  return null;
}

export default rateLimiterInstance;
