"use client";

import { GitBranch, Users } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { FallbackImage } from "~/components/FallbackImage";

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
	const [showBots, setShowBots] = useState(false);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const getDisplayedContributors = () => {
		const max = 15;
		if (showBots) return contributors.slice(0, max);
		const filtered = contributors.filter(
			(c) => !c.githubLogin.toLowerCase().includes("[bot]"),
		);
		if (filtered.length >= max) return filtered.slice(0, max);
		const botCount = max - filtered.length;
		const bots = contributors.filter((c) =>
			c.githubLogin.toLowerCase().includes("[bot]"),
		);
		return [...filtered, ...bots.slice(0, botCount)];
	};

	const displayedContributors = getDisplayedContributors();

	const maxRepos = Math.max(
		...displayedContributors.map((c) => c.repoCount),
		1,
	);

	return (
		<div className="p-6">
			<div className="mb-6 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Users className="h-4 w-4 text-muted-foreground" />
					<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
						Most Active Across Repos
					</span>
				</div>
				<button
					className="font-mono text-[10px] text-muted-foreground underline transition-colors hover:text-foreground"
					onClick={() => setShowBots(!showBots)}
					type="button"
				>
					{showBots ? "Hide bots" : "Show bots"}
				</button>
			</div>

			<div className="space-y-3">
				{displayedContributors.map((contributor, index) => {
					const percentage = (contributor.repoCount / maxRepos) * 100;
					return (
						<div
							className="flex items-center gap-3"
							key={contributor.githubLogin}
							style={mounted ? undefined : { opacity: 1 }}
						>
							<span className="w-5 text-right font-mono text-muted-foreground text-xs tabular-nums">
								{index + 1}
							</span>
							{contributor.avatarUrl ? (
								<FallbackImage
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
						</div>
					);
				})}
			</div>

			<div className="mt-6 border-border border-t pt-4">
				<span className="mb-3 block font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
					Repo Distribution
				</span>
				{displayedContributors.slice(0, 5).map((contributor, index) => {
					const percentage = (contributor.repoCount / maxRepos) * 100;
					return (
						<div
							className="mb-2 flex items-center gap-2"
							key={`${contributor.githubLogin}-bar`}
							style={mounted ? undefined : { opacity: 1 }}
						>
							<span className="w-20 truncate font-mono text-[10px] text-muted-foreground">
								{contributor.githubLogin}
							</span>
							<div className="h-3 flex-1 bg-muted/30">
								<div
									className="h-full bg-accent"
									style={
										mounted
											? { width: `${percentage}%` }
											: { width: `${percentage}%` }
									}
								/>
							</div>
							<span className="w-8 text-right font-mono text-[10px] text-muted-foreground tabular-nums">
								{contributor.repoCount}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}
