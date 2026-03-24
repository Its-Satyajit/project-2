import Redis from "ioredis";
import { CircuitBreaker } from "./circuit-breaker";
import { SlidingWindowRateLimiter } from "./sliding-window";
import type {
	CircuitBreakerConfig,
	RateLimitResult,
	RedisStoreConfig,
} from "./types";

/**
 * Redis Store for Rate Limiting
 *
 * Wraps Redis operations with circuit breaker pattern.
 * Provides a clean interface for the rate limiter middleware.
 */
export class RateLimitStore {
	private redis: Redis | null = null;
	private limiter: SlidingWindowRateLimiter | null = null;
	private circuitBreaker: CircuitBreaker;
	private config: RedisStoreConfig;
	private isConnected = false;

	constructor(
		config: RedisStoreConfig,
		circuitBreakerConfig?: Partial<CircuitBreakerConfig>,
	) {
		this.config = config;
		this.circuitBreaker = new CircuitBreaker(circuitBreakerConfig);
	}

	/**
	 * Initialize Redis connection
	 */
	async connect(): Promise<void> {
		try {
			this.redis = new Redis({
				host: this.config.host,
				port: this.config.port,
				password: this.config.password,
				keyPrefix: this.config.keyPrefix,
				maxRetriesPerRequest: 1,
				lazyConnect: true,
				connectTimeout: 5000,
				retryStrategy(times: number) {
					if (times > 3) {
						return null; // Stop retrying
					}
					return Math.min(times * 200, 2000);
				},
			});

			await this.redis.connect();
			this.limiter = new SlidingWindowRateLimiter(
				this.redis,
				this.config.keyPrefix ?? "rate",
			);
			this.isConnected = true;
			console.log("[RateLimitStore] Connected to Redis");
		} catch (error) {
			console.error("[RateLimitStore] Failed to connect to Redis:", error);
			this.circuitBreaker.recordFailure();
			throw error;
		}
	}

	/**
	 * Check rate limit for a request
	 */
	async check(
		endpoint: string,
		identifier: string,
		limit: number,
		windowMs: number,
	): Promise<RateLimitResult> {
		// If circuit is open, allow all requests (fail-open)
		if (!this.circuitBreaker.isAllowed()) {
			console.log(
				"[RateLimitStore] Circuit open, allowing request without rate limiting",
			);
			return {
				allowed: true,
				limit,
				remaining: limit,
				resetAt: Math.ceil(Date.now() / 1000) + Math.ceil(windowMs / 1000),
				retryAfter: 0,
				currentCount: 0,
			};
		}

		// If no limiter (Redis not connected), allow request
		if (!this.limiter) {
			return {
				allowed: true,
				limit,
				remaining: limit,
				resetAt: Math.ceil(Date.now() / 1000) + Math.ceil(windowMs / 1000),
				retryAfter: 0,
				currentCount: 0,
			};
		}

		try {
			const result = await this.limiter.check(
				endpoint,
				identifier,
				limit,
				windowMs,
			);

			// Record success for circuit breaker
			this.circuitBreaker.recordSuccess();

			return result;
		} catch (error) {
			console.error("[RateLimitStore] Rate limit check failed:", error);
			this.circuitBreaker.recordFailure();

			// Fail-open: allow the request
			return {
				allowed: true,
				limit,
				remaining: limit,
				resetAt: Math.ceil(Date.now() / 1000) + Math.ceil(windowMs / 1000),
				retryAfter: 0,
				currentCount: 0,
			};
		}
	}

	/**
	 * Reset rate limit for a specific identifier
	 */
	async reset(endpoint: string, identifier: string): Promise<void> {
		if (this.limiter) {
			await this.limiter.reset(endpoint, identifier);
		}
	}

	/**
	 * Get current count for an identifier
	 */
	async getCount(endpoint: string, identifier: string): Promise<number> {
		if (!this.limiter) {
			return 0;
		}
		return this.limiter.getCount(endpoint, identifier);
	}

	/**
	 * Get circuit breaker statistics
	 */
	getCircuitStats() {
		return this.circuitBreaker.getStats();
	}

	/**
	 * Check if store is healthy (Redis connected and circuit closed)
	 */
	isHealthy(): boolean {
		return this.isConnected && this.circuitBreaker.isAllowed();
	}

	/**
	 * Close Redis connection
	 */
	async disconnect(): Promise<void> {
		if (this.redis) {
			await this.redis.quit();
			this.redis = null;
			this.limiter = null;
			this.isConnected = false;
			console.log("[RateLimitStore] Disconnected from Redis");
		}
	}
}

// Singleton instance
let storeInstance: RateLimitStore | null = null;

/**
 * Get or create the rate limit store singleton
 */
export function getRateLimitStore(config?: RedisStoreConfig): RateLimitStore {
	if (!storeInstance) {
		const storeConfig: RedisStoreConfig = config ?? {
			host: process.env.REDIS_HOST ?? "localhost",
			port: Number.parseInt(process.env.REDIS_PORT ?? "6379", 10),
			password: process.env.REDIS_PASSWORD,
			keyPrefix: "rate:",
		};
		storeInstance = new RateLimitStore(storeConfig);
	}
	return storeInstance;
}

/**
 * Initialize the rate limit store
 */
export async function initRateLimitStore(
	config?: RedisStoreConfig,
): Promise<RateLimitStore> {
	const store = getRateLimitStore(config);
	try {
		await store.connect();
	} catch {
		console.warn(
			"[RateLimitStore] Failed to initialize, rate limiting will be disabled",
		);
	}
	return store;
}
