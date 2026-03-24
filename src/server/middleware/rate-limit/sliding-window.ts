import type { Redis } from "ioredis";
import type { RateLimitResult } from "./types";

/**
 * Sliding Window Rate Limiter using Redis Sorted Sets (ZSET)
 *
 * Algorithm:
 * 1. Each request adds a timestamped entry to a sorted set
 * 2. Old entries outside the window are removed
 * 3. Current count determines if limit is exceeded
 * 4. TTL is set on the key for automatic cleanup
 *
 * Key structure: rate:{endpoint}:{identifier}
 * Sorted set members: {unique-id}
 * Sorted set scores: {timestamp-in-ms}
 */
export class SlidingWindowRateLimiter {
	private redis: Redis;
	private keyPrefix: string;

	constructor(redis: Redis, keyPrefix = "rate") {
		this.redis = redis;
		this.keyPrefix = keyPrefix;
	}

	/**
	 * Build the Redis key for rate limiting
	 */
	buildKey(endpoint: string, identifier: string): string {
		// Sanitize endpoint to remove leading slash and special chars
		const sanitizedEndpoint = endpoint
			.replace(/^\//, "")
			.replace(/[^a-zA-Z0-9_-]/g, "_");
		return `${this.keyPrefix}:${sanitizedEndpoint}:${identifier}`;
	}

	/**
	 * Generate a unique ID for each request
	 */
	generateRequestId(): string {
		return `${Date.now()}:${Math.random().toString(36).substring(2, 15)}`;
	}

	/**
	 * Check and record a rate limit hit
	 *
	 * @param endpoint - The endpoint being rate limited (e.g., "analyze")
	 * @param identifier - The client identifier (e.g., "user:123" or "ip:1.2.3.4")
	 * @param limit - Maximum requests allowed in window
	 * @param windowMs - Window duration in milliseconds
	 * @returns Rate limit result with allowed/denied status and metadata
	 */
	async check(
		endpoint: string,
		identifier: string,
		limit: number,
		windowMs: number,
	): Promise<RateLimitResult> {
		const key = this.buildKey(endpoint, identifier);
		const now = Date.now();
		const windowStart = now - windowMs;
		const requestId = this.generateRequestId();
		const windowSeconds = Math.ceil(windowMs / 1000);

		// Atomic Lua script for rate limiting
		// This ensures thread-safety across multiple requests
		const luaScript = `
			local key = KEYS[1]
			local now = tonumber(ARGV[1])
			local windowStart = tonumber(ARGV[2])
			local limit = tonumber(ARGV[3])
			local requestId = ARGV[4]
			local ttl = tonumber(ARGV[5])
			
			-- Remove expired entries
			redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)
			
			-- Get current count
			local currentCount = redis.call('ZCARD', key)
			
			-- Check if limit exceeded
			if currentCount >= limit then
				-- Get oldest entry to calculate retry-after
				local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
				local oldestScore = oldest[2] or now
				local retryAfter = math.ceil((oldestScore + ttl - now) / 1000)
				
				return {0, currentCount, retryAfter}
			end
			
			-- Add new request
			redis.call('ZADD', key, now, requestId)
			
			-- Set TTL on key (window + buffer)
			redis.call('EXPIRE', key, ttl + 1)
			
			-- Get updated count
			currentCount = redis.call('ZCARD', key)
			
			-- Calculate reset time (when oldest entry will expire)
			local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
			local oldestScore = oldest[2] or now
			local resetAt = math.ceil((oldestScore + ttl) / 1000)
			
			return {1, currentCount, resetAt}
		`;

		try {
			const result = (await this.redis.eval(
				luaScript,
				1,
				key,
				now.toString(),
				windowStart.toString(),
				limit.toString(),
				requestId,
				windowSeconds.toString(),
			)) as [number, number, number];

			const allowed = result[0] ?? 0;
			const currentCount = result[1] ?? 0;
			const value = result[2] ?? 0;
			const remaining = Math.max(0, limit - currentCount);
			const resetAt = allowed === 1 ? value : Math.ceil(now / 1000) + value;
			const retryAfter = allowed === 1 ? 0 : value;

			return {
				allowed: allowed === 1,
				limit,
				remaining,
				resetAt,
				retryAfter,
				currentCount,
			};
		} catch (error) {
			// On error, allow the request (fail-open)
			// The circuit breaker should handle this at a higher level
			console.error("[RateLimiter] Redis error during check:", error);
			return {
				allowed: true,
				limit,
				remaining: limit,
				resetAt: Math.ceil(now / 1000) + windowSeconds,
				retryAfter: 0,
				currentCount: 0,
			};
		}
	}

	/**
	 * Reset rate limit for a specific key (admin function)
	 */
	async reset(endpoint: string, identifier: string): Promise<void> {
		const key = this.buildKey(endpoint, identifier);
		await this.redis.del(key);
	}

	/**
	 * Get current count without incrementing
	 */
	async getCount(endpoint: string, identifier: string): Promise<number> {
		const key = this.buildKey(endpoint, identifier);
		const now = Date.now();

		// Get count of non-expired entries
		const count = await this.redis.zcount(key, "-inf", now);
		return count;
	}
}
