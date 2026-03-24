import type { Redis } from "ioredis";
import type { RateLimitResult } from "./types";

export class SlidingWindowRateLimiter {
	private redis: Redis;
	private keyPrefix: string;

	constructor(redis: Redis, keyPrefix = "rate") {
		this.redis = redis;
		this.keyPrefix = keyPrefix;
	}

	buildKey(endpoint: string, identifier: string): string {
		const sanitizedEndpoint = endpoint
			.replace(/^\//, "")
			.replace(/[^a-zA-Z0-9_-]/g, "_");
		return `${this.keyPrefix}:${sanitizedEndpoint}:${identifier}`;
	}

	generateRequestId(): string {
		return `${Date.now()}:${Math.random().toString(36).substring(2, 15)}`;
	}

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
		const ttlMs = windowMs;

		const luaScript = `
			local key = KEYS[1]
			local now = tonumber(ARGV[1])
			local windowStart = tonumber(ARGV[2])
			local limit = tonumber(ARGV[3])
			local requestId = ARGV[4]
			local ttlMs = tonumber(ARGV[5])
			
			-- Remove expired entries (scores are timestamps in ms)
			redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)
			
			-- Get current count
			local currentCount = redis.call('ZCARD', key)
			
			-- Check if limit exceeded
			if currentCount >= limit then
				-- Get oldest entry to calculate when it will expire
				local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
				local oldestScore = tonumber(oldest[2]) or now
				
				-- Calculate when the oldest entry will expire
				local expiresAt = oldestScore + ttlMs
				local retryAfterMs = math.max(0, expiresAt - now)
				local retryAfterSec = math.max(1, math.ceil(retryAfterMs / 1000))
				
				return {0, currentCount, retryAfterSec}
			end
			
			-- Add new request
			redis.call('ZADD', key, now, requestId)
			
			-- Set TTL on key (window + buffer to ensure cleanup)
			redis.call('EXPIRE', key, math.ceil(ttlMs / 1000) + 1)
			
			-- Get updated count
			currentCount = redis.call('ZCARD', key)
			
			-- Calculate reset time (when window resets)
			local resetAt = math.ceil((now + ttlMs) / 1000)
			
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
				ttlMs.toString(),
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
			console.error("[RateLimiter] Redis error during check:", error);
			return {
				allowed: true,
				limit,
				remaining: limit,
				resetAt: Math.ceil((now + windowMs) / 1000),
				retryAfter: 0,
				currentCount: 0,
			};
		}
	}

	async reset(endpoint: string, identifier: string): Promise<void> {
		const key = this.buildKey(endpoint, identifier);
		await this.redis.del(key);
	}

	async getCount(endpoint: string, identifier: string): Promise<number> {
		const key = this.buildKey(endpoint, identifier);
		const count = await this.redis.zcount(key, "-inf", now);
		return count;
	}
}
