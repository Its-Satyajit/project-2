"use client";

import { BarChart3, Database, GitFork, GitGraph, Users } from "lucide-react";
import { motion } from "motion/react";

interface InsightsHeroHeaderProps {
	totalRepos: number;
	totalContributors: number;
	totalFiles: number;
	totalLines: number;
}

function formatNumber(num: number): string {
	if (num >= 1_000_000) {
		return `${(num / 1_000_000).toFixed(1)}M`;
	}
	if (num >= 1_000) {
		return `${(num / 1_000).toFixed(1)}K`;
	}
	return num.toLocaleString("en-US");
}

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.08,
			delayChildren: 0.1,
		},
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 12 },
	visible: { opacity: 1, y: 0 },
};

export function InsightsHeroHeader({
	totalRepos,
	totalContributors,
	totalFiles,
	totalLines,
}: InsightsHeroHeaderProps) {
	return (
		<motion.div
			animate="visible"
			className="border-border border-b"
			initial="hidden"
			variants={containerVariants}
		>
			<div className="flex flex-col gap-6 py-8 lg:flex-row lg:items-start lg:justify-between">
				{/* Main info */}
				<motion.div className="min-w-0 flex-1" variants={itemVariants}>
					<div className="flex items-start gap-4">
						{/* Icon */}
						<div className="shrink-0">
							<div className="flex h-14 w-14 items-center justify-center border border-border bg-secondary">
								<BarChart3 className="h-6 w-6 text-foreground" />
							</div>
						</div>

						{/* Title and description */}
						<div className="min-w-0 flex-1">
							<h1 className="font-(family-name:--font-display) text-2xl text-foreground tracking-tight md:text-3xl">
								Global Repository Insights
							</h1>

							<p className="mt-2 max-w-2xl font-sans text-muted-foreground text-sm leading-relaxed">
								Aggregated statistics and analytics across all analyzed
								repositories. Track language trends, contributor activity, and
								codebase health metrics.
							</p>

							{/* Metadata strip */}
							<div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
								<div className="flex items-center gap-1.5">
									<GitGraph className="h-3 w-3 text-muted-foreground" />
									<span className="font-mono text-muted-foreground">
										{totalRepos.toLocaleString("en-US")} Repositories
									</span>
								</div>

								<span className="text-border">|</span>

								<div className="flex items-center gap-1.5">
									<Users className="h-3 w-3 text-muted-foreground" />
									<span className="font-mono text-muted-foreground">
										{totalContributors.toLocaleString("en-US")} Contributors
									</span>
								</div>

								<span className="text-border">|</span>

								<div className="flex items-center gap-1.5">
									<Database className="h-3 w-3 text-muted-foreground" />
									<span className="font-mono text-muted-foreground">
										{formatNumber(totalLines)} Lines of Code
									</span>
								</div>

								<span className="text-border">|</span>

								<span className="font-mono text-muted-foreground/60 text-xs">
									24h cache
								</span>
							</div>
						</div>
					</div>
				</motion.div>

				{/* Stats */}
				<motion.div
					className="flex items-center gap-6 lg:shrink-0 lg:pt-2"
					variants={itemVariants}
				>
					{/* Repos */}
					<div className="flex flex-col items-center gap-0.5">
						<div className="flex items-center gap-1.5">
							<GitFork className="h-4 w-4 text-accent" />
							<span className="font-(family-name:--font-display) text-foreground text-xl">
								{formatNumber(totalRepos)}
							</span>
						</div>
						<span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
							Repos
						</span>
					</div>

					{/* Files */}
					<div className="flex flex-col items-center gap-0.5">
						<div className="flex items-center gap-1.5">
							<span className="font-(family-name:--font-display) text-foreground text-xl">
								{formatNumber(totalFiles)}
							</span>
						</div>
						<span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
							Files
						</span>
					</div>

					{/* Contributors */}
					<div className="flex flex-col items-center gap-0.5">
						<div className="flex items-center gap-1.5">
							<span className="font-(family-name:--font-display) text-foreground text-xl">
								{formatNumber(totalContributors)}
							</span>
						</div>
						<span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
							Contributors
						</span>
					</div>
				</motion.div>
			</div>
		</motion.div>
	);
}
