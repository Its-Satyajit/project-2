"use client";

import { GitBranch, Users } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";

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
	return (
		<div className="p-6">
			<div className="mb-6 flex items-center gap-2">
				<Users className="h-4 w-4 text-muted-foreground" />
				<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
					Top Contributors
				</span>
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
				{contributors.map((contributor, index) => (
					<motion.div
						animate={{ opacity: 1, x: 0 }}
						className="flex items-center border-border border-b py-3 transition-colors last:border-b-0 hover:bg-muted/20"
						initial={{ opacity: 0, x: -10 }}
						key={contributor.id}
						transition={{ delay: index * 0.03, duration: 0.3 }}
					>
						<span className="w-8 text-center font-mono text-muted-foreground text-xs tabular-nums">
							{index + 1}
						</span>
						<span className="w-10 shrink-0">
							{contributor.avatarUrl ? (
								<Image
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
					</motion.div>
				))}
			</div>
		</div>
	);
}
