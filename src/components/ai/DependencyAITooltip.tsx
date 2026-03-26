"use client";

/**
 * AI-Powered Dependency Tooltip
 * Explains file relationships using in-browser LLM
 */

import { Brain, Loader2, Network } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { useWebLLM } from "~/lib/webllm/useWebLLM";

interface DependencyAITooltipProps {
	sourceFile: string;
	targetFile: string;
	relationship: string;
	dependencyType: "import" | "require" | "dynamic" | "type";
	children: React.ReactNode;
}

export function DependencyAITooltip({
	sourceFile,
	targetFile,
	relationship,
	dependencyType,
	children,
}: DependencyAITooltipProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [analysis, setAnalysis] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const { analyzeDependency, canUseAI } = useWebLLM();

	const handleAnalyze = useCallback(async () => {
		if (!canUseAI || isLoading) return;

		setIsLoading(true);
		try {
			const result = await analyzeDependency(
				sourceFile,
				targetFile,
				relationship,
			);
			setAnalysis(result);
		} catch (error) {
			setAnalysis(
				`Analysis unavailable: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		} finally {
			setIsLoading(false);
		}
	}, [
		canUseAI,
		isLoading,
		analyzeDependency,
		sourceFile,
		targetFile,
		relationship,
	]);

	const typeColors: Record<string, string> = {
		import: "bg-blue-500/20 text-blue-400 border-blue-500/30",
		require: "bg-green-500/20 text-green-400 border-green-500/30",
		dynamic: "bg-purple-500/20 text-purple-400 border-purple-500/30",
		type: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
	};

	return (
		<div className="relative inline-flex">
			<button
				aria-label={`Dependency from ${sourceFile} to ${targetFile}`}
				className="inline-flex cursor-pointer items-center"
				onBlur={() => setIsOpen(false)}
				onFocus={() => setIsOpen(true)}
				onMouseEnter={() => setIsOpen(true)}
				onMouseLeave={() => setIsOpen(false)}
				type="button"
			>
				{children}
			</button>

			<AnimatePresence>
				{isOpen && (
					<motion.div
						animate={{ opacity: 1, y: 0, scale: 1 }}
						className="absolute bottom-full left-1/2 z-50 mb-2 min-w-64 -translate-x-1/2"
						exit={{ opacity: 0, y: 5, scale: 0.95 }}
						initial={{ opacity: 0, y: 5, scale: 0.95 }}
					>
						<div className="rounded-lg border border-border bg-card p-3 shadow-xl">
							{/* Header */}
							<div className="mb-2 flex items-center gap-2">
								<Network className="h-4 w-4 text-primary" />
								<span className="font-medium text-xs">Dependency</span>
								<span
									className={`ml-auto rounded-full border px-2 py-0.5 font-mono text-[9px] ${typeColors[dependencyType] || typeColors.import}`}
								>
									{dependencyType}
								</span>
							</div>

							{/* File paths */}
							<div className="mb-2 space-y-1">
								<div className="rounded-md bg-muted/50 px-2 py-1">
									<span className="font-mono text-[10px] text-muted-foreground">
										Source:{" "}
									</span>
									<span className="font-mono text-[10px]">{sourceFile}</span>
								</div>
								<div className="flex justify-center">
									<span className="text-muted-foreground">↓</span>
								</div>
								<div className="rounded-md bg-muted/50 px-2 py-1">
									<span className="font-mono text-[10px] text-muted-foreground">
										Target:{" "}
									</span>
									<span className="font-mono text-[10px]">{targetFile}</span>
								</div>
							</div>

							{/* Relationship */}
							<div className="mb-2 border-border border-t pt-2">
								<span className="font-mono text-[10px] text-muted-foreground">
									{relationship}
								</span>
							</div>

							{/* AI Analysis */}
							{canUseAI && (
								<div className="border-border border-t pt-2">
									{analysis ? (
										<div className="rounded-md bg-primary/5 p-2">
											<div className="mb-1 flex items-center gap-1">
												<Brain className="h-3 w-3 text-primary" />
												<span className="font-medium text-[10px] text-primary">
													AI Analysis
												</span>
											</div>
											<p className="whitespace-pre-wrap font-mono text-[10px] text-muted-foreground leading-relaxed">
												{analysis}
											</p>
										</div>
									) : (
										<button
											className="flex w-full items-center justify-center gap-1 rounded-md border border-border border-dashed py-1.5 font-mono text-[10px] text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-foreground disabled:opacity-50"
											disabled={isLoading}
											onClick={handleAnalyze}
											type="button"
										>
											{isLoading ? (
												<>
													<Loader2 className="h-3 w-3 animate-spin" />
													Analyzing...
												</>
											) : (
												<>
													<Brain className="h-3 w-3" />
													Analyze with AI
												</>
											)}
										</button>
									)}
								</div>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

/**
 * Simple dependency badge with AI tooltip trigger
 */
export function DependencyBadge({
	dependencyCount,
	onAIAnalyze,
}: {
	dependencyCount: number;
	onAIAnalyze?: () => void;
}) {
	return (
		<span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[10px] text-accent">
			<Network aria-hidden="true" className="h-2.5 w-2.5" />
			{dependencyCount} deps
		</span>
	);
}
