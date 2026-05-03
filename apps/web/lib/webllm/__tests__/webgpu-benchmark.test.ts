import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// We need to test the internal functions, so we'll import the module
// and test the exported functions that use them

describe("webgpu-benchmark", () => {
	describe("determineTier (via runFullBenchmark behavior)", () => {
		it("returns unsupported when benchmark score is 0", async () => {
			// Mock navigator.gpu to be undefined
			const originalNavigator = globalThis.navigator;
			Object.defineProperty(globalThis, "navigator", {
				value: { gpu: undefined },
				writable: true,
				configurable: true,
			});

			const { runFullBenchmark } = await import("../webgpu-benchmark");
			const result = await runFullBenchmark();

			expect(result.supported).toBe(false);
			expect(result.tier).toBe("unsupported");
			expect(result.benchmarkScore).toBe(0);

			// Restore
			Object.defineProperty(globalThis, "navigator", {
				value: originalNavigator,
				writable: true,
				configurable: true,
			});
		});
	});

	describe("getBrowserInfo", () => {
		it("detects Chrome browser", async () => {
			const { getWebGPUDiagnostics } = await import("../webgpu-benchmark");

			// Mock navigator with Chrome user agent
			const originalNavigator = globalThis.navigator;
			Object.defineProperty(globalThis, "navigator", {
				value: {
					gpu: undefined,
					userAgent:
						"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
				},
				writable: true,
				configurable: true,
			});

			const { diagnostics } = await getWebGPUDiagnostics();
			expect(diagnostics.browserInfo).toContain("Chrome");
			expect(diagnostics.browserInfo).toContain("120");

			Object.defineProperty(globalThis, "navigator", {
				value: originalNavigator,
				writable: true,
				configurable: true,
			});
		});

		it("detects Firefox browser", async () => {
			const { getWebGPUDiagnostics } = await import("../webgpu-benchmark");

			const originalNavigator = globalThis.navigator;
			Object.defineProperty(globalThis, "navigator", {
				value: {
					gpu: undefined,
					userAgent:
						"Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0",
				},
				writable: true,
				configurable: true,
			});

			const { diagnostics } = await getWebGPUDiagnostics();
			expect(diagnostics.browserInfo).toContain("Firefox");
			expect(diagnostics.browserInfo).toContain("115");

			Object.defineProperty(globalThis, "navigator", {
				value: originalNavigator,
				writable: true,
				configurable: true,
			});
		});

		it("detects Edge browser", async () => {
			const { getWebGPUDiagnostics } = await import("../webgpu-benchmark");

			const originalNavigator = globalThis.navigator;
			Object.defineProperty(globalThis, "navigator", {
				value: {
					gpu: undefined,
					userAgent:
						"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
				},
				writable: true,
				configurable: true,
			});

			const { diagnostics } = await getWebGPUDiagnostics();
			expect(diagnostics.browserInfo).toContain("Edge");

			Object.defineProperty(globalThis, "navigator", {
				value: originalNavigator,
				writable: true,
				configurable: true,
			});
		});
	});

	describe("getWebGPUDiagnostics", () => {
		it("returns hasGPU: false when navigator.gpu is undefined", async () => {
			const { getWebGPUDiagnostics } = await import("../webgpu-benchmark");

			const originalNavigator = globalThis.navigator;
			Object.defineProperty(globalThis, "navigator", {
				value: { gpu: undefined, userAgent: "Test" },
				writable: true,
				configurable: true,
			});

			const { supported, diagnostics } = await getWebGPUDiagnostics();

			expect(supported).toBe(false);
			expect(diagnostics.hasGPU).toBe(false);
			expect(diagnostics.hasNavigator).toBe(true);
			expect(diagnostics.errorMessage).toContain(
				"navigator.gpu is not available",
			);

			Object.defineProperty(globalThis, "navigator", {
				value: originalNavigator,
				writable: true,
				configurable: true,
			});
		});

		it("returns Firefox-specific instructions when Firefox lacks WebGPU", async () => {
			const { getWebGPUDiagnostics } = await import("../webgpu-benchmark");

			const originalNavigator = globalThis.navigator;
			Object.defineProperty(globalThis, "navigator", {
				value: {
					gpu: undefined,
					userAgent:
						"Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0",
				},
				writable: true,
				configurable: true,
			});

			const { diagnostics } = await getWebGPUDiagnostics();

			expect(diagnostics.errorMessage).toContain("about:config");
			expect(diagnostics.errorMessage).toContain("dom.webgpu.enabled");

			Object.defineProperty(globalThis, "navigator", {
				value: originalNavigator,
				writable: true,
				configurable: true,
			});
		});

		it("returns adapter error info when requestAdapter fails", async () => {
			const { getWebGPUDiagnostics } = await import("../webgpu-benchmark");

			const originalNavigator = globalThis.navigator;
			Object.defineProperty(globalThis, "navigator", {
				value: {
					gpu: {
						requestAdapter: vi
							.fn()
							.mockRejectedValue(new Error("GPU process lost")),
					},
					userAgent: "Mozilla/5.0 (X11; Linux x86_64) Chrome/120.0.0.0",
				},
				writable: true,
				configurable: true,
			});

			const { supported, diagnostics } = await getWebGPUDiagnostics();

			expect(supported).toBe(false);
			expect(diagnostics.requestAdapterSucceeded).toBe(false);
			expect(diagnostics.errorMessage).toContain("GPU process lost");

			Object.defineProperty(globalThis, "navigator", {
				value: originalNavigator,
				writable: true,
				configurable: true,
			});
		});

		it("returns success when adapter is available", async () => {
			const { getWebGPUDiagnostics } = await import("../webgpu-benchmark");

			const mockAdapter = {
				info: { architecture: "discrete" },
				limits: {
					maxBufferSize: 256 * 1024 * 1024,
					maxTextureDimension2D: 16384,
				},
				features: new Set(),
			};

			const originalNavigator = globalThis.navigator;
			Object.defineProperty(globalThis, "navigator", {
				value: {
					gpu: {
						requestAdapter: vi.fn().mockResolvedValue(mockAdapter),
					},
					userAgent: "Mozilla/5.0 (X11; Linux x86_64) Chrome/120.0.0.0",
				},
				writable: true,
				configurable: true,
			});

			const { supported, diagnostics } = await getWebGPUDiagnostics();

			expect(supported).toBe(true);
			expect(diagnostics.hasGPU).toBe(true);
			expect(diagnostics.requestAdapterSucceeded).toBe(true);
			expect(diagnostics.adapterNotNull).toBe(true);

			Object.defineProperty(globalThis, "navigator", {
				value: originalNavigator,
				writable: true,
				configurable: true,
			});
		});
	});

	describe("checkWebGPUSupport", () => {
		it("returns false when WebGPU is not available", async () => {
			const { checkWebGPUSupport } = await import("../webgpu-benchmark");

			const originalNavigator = globalThis.navigator;
			Object.defineProperty(globalThis, "navigator", {
				value: { gpu: undefined, userAgent: "Test" },
				writable: true,
				configurable: true,
			});

			const result = await checkWebGPUSupport();
			expect(result).toBe(false);

			Object.defineProperty(globalThis, "navigator", {
				value: originalNavigator,
				writable: true,
				configurable: true,
			});
		});

		it("returns true when WebGPU adapter is available", async () => {
			const { checkWebGPUSupport } = await import("../webgpu-benchmark");

			const mockAdapter = {
				info: { architecture: "discrete" },
				limits: {
					maxBufferSize: 256 * 1024 * 1024,
					maxTextureDimension2D: 16384,
				},
				features: new Set(),
			};

			const originalNavigator = globalThis.navigator;
			Object.defineProperty(globalThis, "navigator", {
				value: {
					gpu: {
						requestAdapter: vi.fn().mockResolvedValue(mockAdapter),
					},
					userAgent: "Test",
				},
				writable: true,
				configurable: true,
			});

			const result = await checkWebGPUSupport();
			expect(result).toBe(true);

			Object.defineProperty(globalThis, "navigator", {
				value: originalNavigator,
				writable: true,
				configurable: true,
			});
		});
	});
});
