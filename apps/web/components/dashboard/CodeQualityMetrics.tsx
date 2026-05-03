"use client";

import { GitBranch, GitMerge, Network, Unplug } from "lucide-react";
import { motion } from "motion/react";
import React, { useMemo } from "react";

interface Node {
	id: string;
	path: string;
	language: string;
	imports: number;
	loc?: number;
}

interface Edge {
	source: string;
	target: string;
}

interface HotspotDatum {
	path: string;
	language: string;
	fanIn: number;
	fanOut: number;
	loc: number;
	score: number;
	rank: number;
}

interface CodeQualityMetricsProps {
	nodes: Node[];
	edges: Edge[];
	hotspots: HotspotDatum[];
	totalFiles: number;
	totalLines: number;
}

interface MetricResult {
	label: string;
	value: string;
	description: string;
	status: "good" | "warning" | "critical";
	icon: React.ComponentType<{ className?: string }>;
}

function getStatusColor(status: string): string {
	switch (status) {
		case "good":
			return "border-emerald-500/30 bg-emerald-500/5";
		case "warning":
			return "border-amber-500/30 bg-amber-500/5";
		case "critical":
			return "border-destructive/30 bg-destructive/5";
		default:
			return "border-border bg-muted/20";
	}
}

function getStatusTextColor(status: string): string {
	switch (status) {
		case "good":
			return "text-emerald-400";
		case "warning":
			return "text-amber-400";
		case "critical":
			return "text-destructive";
		default:
			return "text-foreground";
	}
}

export const CodeQualityMetrics = React.memo(function CodeQualityMetrics({
	nodes,
	edges,
	hotspots,
	totalFiles,
	totalLines: _totalLines,
}: CodeQualityMetricsProps) {
	const metrics = useMemo(() => {
		const results: MetricResult[] = [];

		// 1. Average imports per file
		const totalImports = nodes.reduce((sum, n) => sum + n.imports, 0);
		const avgImports = nodes.length > 0 ? totalImports / nodes.length : 0;
		const avgImportsStatus =
			avgImports < 3 ? "good" : avgImports < 8 ? "warning" : "critical";
		results.push({
			label: "Avg Imports/File",
			value: avgImports.toFixed(1),
			description:
				avgImports < 3
					? "Low coupling"
					: avgImports < 8
						? "Moderate coupling"
						: "High coupling",
			status: avgImportsStatus,
			icon: GitBranch,
		});

		// 2. Dependency ratio (edges / nodes)
		const depRatio = nodes.length > 0 ? edges.length / nodes.length : 0;
		const depRatioStatus =
			depRatio < 1.5 ? "good" : depRatio < 3 ? "warning" : "critical";
		results.push({
			label: "Dependency Ratio",
			value: depRatio.toFixed(2),
			description:
				depRatio < 1.5
					? "Sparse dependencies"
					: depRatio < 3
						? "Normal density"
						: "Dense graph",
			status: depRatioStatus,
			icon: Network,
		});

		// 3. Average LOC per file
		const filesWithLoc = nodes.filter((n) => n.loc && n.loc > 0);
		const avgLoc =
			filesWithLoc.length > 0
				? filesWithLoc.reduce((sum, n) => sum + (n.loc || 0), 0) /
					filesWithLoc.length
				: 0;
		const avgLocStatus =
			avgLoc < 150 ? "good" : avgLoc < 300 ? "warning" : "critical";
		results.push({
			label: "Avg LOC/File",
			value: Math.round(avgLoc).toLocaleString(),
			description:
				avgLoc < 150
					? "Compact files"
					: avgLoc < 300
						? "Moderate size"
						: "Large files",
			status: avgLocStatus,
			icon: GitMerge,
		});

		// 4. Hotspot percentage
		const criticalHotspots = hotspots.filter((h) => h.score >= 0.7).length;
		const warningHotspots = hotspots.filter(
			(h) => h.score >= 0.4 && h.score < 0.7,
		).length;
		const hotspotPct =
			totalFiles > 0
				? ((criticalHotspots + warningHotspots) / totalFiles) * 100
				: 0;
		const hotspotStatus =
			hotspotPct < 5 ? "good" : hotspotPct < 15 ? "warning" : "critical";
		results.push({
			label: "Risk Files",
			value: `${hotspotPct.toFixed(1)}%`,
			description: `${criticalHotspots} critical, ${warningHotspots} warning`,
			status: hotspotStatus,
			icon: Unplug,
		});

		return results;
	}, [nodes, edges, hotspots, totalFiles]);

	return (
		<motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 10 }}>
			{/* Header */}
			<div className="mb-4 flex items-center justify-between">
				<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
					Code Quality Metrics
				</span>
				<span className="font-mono text-muted-foreground text-xs">
					Computed
				</span>
			</div>

			{/* Metrics Grid */}
			<div className="grid grid-cols-2 gap-3">
				{metrics.map((metric, index) => (
					<motion.div
						animate={{ opacity: 1 }}
						className={`border p-4 ${getStatusColor(metric.status)}`}
						initial={{ opacity: 0 }}
						key={metric.label}
						transition={{ delay: index * 0.05 }}
					>
						<div className="mb-2 flex items-center justify-between">
							<metric.icon className="h-3.5 w-3.5 text-muted-foreground" />
							<span
								className={`font-(family-name:--font-display) text-xl ${getStatusTextColor(metric.status)}`}
							>
								{metric.value}
							</span>
						</div>
						<span className="mb-1 block font-mono text-foreground text-xs">
							{metric.label}
						</span>
						<span className="font-mono text-[10px] text-muted-foreground">
							{metric.description}
						</span>
					</motion.div>
				))}
			</div>

			{/* Summary bar */}
			<div className="mt-4 border-border border-t pt-3">
				<div className="flex items-center gap-2">
					<span className="font-mono text-[9px] text-muted-foreground uppercase">
						Overall Health
					</span>
					<div className="flex-1">
						<div className="h-1.5 w-full bg-border">
							<div
								className="h-full bg-emerald-500"
								style={{
									width: `${Math.min(100, 75 - (hotspots.filter((h) => h.score >= 0.7).length / Math.max(1, totalFiles)) * 100)}%`,
								}}
							/>
						</div>
					</div>
				</div>
			</div>
		</motion.div>
	);
});
