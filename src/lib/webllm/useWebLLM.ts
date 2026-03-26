"use client";

/**
 * WebLLM React Hook
 * Provides in-browser LLM inference with WebGPU acceleration
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
	type BenchmarkResult,
	type ModelTier,
	runFullBenchmark,
} from "./webgpu-benchmark";

// WebLLM types - dynamic import to avoid SSR issues
type MLCEngine = any;
type ChatCompletionMessage = any;

export interface WebLLMState {
	isInitialized: boolean;
	isLoading: boolean;
	isGenerating: boolean;
	error: string | null;
	progress: number;
	progressMessage: string;
	benchmark: BenchmarkResult | null;
	modelLoaded: string | null;
}

// Available models - dynamically built from WebLLM's prebuiltAppConfig
// We fetch this at runtime so it stays in sync with the installed @mlc-ai/web-llm version
export interface ModelInfo {
	name: string;
	size: string;
	tier: ModelTier;
	vram: number;
}

export const AVAILABLE_MODELS: Record<string, ModelInfo> = {};

// Populate models from WebLLM's built-in config
export async function loadAvailableModels(): Promise<
	Record<string, ModelInfo>
> {
	const webllm = await import("@mlc-ai/web-llm");
	const config = webllm.prebuiltAppConfig;

	for (const record of config.model_list) {
		const vram = record.vram_required_MB ?? 0;
		const tier: ModelTier =
			vram < 1000 ? "tier-3" : vram < 2500 ? "tier-2" : "tier-1";

		AVAILABLE_MODELS[record.model_id] = {
			name: formatModelName(record.model_id),
			size: `~${Math.round((vram / 1024) * 10) / 10} GB`,
			tier,
			vram,
		};
	}

	return AVAILABLE_MODELS;
}

// Convert model_id to friendly name
function formatModelName(modelId: string): string {
	return modelId
		.replace(/-q[04]f\d+(_\d)?-MLC.*/, "") // Remove quantization suffix
		.replace(/-MLC$/, "") // Remove trailing MLC
		.replace(/-/g, " ") // Replace hyphens with spaces
		.replace(/\b\w/g, (c) => c.toUpperCase()); // Capitalize
}

// Model name is a string that matches WebLLM's model_id format
export type ModelName = string;

export interface UseWebLLMOptions {
	autoInit?: boolean;
	model?: ModelName; // Allow manual model selection
	onProgress?: (progress: number, message: string) => void;
	onError?: (error: string) => void;
}

export interface UseWebLLMReturn {
	// State
	state: WebLLMState;

	// Actions
	initialize: () => Promise<void>;
	unload: () => Promise<void>;
	generate: (prompt: string, context?: string) => Promise<string>;
	streamGenerate: (
		prompt: string,
		context?: string,
		onChunk?: (chunk: string) => void,
	) => Promise<string>;
	explainCode: (code: string, language: string) => Promise<string>;
	explainHotspot: (
		filePath: string,
		metrics: { fanIn: number; fanOut: number; loc: number; score: number },
	) => Promise<string>;
	analyzeDependency: (
		sourceFile: string,
		targetFile: string,
		relationship: string,
	) => Promise<string>;

	// Utilities
	canUseAI: boolean;
	tier: ModelTier | null;
	diagnostics: BenchmarkResult["diagnosticInfo"] | null;

	// Model management
	availableModels: typeof AVAILABLE_MODELS;
	reloadWithModel: (model: ModelName) => Promise<void>;
	abort: () => void; // Force abort and cleanup
}

// Retry helper with exponential backoff for model downloads
export async function withRetry<T>(
	fn: () => Promise<T>,
	maxRetries: number = 3,
	baseDelayMs: number = 2000,
	onRetry?: (attempt: number, error: string) => void,
): Promise<T> {
	let lastError: Error | null = null;

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			return await fn();
		} catch (err) {
			lastError = err instanceof Error ? err : new Error(String(err));

			if (attempt < maxRetries) {
				const delay = baseDelayMs * 2 ** (attempt - 1);
				onRetry?.(attempt, lastError.message);
				await new Promise((r) => setTimeout(r, delay));
			}
		}
	}

	throw lastError;
}

// Timeout wrapper that cancels after specified milliseconds
export function withTimeout<T>(
	promise: Promise<T>,
	timeoutMs: number,
	onTimeout?: () => void,
): Promise<T> {
	return Promise.race([
		promise,
		new Promise<never>((_, reject) =>
			setTimeout(() => {
				onTimeout?.();
				reject(new Error(`Operation timed out after ${timeoutMs}ms`));
			}, timeoutMs),
		),
	]);
}

