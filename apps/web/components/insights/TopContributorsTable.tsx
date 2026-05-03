"use client";

import { GitBranch, Users } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { FallbackImage } from "~/components/FallbackImage";

interface TopContributorsTableProps {
	contributors: Array<{
		id: string;
		githubLogin: string;
		avatarUrl: string | null;
		totalContributions: number;
		repoCount: number;
	}>;
}

function formatNumber(num: number): string {
	if (num >= 1_000) {
		return `${(num / 1_000).toFixed(1)}K`;
	}
	return num.toLocaleString("en-US");
}

export function TopContributorsTable({
	contributors,
}: TopContributorsTableProps) {
	const [showBots, setShowBots] = useState(false);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const getDisplayedContributors = () => {
		if (showBots) return contributors.slice(0, 20);
		const filtered = contributors.filter(
			(c) => !c.githubLogin.toLowerCase().includes("[bot]"),
		);
		const botCount = 20 - filtered.length;
		if (botCount <= 0) return filtered.slice(0, 20);
		const bots = contributors.filter((c) =>
			c.githubLogin.toLowerCase().includes("[bot]"),
		);
		return [...filtered, ...bots.slice(0, botCount)].slice(0, 20);
	};

	const displayedContributors = getDisplayedContributors();

	return (
		<div className="p-6">
			<div className="mb-6 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Users className="h-4 w-4 text-muted-foreground" />
					<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
						Top Contributors
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

			<div className="space-y-0">
				{/* Header */}
				<div className="flex border-border border-b py-2 font-mono text-muted-foreground text-xs uppercase tracking-wider">
					<span className="w-8 text-center">#</span>
					<span className="w-10" />
					<span className="flex-1">Contributor</span>
					<span className="w-24 text-right">Contributions</span>
					<span className="hidden w-20 text-right sm:block">Repos</span>
				</div>

				{/* Rows */}
				{displayedContributors.map((contributor, index) => (
					<div
						className="flex items-center border-border border-b py-3 transition-colors last:border-b-0 hover:bg-muted/20"
						key={contributor.id}
						style={mounted ? undefined : { opacity: 1 }}
					>
						<span className="w-8 text-center font-mono text-muted-foreground text-xs tabular-nums">
							{index + 1}
						</span>
						<span className="w-10 shrink-0">
							{contributor.avatarUrl ? (
								<FallbackImage
									alt={contributor.githubLogin}
									className="rounded-full"
									height={28}
									src={contributor.avatarUrl}
									width={28}
								/>
							) : (
								<div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
									<GitBranch className="h-3 w-3 text-muted-foreground" />
								</div>
							)}
						</span>
						<span className="min-w-0 flex-1 truncate pl-3 font-mono text-foreground text-sm">
							{contributor.githubLogin}
						</span>
						<span className="w-24 text-right font-mono text-foreground text-sm tabular-nums">
							{formatNumber(contributor.totalContributions)}
						</span>
						<span className="hidden w-20 text-right font-mono text-muted-foreground text-sm tabular-nums sm:block">
							{contributor.repoCount}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
