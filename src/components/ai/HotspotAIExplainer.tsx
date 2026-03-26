"use client";

/**
 * Hotspot AI Explainer
 * Provides AI-powered analysis for repository hotspots
 */

import { Brain, ChevronRight, Loader2, Sparkles, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { Button } from "~/components/ui/button";
import { useWebLLM } from "~/lib/webllm/useWebLLM";

interface HotspotAIExplainerProps {
	filePath: string;
	fanIn: number;
	fanOut: number;
	loc: number;
	score: number;
	className?: string;
}

export function HotspotAIExplainer({
	filePath,
	fanIn,
	fanOut,
	loc,
	score,
	className = "",
}: HotspotAIExplainerProps) {
	const [analysis, setAnalysis] = useState<string | null>(null);
	const [isExpanded, setIsExpanded] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const { explainHotspot, canUseAI, state } = useWebLLM();

	const handleAnalyze = useCallback(async () => {
		if (!canUseAI) return;

		setIsLoading(true);
		setIsExpanded(true);

		try {
			const result = await explainHotspot(filePath, {
				fanIn,
				fanOut,
				loc,
				score,
			});
			setAnalysis(result);
		} catch (error) {
			setAnalysis(
				`Analysis unavailable: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		} finally {
			setIsLoading(false);
		}
	}, [canUseAI, explainHotspot, filePath, fanIn, fanOut, loc, score]);

	const riskLevel = score > 70 ? "critical" : score > 40 ? "high" : "medium";
	const riskColors = {
		critical: "text-red-500 bg-red-500/10 border-red-500/20",
		high: "text-orange-500 bg-orange-500/10 border-orange-500/20",
		medium: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
	};

	return (
		<div className={`${className}`}>
			{/* Trigger button */}
			<Button
				className={`group gap-2 ${riskColors[riskLevel]}`}
				disabled={isLoading || state.isGenerating}
				onClick={() => {
					if (analysis) {
						setIsExpanded(!isExpanded);
					} else {
						handleAnalyze();
					}
				}}
				size="sm"
				variant="outline"
			>
				{isLoading ? (
					<Loader2 className="h-4 w-4 animate-spin" />
				) : (
					<Brain className="h-4 w-4 transition-transform group-hover:scale-110" />
				)}
				<span className="font-medium text-xs">
					{isLoading
						? "Analyzing..."
						: analysis
							? "View AI Analysis"
							: "AI Analyze Hotspot"}
				</span>
				<ChevronRight
					className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
				/>
			</Button>

			{/* Analysis panel */}
			<AnimatePresence>
				{isExpanded && analysis && (
					<motion.div
						animate={{ opacity: 1, height: "auto" }}
						className="mt-2 overflow-hidden"
						exit={{ opacity: 0, height: 0 }}
						initial={{ opacity: 0, height: 0 }}
					>
						<div className="relative rounded-lg border border-border bg-card/50 p-4 backdrop-blur-sm">
							{/* Decorative corner */}
							<div className="absolute top-0 right-0 h-8 w-8">
								<div className="absolute top-0 right-0 h-px w-4 bg-gradient-to-l from-primary to-transparent" />
								<div className="absolute top-0 right-0 h-4 w-px bg-gradient-to-b from-primary to-transparent" />
							</div>

							{/* Header */}
							<div className="mb-3 flex items-center gap-2">
								<div className="rounded-md bg-primary/10 p-1.5">
									<Zap className="h-3.5 w-3.5 text-primary" />
								</div>
								<span className="font-semibold text-xs">Hotspot Analysis</span>
								<div className="ml-auto flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
									<Sparkles className="h-3 w-3 text-muted-foreground" />
									<span className="font-mono text-[10px] text-muted-foreground">
										Score: {score}
									</span>
								</div>
							</div>

							{/* Metrics badges */}
							<div className="mb-3 flex flex-wrap gap-2">
								<span className="rounded-md border border-border bg-muted/50 px-2 py-1 font-mono text-[10px]">
									Fan-in: {fanIn}
								</span>
								<span className="rounded-md border border-border bg-muted/50 px-2 py-1 font-mono text-[10px]">
									Fan-out: {fanOut}
								</span>
								<span className="rounded-md border border-border bg-muted/50 px-2 py-1 font-mono text-[10px]">
									LOC: {loc}
								</span>
							</div>

							{/* Analysis text */}
							<div className="rounded-md bg-muted/30 p-3">
								<p className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
									{analysis}
								</p>
							</div>

							{/* File path */}
							<div className="mt-3 border-border border-t pt-2">
								<code className="font-mono text-[10px] text-muted-foreground">
									{filePath}
								</code>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

/**
 * Inline hotspot badge with AI tooltip
 */
export function HotspotAIBadge({
	filePath,
	fanIn,
	fanOut,
	loc,
	score,
	onAnalyze,
}: HotspotAIExplainerProps & { onAnalyze?: () => void }) {
	const { canUseAI } = useWebLLM();
	const [showTooltip, setShowTooltip] = useState(false);

	const riskLevel = score > 70 ? "critical" : score > 40 ? "high" : "medium";
	const riskColors = {
		critical: "bg-red-500/20 text-red-400 border-red-500/30",
		high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
		medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
	};

	return (
		<div className="relative inline-flex">
			<button
				aria-label={`Hotspot score ${score}. Fan-in: ${fanIn}, Fan-out: ${fanOut}, Lines of code: ${loc}`}
				className={`inline-flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] ${riskColors[riskLevel]}`}
				onBlur={() => setShowTooltip(false)}
				onFocus={() => setShowTooltip(true)}
				onMouseEnter={() => setShowTooltip(true)}
				onMouseLeave={() => setShowTooltip(false)}
				type="button"
			>
				<Zap aria-hidden="true" className="h-2.5 w-2.5" />
				{score}
			</button>

			{showTooltip && (
				<motion.div
					animate={{ opacity: 1, y: 0 }}
					className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2"
					initial={{ opacity: 0, y: 5 }}
					role="tooltip"
				>
					<div className="rounded-lg border border-border bg-card p-2 shadow-lg">
						<div className="mb-1 flex items-center gap-1">
							<Brain aria-hidden="true" className="h-3 w-3 text-primary" />
							<span className="font-medium text-[10px]">Hotspot: {score}</span>
						</div>
						<div className="space-y-0.5 font-mono text-[9px] text-muted-foreground">
							<div>fan-in: {fanIn}</div>
							<div>fan-out: {fanOut}</div>
							<div>loc: {loc}</div>
						</div>
						{canUseAI && (
							<Button
								className="mt-1 h-5 w-full text-[10px]"
								onClick={onAnalyze}
								size="sm"
								variant="ghost"
							>
								Analyze with AI
							</Button>
						)}
					</div>
				</motion.div>
			)}
		</div>
	);
}
