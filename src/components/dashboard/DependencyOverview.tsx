"use client";

import { GitBranch, GitMerge, Network, Unplug } from "lucide-react";
import { motion } from "motion/react";
import React from "react";

interface DependencyOverviewProps {
	totalNodes: number;
	totalEdges: number;
	unresolvedImports: number;
	languageBreakdown?: Record<string, number>;
}

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.06,
		},
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 10 },
	visible: { opacity: 1, y: 0 },
};

interface StatItem {
	label: string;
	value: number | string;
	icon: React.ComponentType<{ className?: string }>;
	iconColor: string;
}

export const DependencyOverview = React.memo(function DependencyOverview({
	totalNodes,
	totalEdges,
	unresolvedImports,
	languageBreakdown,
}: DependencyOverviewProps) {
	const languageCount = languageBreakdown
		? Object.keys(languageBreakdown).length
		: 0;

	const stats: StatItem[] = [
		{
			label: "Files",
			value: totalNodes,
			icon: GitBranch,
			iconColor: "text-primary",
		},
		{
			label: "Connections",
			value: totalEdges,
			icon: Network,
			iconColor: "text-accent",
		},
		{
			label: "Languages",
			value: languageCount,
			icon: GitMerge,
			iconColor: "text-blue-400",
		},
		{
			label: "Unresolved",
			value: unresolvedImports,
			icon: Unplug,
			iconColor:
				unresolvedImports > 0 ? "text-amber-400" : "text-muted-foreground",
		},
	];

	return (
		<motion.div animate="visible" initial="hidden" variants={containerVariants}>
			{/* Header */}
			<motion.div className="mb-4" variants={itemVariants}>
				<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
					Dependency Graph
				</span>
			</motion.div>

			{/* Stats grid */}
			<div className="grid grid-cols-2 gap-0 sm:grid-cols-4">
				{stats.map((stat, index) => (
					<motion.div
						animate="visible"
						className="border-border border-r p-4 text-center last:border-r-0"
						initial="hidden"
						key={stat.label}
						style={{ animationDelay: `${index * 0.05}s` }}
						variants={itemVariants}
					>
						<div className="mb-2 flex justify-center">
							<stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
						</div>
						<span className="font-(family-name:--font-display) block text-2xl text-foreground">
							{typeof stat.value === "number"
								? stat.value.toLocaleString()
								: stat.value}
						</span>
						<span className="mt-1 block font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
							{stat.label}
						</span>
					</motion.div>
				))}
			</div>

			{/* Language breakdown mini */}
			{languageBreakdown && Object.keys(languageBreakdown).length > 0 && (
				<motion.div
					className="mt-4 border-border border-t pt-4"
					variants={itemVariants}
				>
					<span className="mb-2 block font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
						Language Distribution
					</span>
					<div className="flex flex-wrap gap-2">
						{Object.entries(languageBreakdown)
							.sort(([, a], [, b]) => b - a)
							.map(([lang, count]) => {
								const total = Object.values(languageBreakdown).reduce(
									(a, b) => a + b,
									0,
								);
								const percentage = total > 0 ? (count / total) * 100 : 0;
								return (
									<div
										className="flex items-center gap-1.5 border border-border px-2 py-1"
										key={lang}
									>
										<span className="font-mono text-foreground text-xs">
											{lang}
										</span>
										<span className="font-mono text-muted-foreground text-xs tabular-nums">
											{percentage.toFixed(0)}%
										</span>
									</div>
								);
							})}
					</div>
				</motion.div>
			)}
		</motion.div>
	);
});
