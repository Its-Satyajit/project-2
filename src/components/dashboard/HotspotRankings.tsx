"use client";

import { AlertTriangle, Flame, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import React from "react";

interface HotspotDatum {
	path: string;
	language: string;
	fanIn: number;
	fanOut: number;
	loc: number;
	score: number;
	rank: number;
}

interface HotspotRankingsProps {
	hotspots: HotspotDatum[];
	maxVisible?: number;
}

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.04,
		},
	},
};

const itemVariants = {
	hidden: { opacity: 0, x: -8 },
	visible: { opacity: 1, x: 0 },
};

function getSeverity(score: number): "critical" | "warning" | "normal" {
	if (score >= 0.7) return "critical";
	if (score >= 0.4) return "warning";
	return "normal";
}

function getSeverityColor(severity: string): string {
	switch (severity) {
		case "critical":
			return "text-destructive border-destructive/30 bg-destructive/5";
		case "warning":
			return "text-accent border-accent/30 bg-accent/5";
		default:
			return "text-muted-foreground border-border bg-muted/20";
	}
}

function getSeverityIcon(
	severity: string,
): React.ComponentType<{ className?: string }> {
	switch (severity) {
		case "critical":
			return AlertTriangle;
		case "warning":
			return Flame;
		default:
			return TrendingUp;
	}
}

export const HotspotRankings = React.memo(function HotspotRankings({
	hotspots,
	maxVisible = 5,
}: HotspotRankingsProps) {
	if (!hotspots || hotspots.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-8">
				<Flame className="mb-3 h-8 w-8 text-muted-foreground/30" />
				<p className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
					No hotspots detected
				</p>
			</div>
		);
	}

	const visibleHotspots = hotspots.slice(0, maxVisible);
	const maxScore = Math.max(...hotspots.map((h) => h.score));

	return (
		<motion.div animate="visible" initial="hidden" variants={containerVariants}>
			{/* Header */}
			<motion.div
				className="mb-4 flex items-center justify-between"
				variants={itemVariants}
			>
				<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
					Top Hotspots
				</span>
				<span className="font-mono text-muted-foreground text-xs">
					{hotspots.length} total
				</span>
			</motion.div>

			{/* Hotspot list */}
			<div className="space-y-2">
				{visibleHotspots.map((hotspot, index) => {
					const severity = getSeverity(hotspot.score);
					const severityColor = getSeverityColor(severity);
					const SeverityIcon = getSeverityIcon(severity);
					const scorePercentage =
						maxScore > 0 ? (hotspot.score / maxScore) * 100 : 0;

					return (
						<motion.div
							animate="visible"
							className={`group flex items-center gap-3 border p-3 ${severityColor}`}
							initial="hidden"
							key={hotspot.path}
							variants={itemVariants}
						>
							{/* Rank */}
							<div className="flex h-7 w-7 shrink-0 items-center justify-center border border-border bg-background font-mono text-foreground text-xs">
								{hotspot.rank}
							</div>

							{/* Content */}
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2">
									<SeverityIcon className="h-3 w-3 shrink-0" />
									<span className="truncate font-mono text-foreground text-sm">
										{hotspot.path.split("/").pop()}
									</span>
								</div>
								<p className="mt-0.5 truncate font-mono text-muted-foreground text-xs">
									{hotspot.path}
								</p>
							</div>

							{/* Score */}
							<div className="flex shrink-0 flex-col items-end gap-1">
								<span className="font-mono text-foreground text-sm tabular-nums">
									{hotspot.score.toFixed(2)}
								</span>
								{/* Score bar */}
								<div className="h-1 w-16 bg-border">
									<div
										className={`h-full transition-all ${
											severity === "critical"
												? "bg-destructive"
												: severity === "warning"
													? "bg-accent"
													: "bg-muted-foreground"
										}`}
										style={{ width: `${scorePercentage}%` }}
									/>
								</div>
							</div>
						</motion.div>
					);
				})}
			</div>

			{/* Legend */}
			<motion.div
				className="mt-4 flex items-center gap-4 border-border border-t pt-3"
				variants={itemVariants}
			>
				<span className="font-mono text-[9px] text-muted-foreground uppercase">
					Risk:
				</span>
				<div className="flex items-center gap-1.5">
					<div className="h-2 w-2 bg-destructive" />
					<span className="font-mono text-muted-foreground text-xs">
						Critical
					</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div className="h-2 w-2 bg-accent" />
					<span className="font-mono text-muted-foreground text-xs">
						Warning
					</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div className="h-2 w-2 bg-muted-foreground" />
					<span className="font-mono text-muted-foreground text-xs">
						Normal
					</span>
				</div>
			</motion.div>
		</motion.div>
	);
});
