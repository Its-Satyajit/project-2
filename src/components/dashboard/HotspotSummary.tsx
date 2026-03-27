"use client";

import { AlertTriangle, Flame, Target, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import React, { useMemo } from "react";

interface HotspotDatum {
	path: string;
	language: string;
	fanIn: number;
	fanOut: number;
	loc: number;
	score: number;
	rank: number;
}

interface HotspotSummaryProps {
	hotspots: HotspotDatum[];
}

interface RiskBucket {
	label: string;
	count: number;
	percentage: number;
	color: string;
	icon: React.ComponentType<{ className?: string }>;
}

export const HotspotSummary = React.memo(function HotspotSummary({
	hotspots,
}: HotspotSummaryProps) {
	const summary = useMemo(() => {
		if (!hotspots || hotspots.length === 0) {
			return {
				avgScore: 0,
				maxScore: 0,
				medianScore: 0,
				criticalCount: 0,
				warningCount: 0,
				normalCount: 0,
				buckets: [] as RiskBucket[],
				avgFanIn: 0,
				avgFanOut: 0,
				mostComplexFile: null as HotspotDatum | null,
				mostConnectedFile: null as HotspotDatum | null,
			};
		}

		const scores = hotspots.map((h) => h.score);
		const sortedScores = [...scores].sort((a, b) => a - b);
		const sum = scores.reduce((a, b) => a + b, 0);
		const avgScore = sum / scores.length;
		const maxScore = Math.max(...scores);
		const medianScore = sortedScores[Math.floor(sortedScores.length / 2)] || 0;

		const criticalCount = scores.filter((s) => s >= 0.7).length;
		const warningCount = scores.filter((s) => s >= 0.4 && s < 0.7).length;
		const normalCount = scores.filter((s) => s < 0.4).length;

		const total = hotspots.length;
		const buckets: RiskBucket[] = [
			{
				label: "Critical",
				count: criticalCount,
				percentage: (criticalCount / total) * 100,
				color: "bg-destructive",
				icon: AlertTriangle,
			},
			{
				label: "Warning",
				count: warningCount,
				percentage: (warningCount / total) * 100,
				color: "bg-amber-500",
				icon: Flame,
			},
			{
				label: "Normal",
				count: normalCount,
				percentage: (normalCount / total) * 100,
				color: "bg-emerald-500",
				icon: TrendingUp,
			},
		];

		const avgFanIn =
			hotspots.reduce((sum, h) => sum + h.fanIn, 0) / hotspots.length;
		const avgFanOut =
			hotspots.reduce((sum, h) => sum + h.fanOut, 0) / hotspots.length;

		const mostComplexFile = hotspots.reduce(
			(max, h) => (h.loc > (max?.loc || 0) ? h : max),
			hotspots[0],
		);

		const mostConnectedFile = hotspots.reduce((max, h) => {
			const totalConn = h.fanIn + h.fanOut;
			const maxConn = (max?.fanIn || 0) + (max?.fanOut || 0);
			return totalConn > maxConn ? h : max;
		}, hotspots[0]);

		return {
			avgScore,
			maxScore,
			medianScore,
			criticalCount,
			warningCount,
			normalCount,
			buckets,
			avgFanIn,
			avgFanOut,
			mostComplexFile,
			mostConnectedFile,
		};
	}, [hotspots]);

	if (!hotspots || hotspots.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-8">
				<Target className="mb-3 h-8 w-8 text-muted-foreground/30" />
				<p className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
					No hotspot data
				</p>
			</div>
		);
	}

	return (
		<motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 10 }}>
			{/* Header */}
			<div className="mb-4 flex items-center justify-between">
				<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
					Risk Summary
				</span>
				<span className="font-mono text-muted-foreground text-xs">
					{hotspots.length} files analyzed
				</span>
			</div>

			{/* Score overview */}
			<div className="mb-4 grid grid-cols-3 gap-3">
				<div className="border border-border p-3 text-center">
					<span className="font-(family-name:--font-display) mb-1 block text-2xl text-foreground">
						{summary.avgScore.toFixed(2)}
					</span>
					<span className="font-mono text-[9px] text-muted-foreground uppercase">
						Avg Score
					</span>
				</div>
				<div className="border border-border p-3 text-center">
					<span className="font-(family-name:--font-display) mb-1 block text-2xl text-foreground">
						{summary.medianScore.toFixed(2)}
					</span>
					<span className="font-mono text-[9px] text-muted-foreground uppercase">
						Median
					</span>
				</div>
				<div className="border border-border p-3 text-center">
					<span className="font-(family-name:--font-display) mb-1 block text-2xl text-destructive">
						{summary.maxScore.toFixed(2)}
					</span>
					<span className="font-mono text-[9px] text-muted-foreground uppercase">
						Max Risk
					</span>
				</div>
			</div>

			{/* Risk distribution bar */}
			<div className="mb-4">
				<div className="mb-2 flex justify-between">
					<span className="font-mono text-[9px] text-muted-foreground uppercase">
						Risk Distribution
					</span>
				</div>
				<div className="flex h-3 w-full overflow-hidden">
					{summary.buckets.map((bucket) => (
						<motion.div
							animate={{ width: `${bucket.percentage}%` }}
							className={`${bucket.color}`}
							initial={{ width: 0 }}
							key={bucket.label}
							title={`${bucket.label}: ${bucket.count} files (${bucket.percentage.toFixed(1)}%)`}
						/>
					))}
				</div>
				<div className="mt-2 flex items-center justify-between">
					{summary.buckets.map((bucket) => (
						<div className="flex items-center gap-1.5" key={bucket.label}>
							<div className={`h-2 w-2 ${bucket.color}`} />
							<span className="font-mono text-[10px] text-muted-foreground">
								{bucket.label}: {bucket.count}
							</span>
						</div>
					))}
				</div>
			</div>

			{/* Connection stats */}
			<div className="grid grid-cols-2 gap-3">
				<div className="border border-border p-3">
					<span className="mb-1 block font-mono text-[9px] text-muted-foreground uppercase">
						Avg Fan-in (Depended By)
					</span>
					<span className="font-(family-name:--font-display) text-foreground text-lg">
						{summary.avgFanIn.toFixed(1)}
					</span>
				</div>
				<div className="border border-border p-3">
					<span className="mb-1 block font-mono text-[9px] text-muted-foreground uppercase">
						Avg Fan-out (Imports)
					</span>
					<span className="font-(family-name:--font-display) text-foreground text-lg">
						{summary.avgFanOut.toFixed(1)}
					</span>
				</div>
			</div>

			{/* Extremes */}
			{(summary.mostComplexFile || summary.mostConnectedFile) && (
				<div className="mt-4 space-y-2 border-border border-t pt-3">
					{summary.mostComplexFile && (
						<div className="flex items-center justify-between">
							<div className="min-w-0 flex-1">
								<span className="mb-0.5 block font-mono text-[9px] text-muted-foreground uppercase">
									Largest File
								</span>
								<span className="block truncate font-mono text-foreground text-xs">
									{summary.mostComplexFile.path.split("/").pop()}
								</span>
							</div>
							<span className="font-mono text-foreground text-sm tabular-nums">
								{summary.mostComplexFile.loc.toLocaleString()} LOC
							</span>
						</div>
					)}
					{summary.mostConnectedFile && (
						<div className="flex items-center justify-between">
							<div className="min-w-0 flex-1">
								<span className="mb-0.5 block font-mono text-[9px] text-muted-foreground uppercase">
									Most Connected
								</span>
								<span className="block truncate font-mono text-foreground text-xs">
									{summary.mostConnectedFile.path.split("/").pop()}
								</span>
							</div>
							<span className="font-mono text-foreground text-sm tabular-nums">
								{summary.mostConnectedFile.fanIn +
									summary.mostConnectedFile.fanOut}{" "}
								edges
							</span>
						</div>
					)}
				</div>
			)}
		</motion.div>
	);
});
