"use client";

/**
 * AI Insights Panel
 * A terminal-inspired interface for AI-powered code analysis
 * Design: Cyberpunk terminal meets circuit board aesthetics
 */

import {
	Brain,
	CircuitBoard,
	Cpu,
	Loader2,
	Sparkles,
	Trash2,
	X,
	Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import {
	AVAILABLE_MODELS,
	type ModelName,
	useWebLLM,
	type WebLLMState,
} from "~/lib/webllm/useWebLLM";

interface AIInsightsPanelProps {
	filePath?: string;
	fileContent?: string;
	language?: string;
	hotspotData?: {
		fanIn: number;
		fanOut: number;
		loc: number;
		score: number;
	};
	dependencyInfo?: {
		source: string;
		target: string;
		relationship: string;
	};
	onClose?: () => void;
}

type InsightType = "code" | "hotspot" | "dependency" | "general";

interface Insight {
	id: string;
	type: InsightType;
	prompt: string;
	response: string;
	timestamp: Date;
	isStreaming?: boolean;
}

// Neural network background animation
function NeuralBackground({ intensity = 0.3 }: { intensity?: number }) {
	return (
		<div className="pointer-events-none absolute inset-0 overflow-hidden opacity-20">
			{/* Animated circuit traces */}
			<svg
				aria-hidden="true"
				className="h-full w-full"
				preserveAspectRatio="none"
				viewBox="0 0 400 600"
			>
				<motion.path
					animate={{ pathLength: 1 }}
					className="text-primary"
					d="M0,100 Q100,150 200,100 T400,100"
					fill="none"
					initial={{ pathLength: 0 }}
					stroke="currentColor"
					strokeWidth="1"
					transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
				/>
				<motion.path
					animate={{ pathLength: 1 }}
					className="text-accent"
					d="M0,300 Q150,250 300,300 T400,250"
					fill="none"
					initial={{ pathLength: 0 }}
					stroke="currentColor"
					strokeWidth="1"
					transition={{
						duration: 4,
						repeat: Number.POSITIVE_INFINITY,
						delay: 1,
					}}
				/>
				<motion.path
					animate={{ pathLength: 1 }}
					className="text-primary"
					d="M0,500 Q100,450 200,500 T400,480"
					fill="none"
					initial={{ pathLength: 0 }}
					stroke="currentColor"
					strokeWidth="1"
					transition={{
						duration: 3.5,
						repeat: Number.POSITIVE_INFINITY,
						delay: 0.5,
					}}
				/>
				{/* Neural nodes */}
				{[100, 200, 300, 400, 500].map((y, i) => (
					<motion.circle
						animate={{
							opacity: [0.2, 0.8, 0.2],
							r: [2, 4, 2],
						}}
						className="text-primary/50"
						cx={50 + i * 80}
						cy={y}
						fill="currentColor"
						key={y}
						r="3"
						transition={{
							duration: 2,
							repeat: Number.POSITIVE_INFINITY,
							delay: i * 0.3,
						}}
					/>
				))}
			</svg>
		</div>
	);
}

// Progress bar for model loading
function ModelLoadingProgress({ state }: { state: WebLLMState }) {
	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2">
				<Cpu className="h-4 w-4 animate-pulse text-primary" />
				<span className="font-mono text-muted-foreground text-xs">
					{state.progressMessage}
				</span>
			</div>
			<div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
				<motion.div
					animate={{ width: `${state.progress}%` }}
					className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-accent to-primary"
					initial={{ width: "0%" }}
					style={{
						backgroundSize: "200% 100%",
						animation: "gradient-shift 2s linear infinite",
					}}
					transition={{ duration: 0.3 }}
				/>
			</div>
			<div className="flex justify-between font-mono text-[10px] text-muted-foreground">
				<span>Loading model weights</span>
				<span>{state.progress}%</span>
			</div>
		</div>
	);
}

// Streaming text component with typewriter effect
function StreamingText({
	text,
	isStreaming,
}: {
	text: string;
	isStreaming?: boolean;
}) {
	const [displayedText, setDisplayedText] = useState("");
	const indexRef = useRef(0);

	useEffect(() => {
		if (!isStreaming) {
			setDisplayedText(text);
			return;
		}

		const interval = setInterval(() => {
			if (indexRef.current < text.length) {
				setDisplayedText(text.slice(0, indexRef.current + 1));
				indexRef.current++;
			} else {
				clearInterval(interval);
			}
		}, 10);

		return () => clearInterval(interval);
	}, [text, isStreaming]);

	return (
		<span className="font-mono text-sm leading-relaxed">
			{displayedText}
			{isStreaming && displayedText.length < text.length && (
				<motion.span
					animate={{ opacity: [1, 0] }}
					className="inline-block w-2 bg-primary"
					transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY }}
				/>
			)}
		</span>
	);
}

