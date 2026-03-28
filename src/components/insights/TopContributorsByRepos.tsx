"use client";

import { GitPullRequest, Users } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";

interface TopContributorsByReposProps {
	contributors: Array<{
		githubLogin: string;
		avatarUrl: string | null;
		repoCount: number;
		totalContributions: number;
	}>;
}

function formatNumber(num: number): string {
	if (num >= 1000) {
		return `${(num / 1000).toFixed(1)}K`;
	}
	return num.toLocaleString("en-US");
}

export function TopContributorsByRepos({
	contributors,
}: TopContributorsByReposProps) {
	const maxRepos = Math.max(...contributors.map((c) => c.repoCount), 1);

	return (
		<div className="p-6">
			<div className="mb-6 flex items-center gap-2">
				<Users className="h-4 w-4 text-muted-foreground" />
				<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
					Most Active Across Repos
				</span>
			</div>

			<div className="space-y-3">
				{contributors.slice(0, 8).map((contributor, index) => {
					const percentage = (contributor.repoCount / maxRepos) * 100;
					return (
						<motion.div
							animate={{ opacity: 1, x: 0 }}
							className="flex items-center gap-3"
							initial={{ opacity: 0, x: -20 }}
							key={contributor.githubLogin}
							transition={{ delay: index * 0.04, duration: 0.3 }}
						>
							<span className="w-5 text-right font-mono text-muted-foreground text-xs tabular-nums">
								{index + 1}
							</span>
							{contributor.avatarUrl ? (
								<Image
									alt={contributor.githubLogin}
									className="shrink-0 rounded-full"
									height={28}
									src={contributor.avatarUrl}
									width={28}
								/>
							) : (
								<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
									<GitBranch className="h-3 w-3 text-muted-foreground" />
								</div>
							)}
							<div className="min-w-0 flex-1">
								<span className="block truncate font-mono text-foreground text-sm">
									{contributor.githubLogin}
								</span>
								<span className="font-mono text-[10px] text-muted-foreground">
									{formatNumber(contributor.totalContributions)} contributions
								</span>
							</div>
							<div className="shrink-0 text-right">
								<span className="font-medium font-mono text-foreground text-sm tabular-nums">
									{contributor.repoCount}
								</span>
								<span className="block font-mono text-[10px] text-muted-foreground">
									repos
								</span>
							</div>
						</motion.div>
					);
				})}
			</div>

			{/* Visual bar representation */}
			<div className="mt-6 border-border border-t pt-4">
				<span className="mb-3 block font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
					Repo Distribution
				</span>
				{contributors.slice(0, 5).map((contributor, index) => {
					const percentage = (contributor.repoCount / maxRepos) * 100;
					return (
						<motion.div
							animate={{ opacity: 1 }}
							className="mb-2 flex items-center gap-2"
							initial={{ opacity: 0 }}
							key={`${contributor.githubLogin}-bar`}
							transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
						>
							<span className="w-20 truncate font-mono text-[10px] text-muted-foreground">
								{contributor.githubLogin}
							</span>
							<div className="h-3 flex-1 bg-muted/30">
								<motion.div
									animate={{ width: `${percentage}%` }}
									className="h-full bg-accent"
									initial={{ width: 0 }}
									transition={{
										delay: 0.4 + index * 0.05,
										duration: 0.5,
										ease: "easeOut",
									}}
								/>
							</div>
							<span className="w-8 text-right font-mono text-[10px] text-muted-foreground tabular-nums">
								{contributor.repoCount}
							</span>
						</motion.div>
					);
				})}
			</div>
		</div>
	);
}

// Need to import GitBranch for fallback avatar
import { GitBranch } from "lucide-react";
