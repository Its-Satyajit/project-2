import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CircuitBreaker } from "../circuit-breaker";

describe("CircuitBreaker", () => {
	let circuitBreaker: CircuitBreaker;

	beforeEach(() => {
		vi.useFakeTimers();
		circuitBreaker = new CircuitBreaker({
			failureThreshold: 3,
			failureWindow: 10000,
			resetTimeout: 30000,
			successThreshold: 1,
		});
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("initial state", () => {
		it("should start in CLOSED state", () => {
			expect(circuitBreaker.getState()).toBe("CLOSED");
		});

		it("should allow requests in CLOSED state", () => {
			expect(circuitBreaker.isAllowed()).toBe(true);
		});
	});

	describe("CLOSED to OPEN transition", () => {
		it("should transition to OPEN after failure threshold", () => {
			circuitBreaker.recordFailure();
			circuitBreaker.recordFailure();
			expect(circuitBreaker.getState()).toBe("CLOSED");

			circuitBreaker.recordFailure();
			expect(circuitBreaker.getState()).toBe("OPEN");
		});

		it("should deny requests in OPEN state", () => {
			circuitBreaker.recordFailure();
			circuitBreaker.recordFailure();
			circuitBreaker.recordFailure();

			expect(circuitBreaker.isAllowed()).toBe(false);
		});

		it("should reset failure count after failure window expires", () => {
			circuitBreaker.recordFailure();
			circuitBreaker.recordFailure();

			// Advance time past the failure window
			vi.advanceTimersByTime(11000);

			circuitBreaker.recordFailure();
			// Should still be CLOSED because old failures expired
			expect(circuitBreaker.getState()).toBe("CLOSED");
		});
	});

	describe("OPEN to HALF_OPEN transition", () => {
		it("should transition to HALF_OPEN after reset timeout", () => {
			// Trigger OPEN state
			circuitBreaker.recordFailure();
			circuitBreaker.recordFailure();
			circuitBreaker.recordFailure();
			expect(circuitBreaker.getState()).toBe("OPEN");

			// Advance time past reset timeout
			vi.advanceTimersByTime(31000);

			expect(circuitBreaker.getState()).toBe("HALF_OPEN");
		});
	});

	describe("HALF_OPEN transitions", () => {
		it("should transition to CLOSED on success", () => {
			// Get to OPEN state
			circuitBreaker.recordFailure();
			circuitBreaker.recordFailure();
			circuitBreaker.recordFailure();

			// Get to HALF_OPEN state
			vi.advanceTimersByTime(31000);
			expect(circuitBreaker.getState()).toBe("HALF_OPEN");

			// Record success
			circuitBreaker.recordSuccess();
			expect(circuitBreaker.getState()).toBe("CLOSED");
		});

		it("should transition back to OPEN on failure", () => {
			// Get to OPEN state
			circuitBreaker.recordFailure();
			circuitBreaker.recordFailure();
			circuitBreaker.recordFailure();

			// Get to HALF_OPEN state
			vi.advanceTimersByTime(31000);
			expect(circuitBreaker.getState()).toBe("HALF_OPEN");

			// Record failure
			circuitBreaker.recordFailure();
			expect(circuitBreaker.getState()).toBe("OPEN");
		});
	});

	describe("reset", () => {
		it("should reset to CLOSED state", () => {
			// Get to OPEN state
			circuitBreaker.recordFailure();
			circuitBreaker.recordFailure();
			circuitBreaker.recordFailure();
			expect(circuitBreaker.getState()).toBe("OPEN");

			// Reset
			circuitBreaker.reset();
			expect(circuitBreaker.getState()).toBe("CLOSED");
			expect(circuitBreaker.isAllowed()).toBe(true);
		});
	});

	describe("getStats", () => {
		it("should return current statistics", () => {
			circuitBreaker.recordFailure();

			const stats = circuitBreaker.getStats();
			expect(stats.state).toBe("CLOSED");
			expect(stats.failureCount).toBe(1);
			expect(stats.successCount).toBe(0);
		});
	});
});
