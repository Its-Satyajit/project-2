import type { Context } from "elysia";

/**
 * Rate limit window duration - can be number (seconds) or string like "1h", "15m"
 */
export type WindowDuration = number | string;

/**
 * Parsed window duration in milliseconds
 */
export interface ParsedWindow {
	ms: number;
	seconds: number;
}

/**
 * Rate limit configuration for a single endpoint
 */
export interface RateLimitConfig {
	/** Maximum number of requests allowed in the window */
	limit: number;
	/** Time window (e.g., 3600 for 1 hour, or "1h", "15m") */
	window: WindowDuration;
	/** Custom key generator - defaults to hybrid IP/user identification */
	keyGenerator?: (context: Context) => string;
	/** Custom message when rate limited */
	message?: string;
	/** Skip rate limiting for certain requests */
	skip?: (context: Context) => boolean;
}

/**
 * Rate limit result from the store
 */
export interface RateLimitResult {
	/** Whether the request is allowed */
	allowed: boolean;
	/** Maximum requests allowed in window */
	limit: number;
	/** Remaining requests in current window */
	remaining: number;
	/** Unix timestamp when window resets (seconds) */
	resetAt: number;
	/** Seconds until window resets */
	retryAfter: number;
	/** Current request count in window */
	currentCount: number;
}

/**
 * Rate limit headers to be added to response
 */
export interface RateLimitHeaders {
	"X-RateLimit-Limit": string;
	"X-RateLimit-Remaining": string;
	"X-RateLimit-Reset": string;
	"Retry-After": string;
}

/**
 * Error response body for rate limited requests
 */
export interface RateLimitErrorBody {
	error: "RATE_LIMIT_EXCEEDED";
	message: string;
	limit: number;
	remaining: number;
	resetAt: string;
	retryAfter: number;
}

/**
 * Circuit breaker state
 */
export type CircuitBreakerState = "CLOSED" | "OPEN" | "HALF_OPEN";

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
	/** Number of failures before opening circuit */
	failureThreshold: number;
	/** Time window for counting failures (ms) */
	failureWindow: number;
	/** Time to wait before half-open (ms) */
	resetTimeout: number;
	/** Number of successful requests to close circuit */
	successThreshold: number;
}

/**
 * Default circuit breaker configuration
 */
export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
	failureThreshold: 3,
	failureWindow: 10000, // 10 seconds
	resetTimeout: 30000, // 30 seconds
	successThreshold: 1,
};

/**
 * Redis store configuration
 */
export interface RedisStoreConfig {
	host: string;
	port: number;
	password?: string;
	keyPrefix?: string;
}

/**
 * Rate limiter preset configurations
 */
export interface RateLimitPresets {
	strict: RateLimitConfig;
	normal: RateLimitConfig;
	relaxed: RateLimitConfig;
}

/**
 * Endpoint configuration map
 */
export type EndpointConfigMap = Record<string, RateLimitConfig>;

/**
 * Elysia context with user information (from Better Auth)
 */
export interface AuthenticatedContext extends Context {
	user?: {
		id: string;
		email: string;
	};
}
