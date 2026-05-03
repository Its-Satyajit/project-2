"use client";

/**
 * AI Explain Button
 * A compact button that triggers AI explanation for code
 */

import { Brain, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { useWebLLM } from "~/lib/webllm/useWebLLM";

interface AIExplainButtonProps {
	code: string;
	language?: string;
	variant?: "default" | "ghost" | "outline";
	size?: "sm" | "default" | "lg";
	className?: string;
}

export function AIExplainButton({
	code,
	language = "text",
	variant = "ghost",
	size = "sm",
	className = "",
}: AIExplainButtonProps) {
	const [explanation, setExplanation] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [showTooltip, setShowTooltip] = useState(false);
	const { explainCode, canUseAI, initialize, state } = useWebLLM();

	const handleClick = async () => {
		if (!canUseAI) {
			// Show initialization prompt
			setShowTooltip(true);
			setTimeout(() => setShowTooltip(false), 3000);
			return;
		}

		if (explanation) {
			// Toggle visibility
			setExplanation(null);
			return;
		}

		setIsLoading(true);
		try {
			const result = await explainCode(code, language);
			setExplanation(result);
		} catch (error) {
			setExplanation(
				`Error: ${error instanceof Error ? error.message : "Analysis failed"}`,
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className={`relative ${className}`}>
			<Button
				className={`gap-1.5 ${explanation ? "bg-primary/10" : ""}`}
				disabled={isLoading}
				onClick={handleClick}
				size={size}
				variant={variant}
			>
				{isLoading ? (
					<Loader2 className="h-3.5 w-3.5 animate-spin" />
				) : (
					<Brain className="h-3.5 w-3.5" />
				)}
				<span className="text-xs">
					{isLoading ? "Analyzing..." : explanation ? "Hide" : "AI Explain"}
				</span>
			</Button>

			{/* Initialization tooltip */}
			{showTooltip && !canUseAI && (
				<motion.div
					animate={{ opacity: 1, y: 0 }}
					className="absolute top-full right-0 z-50 mt-2 w-64 rounded-lg border border-border bg-card p-3 shadow-lg"
					exit={{ opacity: 0 }}
					initial={{ opacity: 0, y: 5 }}
				>
					<p className="mb-2 text-muted-foreground text-xs">
						Enable AI Insights from the sidebar to use this feature.
					</p>
					<Button
						className="w-full"
						onClick={() => {
							initialize();
							setShowTooltip(false);
						}}
						size="sm"
						variant="outline"
					>
						Initialize AI
					</Button>
				</motion.div>
			)}

			{/* Explanation popup */}
			{explanation && (
				<motion.div
					animate={{ opacity: 1, y: 0, scale: 1 }}
					className="absolute top-full right-0 z-50 mt-2 max-h-64 w-80 overflow-y-auto rounded-lg border border-border bg-card p-4 shadow-lg"
					initial={{ opacity: 0, y: 5, scale: 0.95 }}
				>
					<div className="mb-2 flex items-center gap-2 border-border border-b pb-2">
						<Brain className="h-4 w-4 text-primary" />
						<span className="font-semibold text-xs">AI Explanation</span>
					</div>
					<p className="whitespace-pre-wrap font-mono text-muted-foreground text-xs leading-relaxed">
						{explanation}
					</p>
				</motion.div>
			)}
		</div>
	);
}
