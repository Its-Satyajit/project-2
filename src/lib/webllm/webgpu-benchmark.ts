/**
 * WebGPU Benchmark & Capability Detection
 * Determines optimal model tier based on browser GPU performance
 */

export type ModelTier = "tier-1" | "tier-2" | "tier-3" | "unsupported";

export interface BenchmarkResult {
	supported: boolean;
	tier: ModelTier;
	webgpuInfo: WebGPUInfo | null;
	benchmarkScore: number;
	recommendedModel: string;
	memoryEstimate: string;
	diagnosticInfo: DiagnosticInfo;
}

export interface WebGPUInfo {
	adapterType: string;
	maxBufferSize: number;
	maxTextureDimension2D: number;
	subgroupSize?: number;
}

export interface DiagnosticInfo {
	hasNavigator: boolean;
	hasGPU: boolean;
	requestAdapterSucceeded: boolean;
	adapterNotNull: boolean;
	errorMessage?: string;
	browserInfo: string;
}

interface GPUBenchmarkResult {
	score: number;
	computeTime: number;
	memoryBandwidth: number;
}

/**
 * Get browser information for debugging
 */
function getBrowserInfo(): string {
	if (typeof navigator === "undefined") return "Server/SSR";
	const ua = navigator.userAgent || "";
	if (!ua) return "Unknown (no user agent)";
	if (ua.includes("Firefox"))
		return `Firefox (${ua.match(/Firefox\/(\d+)/)?.[1] || "?"})`;
	if (ua.includes("Edg/"))
		return `Edge (${ua.match(/Edg\/(\d+)/)?.[1] || "?"})`;
	if (ua.includes("Chrome"))
		return `Chrome (${ua.match(/Chrome\/(\d+)/)?.[1] || "?"})`;
	if (ua.includes("Safari") && !ua.includes("Chrome"))
		return `Safari (${ua.match(/Version\/(\d+)/)?.[1] || "?"})`;
	return ua.substring(0, 100);
}

/**
 * Check if WebGPU is supported in this browser
 * Returns detailed diagnostic information for debugging
 */
export async function checkWebGPUSupport(): Promise<boolean> {
	const diag = await getWebGPUDiagnostics();
	return diag.supported;
}

/**
 * Promise wrapper with timeout
 */
function withTimeout<T>(
	promise: Promise<T>,
	timeoutMs: number,
	fallback: T,
): Promise<T> {
	return Promise.race([
		promise,
		new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs)),
	]);
}

/**
 * Get detailed WebGPU diagnostic information
 */
export async function getWebGPUDiagnostics(): Promise<{
	supported: boolean;
	diagnostics: DiagnosticInfo;
}> {
	const diagnostics: DiagnosticInfo = {
		hasNavigator: typeof navigator !== "undefined",
		hasGPU: false,
		requestAdapterSucceeded: false,
		adapterNotNull: false,
		browserInfo: getBrowserInfo(),
	};

	if (typeof navigator === "undefined") {
		diagnostics.errorMessage = "navigator is undefined (SSR environment)";
		return { supported: false, diagnostics };
	}

	// Check for gpu property - might be undefined or might throw
	try {
		diagnostics.hasGPU = !!navigator.gpu;
	} catch (e) {
		diagnostics.errorMessage = `Error accessing navigator.gpu: ${e instanceof Error ? e.message : String(e)}`;
		return { supported: false, diagnostics };
	}

	if (!navigator.gpu) {
		const isFirefox = diagnostics.browserInfo.includes("Firefox");
		if (isFirefox) {
			diagnostics.errorMessage =
				"navigator.gpu is not available.\n\nFor Firefox: Enable 'dom.webgpu.enabled' in about:config\n1. Type 'about:config' in address bar\n2. Search for 'dom.webgpu.enabled'\n3. Set to 'true'\n4. Restart Firefox";
		} else {
			diagnostics.errorMessage =
				"navigator.gpu is not available.\n\nTry:\n1. Enable hardware acceleration in browser settings\n2. Update your browser to the latest version\n3. Update GPU drivers";
		}
		return { supported: false, diagnostics };
	}

	// Try to request an adapter with timeout
	try {
		// Some browsers need specific power preference
		const adapterPromise = navigator.gpu.requestAdapter({
			powerPreference: "high-performance",
		});
		const adapter = await withTimeout(adapterPromise, 5000, null);
		diagnostics.requestAdapterSucceeded = true;
		diagnostics.adapterNotNull = adapter !== null;

		if (adapter === null) {
			// Try again without power preference
			try {
				const fallbackAdapter = await withTimeout(
					navigator.gpu.requestAdapter(),
					5000,
					null,
				);
				if (fallbackAdapter !== null) {
					return { supported: true, diagnostics };
				}
			} catch {
				// Ignore fallback errors
			}

			const isChrome = diagnostics.browserInfo.includes("Chrome");
			const isEdge = diagnostics.browserInfo.includes("Edge");

			if (isChrome || isEdge) {
				diagnostics.errorMessage = `WebGPU adapter not found in ${diagnostics.browserInfo}.

The browser has WebGPU support but cannot access your GPU.

Quick Fix:
1. Go to chrome://settings/system (or edge://settings/system)
2. Enable "Use graphics acceleration when available"
3. Restart the browser

Alternative - Enable override (if hardware acceleration doesn't work):
1. Go to chrome://flags/#enable-unsafe-webgpu
2. Set to "Enabled"
3. Restart browser

If using NVIDIA GPU:
1. Open NVIDIA Control Panel
2. Go to "Manage 3D Settings"
3. Set "Preferred graphics processor" to "High-performance NVIDIA processor"

Alternative browsers with good WebGPU support:
- Chrome Dev/Canary channel
- Microsoft Edge (latest)
- Arc browser`;
			} else {
				diagnostics.errorMessage =
					"WebGPU adapter not found.\n\nPossible causes:\n1. GPU hardware acceleration is disabled\n2. GPU driver doesn't support WebGPU\n3. GPU is in a power-saving mode\n\nTry enabling hardware acceleration in browser settings.";
			}
			return { supported: false, diagnostics };
		}

		// Adapter found successfully
		return { supported: true, diagnostics };
	} catch (e) {
		diagnostics.errorMessage = `requestAdapter() error: ${e instanceof Error ? e.message : String(e)}\n\nThis may indicate:\n1. GPU process crashed or was blocked\n2. Browser security policy blocking WebGPU\n3. GPU driver incompatibility`;
		return { supported: false, diagnostics };
	}
}

