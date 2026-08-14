/**
 * Enterprise Cache-Aside & Circuit Breaker Manager
 * 
 * Features:
 * - In-Memory Key-Value store with TTL (Time-To-Live) per key
 * - LRU (Least-Recently-Used) Eviction when capacity threshold is reached
 * - Stale-While-Revalidate / Circuit Breaker fallback: returns stale data if upstream provider fails
 * - Memory leak safe with periodic cleanup timer
 */

class CacheManager {
  constructor(maxItems = 1000, defaultTTL = 1000 * 60 * 15) {
    this.maxItems = maxItems;
    this.defaultTTL = defaultTTL; // 15 mins default
    this.cache = new Map(); // key -> { value, expiresAt, staleUntil }
    this.cleanupInterval = 1000 * 60 * 5; // 5 mins
    
    if (typeof setInterval !== 'undefined') {
      const timer = setInterval(() => this.purgeExpired(), this.cleanupInterval);
      if (timer.unref) timer.unref(); // Prevent blocking process exit in Node
    }
  }

  /**
   * Set cache entry with custom TTL and stale retention period
   */
  set(key, value, ttlMs = this.defaultTTL, staleRetentionMs = 1000 * 60 * 60 * 24) {
    // If cache is at max capacity, evict oldest entry (LRU)
    if (this.cache.size >= this.maxItems) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    const now = Date.now();
    this.cache.set(key, {
      value,
      expiresAt: now + ttlMs,
      staleUntil: now + ttlMs + staleRetentionMs
    });
  }

  /**
   * Get fresh cache entry. If expired but within stale retention, returns stale entry if allowStale=true
   */
  get(key, allowStale = false) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();

    // Fresh
    if (now <= entry.expiresAt) {
      // Refresh LRU order
      this.cache.delete(key);
      this.cache.set(key, entry);
      return entry.value;
    }

    // Stale fallback
    if (allowStale && now <= entry.staleUntil) {
      return entry.value;
    }

    // Expired completely
    if (now > entry.staleUntil) {
      this.cache.delete(key);
    }

    return null;
  }

  /**
   * Cache-Aside Fetch Wrapper with Circuit Breaker / Fallback
   * 
   * @param {string} key Cache key
   * @param {Function} fetcher Async function to fetch fresh data
   * @param {number} ttlMs TTL in milliseconds
   */
  async getOrSet(key, fetcher, ttlMs = this.defaultTTL) {
    // 1. Check fresh cache
    const cached = this.get(key, false);
    if (cached !== null) {
      return cached;
    }

    // 2. Fetch fresh data
    try {
      const freshData = await fetcher();
      if (freshData !== undefined && freshData !== null) {
        this.set(key, freshData, ttlMs);
      }
      return freshData;
    } catch (error) {
      console.warn(`[CacheManager] Upstream fetch failed for key "${key}". Checking for stale fallback.`);
      
      // 3. Fallback to stale cached data (Circuit Breaker)
      const staleData = this.get(key, true);
      if (staleData !== null) {
        console.info(`[CacheManager] Serving stale fallback data for key "${key}".`);
        return staleData;
      }
      
      // No fallback available, propagate error
      throw error;
    }
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  purgeExpired() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.staleUntil) {
        this.cache.delete(key);
      }
    }
  }

  stats() {
    return {
      size: this.cache.size,
      maxItems: this.maxItems
    };
  }
}

// Global Singleton instance
let cacheInstance = global.__oneStopCache;
if (!cacheInstance) {
  cacheInstance = global.__oneStopCache = new CacheManager(2000, 1000 * 60 * 30);
}

export default cacheInstance;
