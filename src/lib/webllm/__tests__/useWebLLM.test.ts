import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("useWebLLM", () => {
	beforeEach(() => {
		// Clear localStorage before each test
		vi.stubGlobal("localStorage", {
			getItem: vi.fn(() => null),
			setItem: vi.fn(),
			removeItem: vi.fn(),
			clear: vi.fn(),
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("initial state", () => {
		it("returns initial state before initialization", async () => {
			// Mock no WebGPU support
			vi.stubGlobal("navigator", {
				gpu: undefined,
				userAgent: "Test",
			});

			const { useWebLLM } = await import("../useWebLLM");
			const { result } = renderHook(() => useWebLLM());

			expect(result.current.state.isInitialized).toBe(false);
			expect(result.current.state.isLoading).toBe(false);
			expect(result.current.state.error).toBe(null);
			expect(result.current.canUseAI).toBe(false);
			expect(result.current.tier).toBe(null);
			expect(result.current.diagnostics).toBe(null);
		});
	});

	describe("initialize", () => {
		it("sets error when WebGPU is not supported", async () => {
			vi.stubGlobal("navigator", {
				gpu: undefined,
				userAgent: "Test",
			});

			const { useWebLLM } = await import("../useWebLLM");
			const { result } = renderHook(() => useWebLLM());

			await act(async () => {
				await result.current.initialize();
			});

			expect(result.current.state.error).toBeTruthy();
			expect(result.current.state.error).toContain(
				"navigator.gpu is not available",
			);
			expect(result.current.state.isInitialized).toBe(false);
			expect(result.current.diagnostics).toBeTruthy();
			expect(result.current.diagnostics?.hasGPU).toBe(false);
		});

		it("provides Firefox-specific instructions for Firefox users", async () => {
			vi.stubGlobal("navigator", {
				gpu: undefined,
				userAgent:
					"Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/120.0",
			});

			const { useWebLLM } = await import("../useWebLLM");
			const { result } = renderHook(() => useWebLLM());

			await act(async () => {
				await result.current.initialize();
			});

			expect(result.current.state.error).toContain("about:config");
			expect(result.current.state.error).toContain("dom.webgpu.enabled");
		});

		it("returns browser info in diagnostics", async () => {
			vi.stubGlobal("navigator", {
				gpu: undefined,
				userAgent:
					"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			});

			const { useWebLLM } = await import("../useWebLLM");
			const { result } = renderHook(() => useWebLLM());

			await act(async () => {
				await result.current.initialize();
			});

			expect(result.current.diagnostics?.browserInfo).toContain("Chrome");
		});
	});

	describe("canUseAI", () => {
		it("returns false when not initialized", async () => {
			vi.stubGlobal("navigator", {
				gpu: undefined,
				userAgent: "Test",
			});

			const { useWebLLM } = await import("../useWebLLM");
			const { result } = renderHook(() => useWebLLM());

			expect(result.current.canUseAI).toBe(false);
		});
	});

	describe("unload", () => {
		it("resets state after unload", async () => {
			vi.stubGlobal("navigator", {
				gpu: undefined,
				userAgent: "Test",
			});

			const { useWebLLM } = await import("../useWebLLM");
			const { result } = renderHook(() => useWebLLM());

			await act(async () => {
				await result.current.unload();
			});

			expect(result.current.state.isInitialized).toBe(false);
			expect(result.current.state.modelLoaded).toBe(null);
		});
	});

	describe("withRetry helper", () => {
		it("succeeds on first try without retrying", async () => {
			const { withRetry } = await import("../useWebLLM");

			const fn = vi.fn().mockResolvedValue("success");
			const result = await withRetry(fn, 3, 10);

			expect(result).toBe("success");
			expect(fn).toHaveBeenCalledTimes(1);
		});

		it("retries on failure and eventually succeeds", async () => {
			const { withRetry } = await import("../useWebLLM");

			const fn = vi
				.fn()
				.mockRejectedValueOnce(new Error("fail 1"))
				.mockRejectedValueOnce(new Error("fail 2"))
				.mockResolvedValueOnce("success");

			const result = await withRetry(fn, 3, 10);

			expect(result).toBe("success");
			expect(fn).toHaveBeenCalledTimes(3);
		});

		it("fails after max retries", async () => {
			const { withRetry } = await import("../useWebLLM");

			const fn = vi.fn().mockRejectedValue(new Error("always fail"));
			const onRetry = vi.fn();

			await expect(withRetry(fn, 3, 10, onRetry)).rejects.toThrow(
				"always fail",
			);

			expect(fn).toHaveBeenCalledTimes(3);
			expect(onRetry).toHaveBeenCalledTimes(2); // Called before retry 2 and 3
		});

		it("calls onRetry callback with attempt and error", async () => {
			const { withRetry } = await import("../useWebLLM");

			const fn = vi
				.fn()
				.mockRejectedValueOnce(new Error("network error"))
				.mockRejectedValueOnce(new Error("network error")); // Second failure
			const onRetry = vi.fn();

			await expect(withRetry(fn, 2, 10, onRetry)).rejects.toThrow();

			expect(onRetry).toHaveBeenCalledWith(1, "network error");
		});
	});

	describe("withTimeout helper", () => {
		it("resolves when promise completes within timeout", async () => {
			const { withTimeout } = await import("../useWebLLM");

			const promise = new Promise<string>((resolve) =>
				setTimeout(() => resolve("success"), 50),
			);
			const result = await withTimeout(promise, 1000);

			expect(result).toBe("success");
		});

		it("rejects when promise exceeds timeout", async () => {
			const { withTimeout } = await import("../useWebLLM");

			const promise = new Promise<string>((resolve) =>
				setTimeout(() => resolve("success"), 200),
			);

			await expect(withTimeout(promise, 50)).rejects.toThrow("timed out");
		});

		it("calls onTimeout callback when timeout occurs", async () => {
			const { withTimeout } = await import("../useWebLLM");

			const promise = new Promise<string>((resolve) =>
				setTimeout(() => resolve("success"), 200),
			);
			const onTimeout = vi.fn();

			await expect(withTimeout(promise, 50, onTimeout)).rejects.toThrow();

			expect(onTimeout).toHaveBeenCalled();
		});
	});
});
