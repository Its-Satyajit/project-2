import type { Elysia } from "elysia";
import { KeyGenerator } from "./key-generator";
import { getRateLimitStore } from "./store";
import type {
	RateLimitConfig,
	RateLimitErrorBody,
	RateLimitHeaders,
	WindowDuration,
} from "./types";

function parseWindow(window: WindowDuration): number {
	if (typeof window === "number") {
		return window * 1000;
	}

	const match = window.match(/^(\d+)(s|m|h|d)$/);
	if (!match?.[1] || !match[2]) {
		throw new Error(`Invalid window format: ${window}`);
	}

	const value = Number.parseInt(match[1], 10);
	const unit = match[2];

	const multipliers: Record<string, number> = {
		s: 1000,
		m: 60 * 1000,
		h: 60 * 60 * 1000,
		d: 24 * 60 * 60 * 1000,
	};

	return value * (multipliers[unit] ?? 1000);
}

function formatWindow(ms: number): string {
	if (ms >= 3600000) {
		return `${Math.round(ms / 3600000)} hour(s)`;
	}
	if (ms >= 60000) {
		return `${Math.round(ms / 60000)} minute(s)`;
	}
	return `${Math.round(ms / 1000)} second(s)`;
}

export function rateLimit(config: RateLimitConfig) {
	const { limit, window, keyGenerator, message, skip } = config;
	const windowMs = parseWindow(window);
	const windowDisplay = formatWindow(windowMs);

	return (app: Elysia) =>
		app.onBeforeHandle(async (context) => {
			if (skip?.(context)) {
				return;
			}

			const store = getRateLimitStore();

			const url = new URL(context.request.url);
			const endpoint = url.pathname.replace(/^\//, "") || "root";

			const identifier = keyGenerator
				? keyGenerator(context)
				: KeyGenerator.generate(context, endpoint);

			const result = await store.check(endpoint, identifier, limit, windowMs);

			// Debug logging
			console.log(
				`[RateLimit] ${endpoint} | id: ${identifier} | ` +
				`${result.currentCount}/${limit} | ` +
				`allowed: ${result.allowed} | remaining: ${result.remaining}`,
			);

			const headers: RateLimitHeaders = {
				"X-RateLimit-Limit": String(result.limit),
				"X-RateLimit-Remaining": String(result.remaining),
				"X-RateLimit-Reset": String(result.resetAt),
				"Retry-After": String(result.retryAfter),
			};

			// Set headers using context.set.headers
			const setHeaders = (
				context as unknown as { set: { headers: Record<string, string> } }
			).set?.headers;
			if (setHeaders) {
				for (const [key, value] of Object.entries(headers)) {
					setHeaders[key] = value;
				}
			}

			if (!result.allowed) {
				const resetDate = new Date(result.resetAt * 1000).toISOString();
				const errorBody: RateLimitErrorBody = {
					error: "RATE_LIMIT_EXCEEDED",
					message:
						message ??
						`Rate limit exceeded. Maximum ${limit} requests per ${windowDisplay}. Try again in ${result.retryAfter} seconds.`,
					limit: result.limit,
					remaining: result.remaining,
					resetAt: resetDate,
					retryAfter: result.retryAfter,
				};

				return new Response(JSON.stringify(errorBody), {
					status: 429,
					headers: {
						"Content-Type": "application/json",
						...headers,
					},
				});
			}
		});
}

export function createRateLimiter(defaults: Partial<RateLimitConfig> = {}) {
	const { limit = 60, window = "1m", keyGenerator, message, skip } = defaults;

	return {
		limit(config: Partial<RateLimitConfig> = {}) {
			return rateLimit({
				limit: config.limit ?? limit,
				window: config.window ?? window,
				keyGenerator: config.keyGenerator ?? keyGenerator,
				message: config.message ?? message,
				skip: config.skip ?? skip,
			});
		},
		strict: rateLimit({ limit: 5, window: "1h", ...defaults }),
		normal: rateLimit({ limit: 60, window: "1m", ...defaults }),
		relaxed: rateLimit({ limit: 1000, window: "1h", ...defaults }),
	};
}

export { CircuitBreaker } from "./circuit-breaker";
export { defaultKeyGenerator, KeyGenerator } from "./key-generator";
export { SlidingWindowRateLimiter } from "./sliding-window";
export { getRateLimitStore, initRateLimitStore } from "./store";
export type {
	CircuitBreakerConfig,
	CircuitBreakerState,
	RateLimitConfig,
	RateLimitErrorBody,
	RateLimitHeaders,
	RateLimitResult,
	WindowDuration,
} from "./types";
