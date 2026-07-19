import { Injectable, Logger } from '@nestjs/common';

// Simple in-memory cache (replace with Redis when cache-manager is configured)
// Structure: Map<cacheKey, { value: any, expiresAt: number }>
const store = new Map<string, { value: any; expiresAt: number }>();

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  /**
   * Get a value from cache.
   * Returns null if not found or expired.
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return null;
    }
    this.logger.log(`Cache HIT: ${key}`);
    return entry.value as T;
  }

  /**
   * Set a value in cache with a TTL in seconds.
   */
  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    this.logger.log(`Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
  }

  /**
   * Invalidate a specific key.
   */
  async del(key: string): Promise<void> {
    store.delete(key);
    this.logger.log(`Cache DEL: ${key}`);
  }

  // ── Convenience TTL helpers ────────────────────
  static readonly TTL_RECOMMENDATION = 24 * 60 * 60; // 24 hours
  static readonly TTL_FORECAST = 12 * 60 * 60;        // 12 hours
  // Simulation: No cache (always on-demand)

  static buildKey(prefix: string, userId: string): string {
    return `${prefix}:${userId}`;
  }
}