// Insight card
function InsightCard({
	insight,
	onExplain,
}: {
	insight: Insight;
	onExplain: (type: InsightType) => void;
}) {
	const typeIcons: Record<InsightType, typeof Brain> = {
		code: Brain,
		hotspot: Zap,
		dependency: CircuitBoard,
		general: Sparkles,
	};
	const TypeIcon = typeIcons[insight.type];

	return (
		<motion.div
			animate={{ opacity: 1, y: 0 }}
			className="group relative"
			initial={{ opacity: 0, y: 10 }}
		>
			{/* Glowing border effect */}
			<div className="absolute -inset-px rounded-lg bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-0 blur-sm transition-opacity group-hover:opacity-100" />

			<div className="relative rounded-lg border border-border bg-card/80 p-4 backdrop-blur-sm">
				{/* Header */}
				<div className="mb-3 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div className="rounded-md bg-primary/10 p-1.5">
							<TypeIcon className="h-3.5 w-3.5 text-primary" />
						</div>
						<span className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
							{insight.type} analysis
						</span>
					</div>
					<span className="font-mono text-[10px] text-muted-foreground/60">
						{insight.timestamp.toLocaleTimeString()}
					</span>
				</div>

				{/* Response */}
				<div className="text-foreground/90">
					<StreamingText
						isStreaming={insight.isStreaming}
						text={insight.response}
					/>
				</div>
			</div>
		</motion.div>
	);
}

