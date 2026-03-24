import type { CircuitBreakerConfig, CircuitBreakerState } from "./types";
import { DEFAULT_CIRCUIT_BREAKER_CONFIG } from "./types";

/**
 * Circuit Breaker for Redis operations
 *
 * States:
 * - CLOSED: Normal operation, rate limiting active
 * - OPEN: Redis unavailable, allow all requests (fail-open)
 * - HALF_OPEN: Testing if Redis recovered
 *
 * Transitions:
 * CLOSED → OPEN: After N failures within time window
 * OPEN → HALF_OPEN: After reset timeout
 * HALF_OPEN → CLOSED: After successful request
 * HALF_OPEN → OPEN: After failed request
 */
export class CircuitBreaker {
	private state: CircuitBreakerState = "CLOSED";
	private failureCount = 0;
	private failureTimestamps: number[] = [];
	private lastFailureTime = 0;
	private successCount = 0;
	private config: CircuitBreakerConfig;

	constructor(config: Partial<CircuitBreakerConfig> = {}) {
		this.config = { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, ...config };
	}

	/**
	 * Get current circuit state
	 */
	getState(): CircuitBreakerState {
		// Check if we should transition from OPEN to HALF_OPEN
		if (this.state === "OPEN") {
			const timeSinceFailure = Date.now() - this.lastFailureTime;
			if (timeSinceFailure >= this.config.resetTimeout) {
				this.state = "HALF_OPEN";
				this.successCount = 0;
				console.log("[CircuitBreaker] Transitioning to HALF_OPEN");
			}
		}
		return this.state;
	}

	/**
	 * Check if requests should be allowed (circuit is CLOSED or HALF_OPEN)
	 */
	isAllowed(): boolean {
		const currentState = this.getState();
		return currentState === "CLOSED" || currentState === "HALF_OPEN";
	}

	/**
	 * Record a successful operation
	 * Called when Redis responds successfully
	 */
	recordSuccess(): void {
		if (this.state === "HALF_OPEN") {
			this.successCount++;
			if (this.successCount >= this.config.successThreshold) {
				this.reset();
				console.log("[CircuitBreaker] Transitioning to CLOSED");
			}
		}
		// Reset failure count on success in CLOSED state
		if (this.state === "CLOSED") {
			this.failureCount = 0;
			this.failureTimestamps = [];
		}
	}

	/**
	 * Record a failed operation
	 * Called when Redis operation fails
	 */
	recordFailure(): void {
		const now = Date.now();
		this.lastFailureTime = now;

		if (this.state === "HALF_OPEN") {
			// Any failure in HALF_OPEN opens the circuit
			this.state = "OPEN";
			console.log("[CircuitBreaker] Transitioning to OPEN from HALF_OPEN");
			return;
		}

		// In CLOSED state, track failures
		if (this.state === "CLOSED") {
			// Clean old failure timestamps
			this.failureTimestamps = this.failureTimestamps.filter(
				(ts) => now - ts < this.config.failureWindow,
			);

			// Add new failure
			this.failureTimestamps.push(now);
			this.failureCount = this.failureTimestamps.length;

			// Check if we should open the circuit
			if (this.failureCount >= this.config.failureThreshold) {
				this.state = "OPEN";
				console.log(
					`[CircuitBreaker] Transitioning to OPEN after ${this.failureCount} failures`,
				);
			}
		}
	}

	/**
	 * Reset circuit to CLOSED state
	 */
	reset(): void {
		this.state = "CLOSED";
		this.failureCount = 0;
		this.failureTimestamps = [];
		this.successCount = 0;
		this.lastFailureTime = 0;
	}

	/**
	 * Get circuit breaker statistics
	 */
	getStats(): {
		state: CircuitBreakerState;
		failureCount: number;
		successCount: number;
		lastFailureTime: number;
		config: CircuitBreakerConfig;
	} {
		return {
			state: this.getState(),
			failureCount: this.failureCount,
			successCount: this.successCount,
			lastFailureTime: this.lastFailureTime,
			config: this.config,
		};
	}

	/**
	 * Force a specific state (for testing)
	 */
	forceState(state: CircuitBreakerState): void {
		this.state = state;
	}
}