/**
 * Get WebGPU adapter information
 */
export async function getWebGPUInfo(): Promise<WebGPUInfo | null> {
	if (typeof navigator === "undefined" || !navigator.gpu) return null;

	try {
		const adapter = await navigator.gpu.requestAdapter();
		if (!adapter) return null;

		const info = adapter.info;
		const features = adapter.features;

		return {
			adapterType: (info as any)?.architecture ?? "unknown",
			maxBufferSize: adapter.limits.maxBufferSize,
			maxTextureDimension2D: adapter.limits.maxTextureDimension2D,
			subgroupSize: features?.has("subgroups")
				? (adapter.limits as any).minSubgroupSize
				: undefined,
		};
	} catch {
		return null;
	}
}

/**
 * Run GPU compute benchmark to estimate performance
 * Uses matrix multiplication which mimics LLM inference workload
 */
export async function runGPUBenchmark(): Promise<GPUBenchmarkResult> {
	if (typeof navigator === "undefined" || !navigator.gpu) {
		return { score: 0, computeTime: Infinity, memoryBandwidth: 0 };
	}

	const adapter = await navigator.gpu.requestAdapter();
	if (!adapter) {
		return { score: 0, computeTime: Infinity, memoryBandwidth: 0 };
	}

	const device = await adapter.requestDevice();

	// Matrix multiply shader - simulates transformer compute pattern
	const shaderCode = `
		@group(0) @binding(0) var<storage, read> input: array<f32>;
		@group(0) @binding(1) var<storage, read> weights: array<f32>;
		@group(0) @binding(2) var<storage, read_write> output: array<f32>;

		@compute @workgroup_size(8, 8)
		fn main(@builtin(global_invocation_id) id: vec3u) {
			let dim = 64u;
			let row = id.x;
			let col = id.y;

			if (row >= dim || col >= dim) {
				return;
			}

			var sum = 0.0;
			for (var k = 0u; k < dim; k++) {
				sum += input[row * dim + k] * weights[k * dim + col];
			}
			output[row * dim + col] = sum;
		}
	`;

	const module = device.createShaderModule({ code: shaderCode });
	const pipeline = device.createComputePipeline({
		layout: "auto",
		compute: { module, entryPoint: "main" },
	});

	const dim = 64;
	const dataSize = dim * dim * 4; // f32 = 4 bytes

	// GPUBufferUsage constants: STORAGE = 128, COPY_DST = 4, COPY_SRC = 1
	const GPU_STORAGE = 128;
	const GPU_COPY_DST = 4;
	const GPU_COPY_SRC = 1;

	const inputBuffer = device.createBuffer({
		size: dataSize,
		usage: GPU_STORAGE | GPU_COPY_DST,
	});
	const weightsBuffer = device.createBuffer({
		size: dataSize,
		usage: GPU_STORAGE | GPU_COPY_DST,
	});
	const outputBuffer = device.createBuffer({
		size: dataSize,
		usage: GPU_STORAGE | GPU_COPY_SRC,
	});

	const bindGroup = device.createBindGroup({
		layout: pipeline.getBindGroupLayout(0),
		entries: [
			{ binding: 0, resource: { buffer: inputBuffer } },
			{ binding: 1, resource: { buffer: weightsBuffer } },
			{ binding: 2, resource: { buffer: outputBuffer } },
		],
	});

	const commandEncoder = device.createCommandEncoder();
	const passEncoder = commandEncoder.beginComputePass();
	passEncoder.setPipeline(pipeline);
	passEncoder.setBindGroup(0, bindGroup);

	// Run multiple iterations for accurate benchmark
	const iterations = 100;
	const startTime = performance.now();

	for (let i = 0; i < iterations; i++) {
		passEncoder.dispatchWorkgroups(dim / 8, dim / 8);
	}

	passEncoder.end();
	device.queue.submit([commandEncoder.finish()]);

	// Wait for GPU to complete
	await device.queue.onSubmittedWorkDone();
	const endTime = performance.now();

	const computeTime = (endTime - startTime) / iterations;
	const memoryBandwidth =
		(dataSize * 3 * iterations) / ((endTime - startTime) / 1000);

	// Score: higher is better (normalized to ~0-1000)
	const score = Math.round(1000 / computeTime);

	device.destroy();

	return { score, computeTime, memoryBandwidth };
}