export function AIInsightsPanel({
	filePath,
	fileContent,
	language,
	hotspotData,
	dependencyInfo,
	onClose,
}: AIInsightsPanelProps) {
	const [insights, setInsights] = useState<Insight[]>([]);
	const [customPrompt, setCustomPrompt] = useState("");
	const scrollRef = useRef<HTMLDivElement>(null);

	const {
		state,
		initialize,
		unload,
		explainCode,
		explainHotspot,
		analyzeDependency,
		streamGenerate,
		canUseAI,
		diagnostics,
		reloadWithModel,
		abort,
	} = useWebLLM();

	const [selectedModel, setSelectedModel] = useState<ModelName | null>(null);

	// Auto-scroll to latest insight
	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [insights.length]);

	// Generate insight with streaming
	const generateInsight = useCallback(
		async (
			type: InsightType,
			prompt: string,
			generator: () => Promise<string>,
		) => {
			if (!canUseAI) return;

			const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
			const newInsight: Insight = {
				id,
				type,
				prompt,
				response: "",
				timestamp: new Date(),
				isStreaming: true,
			};

			setInsights((prev) => [...prev, newInsight]);

			try {
				const response = await generator();
				setInsights((prev) =>
					prev.map((i) =>
						i.id === id ? { ...i, response, isStreaming: false } : i,
					),
				);
			} catch (error) {
				setInsights((prev) =>
					prev.map((i) =>
						i.id === id
							? {
									...i,
									response: `Error: ${error instanceof Error ? error.message : "Analysis failed"}`,
									isStreaming: false,
								}
							: i,
					),
				);
			}
		},
		[canUseAI],
	);

	// Auto-analyze when context changes
	useEffect(() => {
		if (!canUseAI) return;

		if (fileContent && filePath) {
			generateInsight("code", "Explain this code", () =>
				explainCode(fileContent, language || "text"),
			);
		}
	}, [canUseAI, fileContent, filePath, language, explainCode, generateInsight]);

	// Handle custom prompt
	const handleCustomPrompt = async () => {
		if (!customPrompt.trim() || !canUseAI) return;
		const prompt = customPrompt;
		setCustomPrompt("");
		await generateInsight("general", prompt, () => streamGenerate(prompt));
	};

	return (
		<motion.div
			animate={{ opacity: 1, x: 0 }}
			className="relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card"
			exit={{ opacity: 0, x: 20 }}
			initial={{ opacity: 0, x: 20 }}
		>
			{/* Neural background */}
			<NeuralBackground />

			{/* Header */}
			<div className="relative border-border border-b bg-gradient-to-r from-primary/5 via-transparent to-accent/5 p-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="relative">
							<motion.div
								animate={{ scale: [1, 1.05, 1] }}
								aria-hidden="true"
								className="rounded-lg bg-gradient-to-br from-primary to-accent p-2"
								transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
							>
								<Brain className="h-5 w-5 text-primary-foreground" />
							</motion.div>
							{state.isGenerating && (
								<motion.div
									animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
									className="absolute -inset-1 rounded-lg bg-primary/30"
									transition={{
										duration: 1.5,
										repeat: Number.POSITIVE_INFINITY,
									}}
								/>
							)}
						</div>
						<div>
							<h3 className="font-semibold text-sm">AI Insights</h3>
							<p className="text-[10px] text-muted-foreground">
								{canUseAI
									? state.benchmark?.tier === "tier-1"
										? "Full model active"
										: state.benchmark?.tier === "tier-2"
											? "Light model active"
											: "Basic model active"
									: "Offline analysis only"}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						{canUseAI && (
							<Button
								className="h-7 w-7 p-0"
								onClick={unload}
								size="sm"
								title="Unload model"
								variant="ghost"
							>
								<Trash2 className="h-3.5 w-3.5" />
							</Button>
						)}
						{onClose && (
							<Button
								className="h-7 w-7 p-0"
								onClick={onClose}
								size="sm"
								variant="ghost"
							>
								<X className="h-3.5 w-3.5" />
							</Button>
						)}
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="relative flex-1 overflow-hidden">
				<AnimatePresence mode="wait">
					{/* Loading state */}
					{state.isLoading && (
						<motion.div
							animate={{ opacity: 1 }}
							className="flex h-full flex-col items-center justify-center gap-4 p-6"
							exit={{ opacity: 0 }}
							initial={{ opacity: 0 }}
							key="loading"
						>
							<div className="w-full max-w-xs">
								<ModelLoadingProgress state={state} />
							</div>
							{/* Always show cancel button during loading */}
							<div className="flex gap-2">
								<Button
									onClick={() => {
										abort();
									}}
									size="sm"
									variant="outline"
								>
									Cancel
								</Button>
							</div>
						</motion.div>
					)}

					{/* Error state */}
					{state.error && !state.isLoading && (
						<motion.div
							animate={{ opacity: 1 }}
							className="flex h-full items-center justify-center overflow-auto p-4"
							exit={{ opacity: 0 }}
							initial={{ opacity: 0 }}
							key="error"
						>
							<div className="w-full">
								<div className="mb-3 text-center">
									<div className="mx-auto mb-3 rounded-full bg-destructive/10 p-3">
										<X className="mx-auto h-6 w-6 text-destructive" />
									</div>
								</div>

								{/* Diagnostic info */}
								{diagnostics && (
									<div className="mb-4 rounded-lg border border-border bg-muted/50 p-3">
										<p className="mb-2 font-semibold text-xs">
											Diagnostic Info
										</p>
										<div className="space-y-1 font-mono text-[10px]">
											<div className="flex justify-between">
												<span className="text-muted-foreground">Browser:</span>
												<span>{diagnostics.browserInfo}</span>
											</div>
											<div className="flex justify-between">
												<span className="text-muted-foreground">
													navigator.gpu:
												</span>
												<span
													className={
														diagnostics.hasGPU
															? "text-green-500"
															: "text-red-500"
													}
												>
													{diagnostics.hasGPU ? "Available" : "Not Available"}
												</span>
											</div>
											{diagnostics.hasGPU && (
												<>
													<div className="flex justify-between">
														<span className="text-muted-foreground">
															requestAdapter:
														</span>
														<span
															className={
																diagnostics.requestAdapterSucceeded
																	? "text-green-500"
																	: "text-red-500"
															}
														>
															{diagnostics.requestAdapterSucceeded
																? "OK"
																: "Failed"}
														</span>
													</div>
													<div className="flex justify-between">
														<span className="text-muted-foreground">
															adapter found:
														</span>
														<span
															className={
																diagnostics.adapterNotNull
																	? "text-green-500"
																	: "text-red-500"
															}
														>
															{diagnostics.adapterNotNull ? "Yes" : "No"}
														</span>
													</div>
												</>
											)}
										</div>
									</div>
								)}

								{/* Error message */}
								<div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
									<pre className="whitespace-pre-wrap font-mono text-[10px] text-muted-foreground">
										{state.error}
									</pre>
								</div>

								<div className="space-y-3">
									{/* Model selector dropdown */}
									{Object.keys(AVAILABLE_MODELS).length > 0 && (
										<div>
											<label
												className="mb-1 block font-mono text-[10px] text-muted-foreground uppercase"
												htmlFor="model-select"
											>
												Select Model (sorted by size):
											</label>
											<select
												className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs"
												id="model-select"
												onChange={(e) => {
													if (e.target.value) {
														reloadWithModel(e.target.value);
													}
												}}
											>
												<option value="">Choose a model...</option>
												{Object.entries(AVAILABLE_MODELS)
													.filter(([, info]) => info.vram > 0)
													.sort(([, a], [, b]) => a.vram - b.vram)
													.map(([key, info]) => (
														<option key={key} value={key}>
															{info.name} ({Math.round(info.vram)} MB)
														</option>
													))}
											</select>
										</div>
									)}
									<Button
										className="w-full"
										onClick={initialize}
										size="sm"
										variant="outline"
									>
										Retry
									</Button>
								</div>
							</div>
						</motion.div>
					)}

					{/* Not initialized state */}
					{!state.isInitialized && !state.isLoading && !state.error && (
						<motion.div
							animate={{ opacity: 1 }}
							className="flex h-full items-center justify-center p-6"
							exit={{ opacity: 0 }}
							initial={{ opacity: 0 }}
							key="init"
						>
							<div className="w-full max-w-xs space-y-4">
								<div className="text-center">
									<motion.div
										animate={{ y: [0, -5, 0] }}
										className="mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 p-4"
										transition={{
											duration: 2,
											repeat: Number.POSITIVE_INFINITY,
										}}
									>
										<Sparkles className="mx-auto h-8 w-8 text-primary" />
									</motion.div>
									<h4 className="mb-2 font-semibold text-sm">
										Enable AI Insights
									</h4>
									<p className="mb-4 text-muted-foreground text-xs">
										Run LLM inference directly in your browser.
										<br />
										No data leaves your device.
									</p>
								</div>

								{/* Model selector dropdown */}
								{Object.keys(AVAILABLE_MODELS).length > 0 && (
									<div>
										<label
											className="mb-1 block text-left font-mono text-[10px] text-muted-foreground uppercase"
											htmlFor="model-select-init"
										>
											Select Model:
										</label>
										<select
											className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs"
											id="model-select-init"
											onChange={(e) => {
												if (e.target.value) {
													reloadWithModel(e.target.value);
												} else {
													initialize();
												}
											}}
										>
											<option value="">Default (smallest)</option>
											{Object.entries(AVAILABLE_MODELS)
												.filter(([, info]) => info.vram > 0)
												.sort(([, a], [, b]) => a.vram - b.vram)
												.map(([key, info]) => (
													<option key={key} value={key}>
														{info.name} ({Math.round(info.vram)} MB)
													</option>
												))}
										</select>
									</div>
								)}

								<Button
									className="w-full gap-2"
									onClick={initialize}
									size="sm"
									variant="default"
								>
									<Zap className="h-3.5 w-3.5" />
									Initialize AI
								</Button>
							</div>
						</motion.div>
					)}

					{/* Insights list */}
					{state.isInitialized && !state.isLoading && (
						<motion.div
							animate={{ opacity: 1 }}
							className="flex h-full flex-col"
							exit={{ opacity: 0 }}
							initial={{ opacity: 0 }}
							key="insights"
						>
							{/* Insights scroll area */}
							<div
								className="flex-1 space-y-3 overflow-y-auto p-4"
								ref={scrollRef}
							>
								{insights.length === 0 && (
									<div className="py-8 text-center text-muted-foreground text-sm">
										No insights yet. Analysis will appear here automatically.
									</div>
								)}
								{insights.map((insight) => (
									<InsightCard
										insight={insight}
										key={insight.id}
										onExplain={() => {}}
									/>
								))}
							</div>

							{/* Custom prompt input */}
							<div className="border-border border-t bg-muted/30 p-3">
								<div className="flex gap-2">
									<input
										className="flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
										disabled={state.isGenerating}
										onChange={(e) => setCustomPrompt(e.target.value)}
										onKeyDown={(e) => e.key === "Enter" && handleCustomPrompt()}
										placeholder="Ask about this code..."
										type="text"
										value={customPrompt}
									/>
									<Button
										disabled={state.isGenerating || !customPrompt.trim()}
										onClick={handleCustomPrompt}
										size="sm"
									>
										{state.isGenerating ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											"Ask"
										)}
									</Button>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Status indicator */}
			<div className="relative border-border border-t bg-muted/50 px-4 py-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div
							className={`h-2 w-2 rounded-full ${
								canUseAI
									? state.isGenerating
										? "animate-pulse bg-yellow-500"
										: "bg-green-500"
									: "bg-muted-foreground"
							}`}
						/>
						<span className="font-mono text-[10px] text-muted-foreground">
							{canUseAI
								? state.isGenerating
									? "Generating..."
									: "Ready"
								: "AI inactive"}
						</span>
					</div>
					{state.benchmark && (
						<span className="font-mono text-[10px] text-muted-foreground">
							Score: {state.benchmark.benchmarkScore}
						</span>
					)}
				</div>
			</div>

			{/* CSS for gradient animation */}
			<style jsx>{`
				@keyframes gradient-shift {
					0% {
						background-position: 0% 50%;
					}
					100% {
						background-position: 200% 50%;
					}
				}
			`}</style>
		</motion.div>
	);
}