// System prompts for different analysis types
const SYSTEM_PROMPTS = {
	codeExpert: `You are a senior software engineer analyzing code. Be concise, technical, and actionable. 
Focus on:
- Code purpose and functionality
- Potential issues or improvements
- Patterns and anti-patterns
Keep responses under 150 words unless more detail is requested.`,

	hotspotAnalyzer: `You are a code architecture expert analyzing repository hotspots. Be specific about:
- Why a file might be a hotspot (complexity, dependencies, churn)
- What the high fan-in/fan-out means
- Concrete refactoring suggestions
Keep responses under 100 words.`,

	dependencyAnalyst: `You are a software architect explaining file relationships. Focus on:
- Why files depend on each other
- Architecture implications
- Coupling concerns
Keep responses under 80 words.`,
};

export function useWebLLM(options: UseWebLLMOptions = {}): UseWebLLMReturn {
	const {
		autoInit = false,
		model: initialModel,
		onProgress,
		onError,
	} = options;

	const engineRef = useRef<MLCEngine | null>(null);
	const workerRef = useRef<Worker | null>(null);
	const selectedModelRef = useRef<ModelName | null>(initialModel || null);
	const lastInitIdRef = useRef<number>(0);
	const abortRef = useRef<boolean>(false);

	const [state, setState] = useState<WebLLMState>({
		isInitialized: false,
		isLoading: false,
		isGenerating: false,
		error: null,
		progress: 0,
		progressMessage: "",
		benchmark: null,
		modelLoaded: null,
	});

	const [modelsLoaded, setModelsLoaded] = useState(false);

	// Update state helper
	const updateState = useCallback((partial: Partial<WebLLMState>) => {
		setState((prev) => ({ ...prev, ...partial }));
	}, []);

	// Load available models on mount
	useEffect(() => {
		loadAvailableModels().then(() => setModelsLoaded(true));
	}, []);

	// Initialize WebLLM
	const initialize = useCallback(async () => {
		if (state.isInitialized || state.isLoading) return;

		// Reset abort flag
		abortRef.current = false;

		// Track if this initialization was cancelled
		const initId = Date.now();
		lastInitIdRef.current = initId;
		let lastProgress = 0;
		let stuckTime = 0;

		updateState({ isLoading: true, error: null, progress: 0 });

		try {
			// Step 1: Run benchmark
			updateState({
				progress: 10,
				progressMessage: "Checking GPU capabilities...",
			});
			const benchmark = await runFullBenchmark();
			updateState({ benchmark });

			if (!benchmark.supported || benchmark.tier === "unsupported") {
				const diag = benchmark.diagnosticInfo;
				let message = "WebGPU is not supported in this browser.";
				message += `\n\nBrowser: ${diag.browserInfo}`;
				message += `\nHas navigator.gpu: ${diag.hasGPU ? "Yes" : "No"}`;

				if (diag.errorMessage) {
					message += `\n\nDetails: ${diag.errorMessage}`;
				}

				message +=
					"\n\nFor Firefox: Enable 'dom.webgpu.enabled' in about:config";
				message +=
					"\nFor Chrome/Edge: Ensure hardware acceleration is enabled in settings";
				throw new Error(message);
			}

			// Step 2: Dynamically import WebLLM
			updateState({
				progress: 20,
				progressMessage: "Loading AI engine...",
			});
			const webllm = await import("@mlc-ai/web-llm");

			// Step 3: Create engine with progress callback
			updateState({
				progress: 30,
				progressMessage: "Initializing model engine...",
			});

			const initProgressCallback = (progress: any) => {
				// Skip if this initialization was superseded
				if (initId !== lastInitIdRef.current) return;

				if (progress.progress !== undefined) {
					const percent = Math.round(progress.progress * 100);

					// Detect if stuck (no progress for 30 seconds)
					if (percent > lastProgress) {
						lastProgress = percent;
						stuckTime = 0;
					} else {
						stuckTime += 1;
					}

					updateState({
						progress: 30 + percent * 0.6, // 30-90%
						progressMessage:
							progress.text ||
							`Loading model weights... ${percent}%` ||
							"Loading model weights...",
					});
				}

				// Show stuck warning if no progress for 30 ticks (~30 seconds)
				if (stuckTime > 30) {
					updateState({
						progressMessage: `Download at ${lastProgress}%. Compiling may be slow.`,
					});
				}
			};

			// Use selected model or fallback to recommended
			const modelToLoad =
				selectedModelRef.current || benchmark.recommendedModel;
			updateState({
				progressMessage: `Loading ${AVAILABLE_MODELS[modelToLoad as ModelName]?.name || modelToLoad}...`,
			});

			// Create engine with timeout (5 minutes max for initialization)
			const engine = await withTimeout(
				webllm.CreateMLCEngine(modelToLoad, {
					initProgressCallback,
				}),
				5 * 60 * 1000, // 5 minutes
				() => {
					updateState({
						progressMessage:
							"Download complete, compiling model (this may take a while)...",
					});
				},
			);

			engineRef.current = engine;
			selectedModelRef.current = modelToLoad as ModelName;
			updateState({
				progress: 95,
				progressMessage: "Ready!",
				modelLoaded: modelToLoad,
			});

			// Small delay before marking complete
			await new Promise((r) => setTimeout(r, 300));
			updateState({
				isInitialized: true,
				isLoading: false,
				progress: 100,
				progressMessage: "",
			});
		} catch (err) {
			let message =
				err instanceof Error ? err.message : "Failed to initialize AI";

			// Detect GPU device lost errors
			const isDeviceLost =
				message.includes("Device was lost") ||
				message.includes("Device lost") ||
				message.includes("GPUDeviceLostInfo");

			if (isDeviceLost) {
				message = `GPU Device Lost

Your GPU ran out of memory or crashed. This can happen with large models.

Solutions:
1. Click "Reload" to try a smaller model
2. Close other browser tabs using GPU (video players, games, other AI tools)
3. Close GPU-intensive applications
4. Restart your browser
5. Use a smaller model (< 1.5 GB)`;
			} else if (
				message.includes("NetworkError") ||
				message.includes("fetch") ||
				message.includes("Failed to fetch") ||
				message.includes("SSL") ||
				message.includes("ERR_SSL")
			) {
				message = `Model download failed due to network/SSL error.

This could be caused by:
1. SSL certificate issue with model server
2. Network connectivity issue
3. Ad blocker or privacy extension
4. Firewall or proxy blocking requests
5. Model server temporarily unavailable

Try:
1. Check your internet connection
2. Disable VPN/proxy if using
3. Try again in a few minutes (server may be down)
4. Try a different network (e.g., mobile hotspot)`;
			} else if (message.includes("out of memory") || message.includes("OOM")) {
				message = `Out of memory: ${message}

The model requires significant GPU memory. Try:
1. Close other tabs/applications
2. Use a smaller model (tier-3: Llama-3.2-1B)`;
			} else if (message.includes("timed out")) {
				message = `Model initialization timed out.

This can happen when:
1. The model is too large for your GPU
2. GPU memory is constrained
3. Browser is running out of resources

Solutions:
1. Try a smaller model (SmolLM2 360M or Llama 3.2 1B)
2. Close other browser tabs
3. Restart your browser
4. Disable hardware acceleration in other apps`;
			}

			updateState({
				isLoading: false,
				error: message,
				progress: 0,
			});
			onError?.(message);
		}
	}, [state.isInitialized, state.isLoading, updateState, onError]);

	// Unload model to free memory
	const unload = useCallback(async () => {
		// Abort any in-progress initialization
		abortRef.current = true;

		// Force cleanup of engine
		if (engineRef.current) {
			try {
				// Try to call dispose if available
				if (typeof engineRef.current.terminate === "function") {
					engineRef.current.terminate();
				}
				engineRef.current = null;
			} catch {
				// Ignore cleanup errors
			}
		}

		// Terminate worker if exists
		if (workerRef.current) {
			workerRef.current.terminate();
			workerRef.current = null;
		}

		updateState({
			isInitialized: false,
			isLoading: false,
			isGenerating: false,
			modelLoaded: null,
			progress: 0,
			progressMessage: "",
			error: null,
		});
	}, [updateState]);

	// Generate text with optional context
	const generate = useCallback(
		async (prompt: string, context?: string): Promise<string> => {
			if (!engineRef.current) {
				throw new Error("AI engine not initialized");
			}

			updateState({ isGenerating: true });

			try {
				const messages = [
					{ role: "system", content: SYSTEM_PROMPTS.codeExpert },
					...(context
						? [
								{
									role: "user",
									content: `Context:\n\`\`\`\n${context}\n\`\`\``,
								},
							]
						: []),
					{ role: "user", content: prompt },
				];

				const reply = await engineRef.current.chat.completions.create({
					messages,
					temperature: 0.3,
					max_tokens: 512,
				});

				return reply.choices[0]?.message?.content ?? "No response generated";
			} finally {
				updateState({ isGenerating: false });
			}
		},
		[updateState],
	);

	// Stream generate with callback
	const streamGenerate = useCallback(
		async (
			prompt: string,
			context?: string,
			onChunk?: (chunk: string) => void,
		): Promise<string> => {
			if (!engineRef.current) {
				throw new Error("AI engine not initialized");
			}

			updateState({ isGenerating: true });

			try {
				const messages = [
					{ role: "system", content: SYSTEM_PROMPTS.codeExpert },
					...(context
						? [
								{
									role: "user",
									content: `Context:\n\`\`\`\n${context}\n\`\`\``,
								},
							]
						: []),
					{ role: "user", content: prompt },
				];

				const chunks = await engineRef.current.chat.completions.create({
					messages,
					temperature: 0.3,
					max_tokens: 512,
					stream: true,
				});

				let fullResponse = "";
				for await (const chunk of chunks) {
					const content = chunk.choices[0]?.delta?.content ?? "";
					if (content) {
						fullResponse += content;
						onChunk?.(content);
					}
				}

				return fullResponse;
			} finally {
				updateState({ isGenerating: false });
			}
		},
		[updateState],
	);

	// Explain code snippet
	const explainCode = useCallback(
		async (code: string, language: string): Promise<string> => {
			const prompt = `Explain this ${language} code. What does it do? Are there any issues?`;
			return generate(prompt, code);
		},
		[generate],
	);

	// Explain hotspot
	const explainHotspot = useCallback(
		async (
			filePath: string,
			metrics: { fanIn: number; fanOut: number; loc: number; score: number },
		): Promise<string> => {
			if (!engineRef.current) {
				throw new Error("AI engine not initialized");
			}

			updateState({ isGenerating: true });

			try {
				const messages = [
					{ role: "system", content: SYSTEM_PROMPTS.hotspotAnalyzer },
					{
						role: "user",
						content: `Analyze this hotspot:
File: ${filePath}
Fan-in (dependencies): ${metrics.fanIn}
Fan-out (dependents): ${metrics.fanOut}
Lines of code: ${metrics.loc}
Hotspot score: ${metrics.score}

Why might this file be a hotspot and what should be done about it?`,
					},
				];

				const reply = await engineRef.current.chat.completions.create({
					messages,
					temperature: 0.4,
					max_tokens: 256,
				});

				return reply.choices[0]?.message?.content ?? "No analysis available";
			} finally {
				updateState({ isGenerating: false });
			}
		},
		[updateState],
	);

	// Analyze dependency relationship
	const analyzeDependency = useCallback(
		async (
			sourceFile: string,
			targetFile: string,
			relationship: string,
		): Promise<string> => {
			if (!engineRef.current) {
				throw new Error("AI engine not initialized");
			}

			updateState({ isGenerating: true });

			try {
				const messages = [
					{ role: "system", content: SYSTEM_PROMPTS.dependencyAnalyst },
					{
						role: "user",
						content: `Explain this dependency relationship:
Source: ${sourceFile}
Target: ${targetFile}
Relationship type: ${relationship}

What does this coupling mean for the architecture?`,
					},
				];

				const reply = await engineRef.current.chat.completions.create({
					messages,
					temperature: 0.4,
					max_tokens: 200,
				});

				return reply.choices[0]?.message?.content ?? "No analysis available";
			} finally {
				updateState({ isGenerating: false });
			}
		},
		[updateState],
	);

	// Auto-initialize if requested
	useEffect(() => {
		if (autoInit && !state.isInitialized && !state.isLoading) {
			initialize();
		}
	}, [autoInit, state.isInitialized, state.isLoading, initialize]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (workerRef.current) {
				workerRef.current.terminate();
			}
		};
	}, []);

	// Reload with a different model
	const reloadWithModel = useCallback(
		async (newModel: ModelName) => {
			// Properly dispose current engine to free GPU memory
			if (engineRef.current) {
				try {
					// WebLLM's dispose method to free GPU resources
					await engineRef.current.dispose?.();
				} catch {
					// Ignore dispose errors
				}
				engineRef.current = null;
			}

			// Force garbage collection pause to let GPU memory settle
			await new Promise((r) => setTimeout(r, 500));

			selectedModelRef.current = newModel;
			updateState({
				isInitialized: false,
				modelLoaded: null,
				error: null,
				progress: 0,
			});

			// Re-initialize with new model
			await initialize();
		},
		[initialize, updateState],
	);

	return {
		state,
		initialize,
		unload,
		generate,
		streamGenerate,
		explainCode,
		explainHotspot,
		analyzeDependency,
		canUseAI: state.isInitialized && !state.error,
		tier: state.benchmark?.tier ?? null,
		diagnostics: state.benchmark?.diagnosticInfo ?? null,
		availableModels: AVAILABLE_MODELS,
		reloadWithModel,
		abort: () => {
			abortRef.current = true;
			unload();
		},
	};
}