/**
 * Determine model tier based on benchmark results
 * Conservative thresholds to prevent GPU memory issues
 */
function determineTier(
	benchmarkScore: number,
	webgpuInfo: WebGPUInfo | null,
): ModelTier {
	if (benchmarkScore === 0) return "unsupported";

	// Check memory constraints
	const maxBufferMB = (webgpuInfo?.maxBufferSize ?? 0) / (1024 * 1024);

	if (maxBufferMB < 512) {
		return "unsupported"; // Too limited for any LLM
	}

	// Conservative thresholds - prefer stability over capability
	// Tier 3: Smallest models (360M-1B) - most compatible
	if (benchmarkScore > 20 || maxBufferMB > 500) {
		return "tier-3";
	}

	return "unsupported";
}

/**
 * Get recommended model based on benchmark score
 * Conservative selection - prefer smaller, faster models
 * Models must match WebLLM's prebuiltAppConfig model_list exactly
 */
function getRecommendedModel(
	tier: ModelTier,
	benchmarkScore?: number,
): {
	model: string;
	memory: string;
} {
	// Always default to smallest working model for stability
	// User can manually select larger models if needed
	const conservativeModels: Record<
		ModelTier,
		{ model: string; memory: string }
	> = {
		"tier-1": { model: "Llama-3.2-1B-Instruct-q4f16_1-MLC", memory: "~879 MB" },
		"tier-2": { model: "SmolLM2-360M-Instruct-q4f16_1-MLC", memory: "~376 MB" },
		"tier-3": { model: "SmolLM2-360M-Instruct-q4f16_1-MLC", memory: "~376 MB" },
		unsupported: { model: "", memory: "" },
	};

	return conservativeModels[tier] || { model: "", memory: "" };
}

/**
 * Run full benchmark suite and return results
 * Results are cached in localStorage for subsequent loads
 */
export async function runFullBenchmark(): Promise<BenchmarkResult> {
	// Check cache (valid for 7 days)
	const cached = localStorage.getItem("webgpu-benchmark");
	if (cached) {
		try {
			const parsed = JSON.parse(cached);
			const cacheAge = Date.now() - parsed.timestamp;
			if (cacheAge < 7 * 24 * 60 * 60 * 1000) {
				return parsed.result;
			}
		} catch {
			// Invalid cache, continue with fresh benchmark
		}
	}

	const { supported, diagnostics } = await getWebGPUDiagnostics();
	if (!supported) {
		const result: BenchmarkResult = {
			supported: false,
			tier: "unsupported",
			webgpuInfo: null,
			benchmarkScore: 0,
			recommendedModel: "",
			memoryEstimate: "",
			diagnosticInfo: diagnostics,
		};
		return result;
	}

	const webgpuInfo = await getWebGPUInfo();
	const benchmark = await runGPUBenchmark();
	const tier = determineTier(benchmark.score, webgpuInfo);
	const { model, memory } = getRecommendedModel(tier);

	const result: BenchmarkResult = {
		supported: true,
		tier,
		webgpuInfo,
		benchmarkScore: benchmark.score,
		recommendedModel: model,
		memoryEstimate: memory,
		diagnosticInfo: diagnostics,
	};

	// Cache results
	localStorage.setItem(
		"webgpu-benchmark",
		JSON.stringify({ result, timestamp: Date.now() }),
	);

	return result;
}

/**
 * Human-readable tier description
 */
export function getTierDescription(tier: ModelTier): string {
	switch (tier) {
		case "tier-1":
			return "Excellent GPU - Full AI features available";
		case "tier-2":
			return "Good GPU - AI features available with lighter model";
		case "tier-3":
			return "Basic GPU - Limited AI features";
		case "unsupported":
			return "WebGPU not supported or insufficient";
	}
}
