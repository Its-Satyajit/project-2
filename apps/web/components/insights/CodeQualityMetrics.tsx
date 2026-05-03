"use client";

import {
	AlertTriangle,
	BarChart3,
	FileCode,
	Network,
	TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";

interface CodeQualityMetricsProps {
	stats: {
		totalRepos: number;
		totalLines: number;
		totalFiles: number;
		totalDirectories: number;
		avgLinesPerRepo: number;
		avgFilesPerRepo: number;
		avgLocPerFile: number;
	};
}

interface MetricCard {
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
			return "text-emerald-500";
		case "warning":
			return "text-amber-500";
		case "critical":
			return "text-destructive";
		default:
			return "text-muted-foreground";
	}
}

export function CodeQualityMetrics({ stats }: CodeQualityMetricsProps) {
	const metrics: MetricCard[] = [
		{
			label: "Avg File Size",
			value: `${stats.avgLocPerFile.toLocaleString("en-US")} LOC`,
			description:
				stats.avgLocPerFile <= 200
					? "Healthy file sizes"
					: stats.avgLocPerFile <= 400
						? "Consider splitting large files"
						: "Files are quite large",
			status:
				stats.avgLocPerFile <= 200
					? "good"
					: stats.avgLocPerFile <= 400
						? "warning"
						: "critical",
			icon: FileCode,
		},
		{
			label: "Code Density",
			value: `${stats.avgFilesPerRepo.toLocaleString("en-US")} files/repo`,
			description:
				stats.avgFilesPerRepo <= 500
					? "Manageable repo sizes"
					: stats.avgFilesPerRepo <= 1000
						? "Moderate complexity"
						: "Large codebases",
			status:
				stats.avgFilesPerRepo <= 500
					? "good"
					: stats.avgFilesPerRepo <= 1000
						? "warning"
						: "critical",
			icon: BarChart3,
		},
		{
			label: "Repo Scale",
			value: `${stats.avgLinesPerRepo.toLocaleString("en-US")} LOC/repo`,
			description:
				stats.avgLinesPerRepo <= 50000
					? "Standard scale"
					: stats.avgLinesPerRepo <= 200000
						? "Enterprise scale"
						: "Massive codebase",
			status:
				stats.avgLinesPerRepo <= 50000
					? "good"
					: stats.avgLinesPerRepo <= 200000
						? "warning"
						: "critical",
			icon: TrendingUp,
		},
		{
			label: "Structure Depth",
			value: `${Math.round(stats.totalDirectories / Math.max(stats.totalRepos, 1))} dirs/repo`,
			description: "Average directory depth per repository",
			status: "good",
			icon: Network,
		},
	];

	return (
		<div className="p-6">
			<div className="mb-6 flex items-center gap-2">
				<AlertTriangle className="h-4 w-4 text-muted-foreground" />
				<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
					Code Quality Indicators
				</span>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{metrics.map((metric, index) => (
					<motion.div
						animate={{ opacity: 1, y: 0 }}
						className={`border p-4 ${getStatusColor(metric.status)}`}
						initial={{ opacity: 0, y: 10 }}
						key={metric.label}
						transition={{ delay: index * 0.05, duration: 0.3 }}
					>
						<div className="mb-3 flex items-center justify-between">
							<metric.icon
								className={`h-4 w-4 ${getStatusTextColor(metric.status)}`}
							/>
							<span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
								{metric.label}
							</span>
						</div>
						<div className="font-(family-name:--font-display) text-foreground text-xl">
							{metric.value}
						</div>
						<p className="mt-1 font-mono text-[10px] text-muted-foreground leading-relaxed">
							{metric.description}
						</p>
					</motion.div>
				))}
			</div>
		</div>
	);
}
