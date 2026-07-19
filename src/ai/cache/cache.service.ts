import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis(this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379');
  }

  /**
   * Get a value from cache.
   * Returns null if not found or expired.
   */
  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    if (!data) return null;
    this.logger.log(`Cache HIT: ${key}`);
    return JSON.parse(data) as T;
  }

  /**
   * Set a value in cache with a TTL in seconds.
   */
  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    this.logger.log(`Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
  }

  /**
   * Invalidate a specific key.
   */
  async del(key: string): Promise<void> {
    await this.redis.del(key);
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
