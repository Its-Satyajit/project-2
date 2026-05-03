"use client";

import {
	BarChart3,
	FileCode,
	FolderTree,
	GitFork,
	Hash,
	LineChart,
	Network,
	Users,
} from "lucide-react";
import { motion } from "motion/react";

interface InsightsHeroProps {
	stats: {
		totalRepos: number;
		totalLines: number;
		totalFiles: number;
		totalDirectories: number;
		totalContributors: number;
		avgLinesPerRepo: number;
		avgFilesPerRepo: number;
		avgLocPerFile: number;
	};
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

const primaryStats = [
	{ key: "totalRepos", label: "Repositories", icon: GitFork },
	{ key: "totalLines", label: "Lines of Code", icon: LineChart },
	{ key: "totalFiles", label: "Files Analyzed", icon: FileCode },
	{ key: "totalDirectories", label: "Directories", icon: FolderTree },
	{ key: "totalContributors", label: "Contributors", icon: Users },
] as const;

const derivedStats = [
	{ key: "avgLinesPerRepo", label: "Avg Lines/Repo", icon: BarChart3 },
	{ key: "avgFilesPerRepo", label: "Avg Files/Repo", icon: Hash },
	{ key: "avgLocPerFile", label: "Avg LOC/File", icon: Network },
] as const;

export function InsightsHero({ stats: statsData }: InsightsHeroProps) {
	return (
		<div>
			{/* Primary Stats */}
			<div className="grid grid-cols-2 gap-0 md:grid-cols-5">
				{primaryStats.map((stat, index) => {
					const value = statsData[stat.key as keyof typeof statsData] || 0;
					return (
						<motion.div
							animate={{ opacity: 1, y: 0 }}
							className="border-border border-r border-b p-6 last:border-r-0"
							initial={{ opacity: 0, y: 20 }}
							key={stat.key}
							transition={{
								delay: index * 0.08,
								duration: 0.4,
								ease: "easeOut",
							}}
						>
							<div className="mb-3 flex items-center gap-2">
								<stat.icon className="h-4 w-4 text-muted-foreground" />
								<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
									{stat.label}
								</span>
							</div>
							<span className="font-(family-name:--font-display) text-3xl text-foreground md:text-4xl">
								{formatNumber(value)}
							</span>
						</motion.div>
					);
				})}
			</div>

			{/* Derived/Average Stats */}
			<div className="grid grid-cols-1 gap-0 sm:grid-cols-3">
				{derivedStats.map((stat, index) => {
					const value = statsData[stat.key as keyof typeof statsData] || 0;
					return (
						<motion.div
							animate={{ opacity: 1, y: 0 }}
							className="flex items-center justify-between border-border border-b p-4 last:border-b-0 sm:border-r sm:last:border-r-0"
							initial={{ opacity: 0, y: 10 }}
							key={stat.key}
							transition={{ delay: 0.4 + index * 0.05, duration: 0.3 }}
						>
							<div className="flex items-center gap-2">
								<stat.icon className="h-3 w-3 text-muted-foreground/50" />
								<span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
									{stat.label}
								</span>
							</div>
							<span className="font-(family-name:--font-display) text-foreground text-xl">
								{formatNumber(value)}
							</span>
						</motion.div>
					);
				})}
			</div>
		</div>
	);
}
