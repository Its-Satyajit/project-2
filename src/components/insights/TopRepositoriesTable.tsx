"use client";

import { ExternalLink, Star } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

interface TopRepositoriesTableProps {
	repos: Array<{
		id: string;
		owner: string;
		name: string;
		fullName: string;
		stars: number;
		forks: number;
		primaryLanguage: string | null;
		totalLines: number;
		totalFiles: number;
	}>;
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

export function TopRepositoriesTable({ repos }: TopRepositoriesTableProps) {
	return (
		<div className="p-6">
			<div className="mb-6 flex items-center gap-2">
				<Star className="h-4 w-4 text-muted-foreground" />
				<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
					Top Repositories
				</span>
			</div>

			<div className="space-y-0">
				{/* Header */}
				<div className="flex border-border border-b py-2 font-mono text-muted-foreground text-xs uppercase tracking-wider">
					<span className="w-8 text-center">#</span>
					<span className="flex-1">Repository</span>
					<span className="w-20 text-right">Stars</span>
					<span className="w-20 text-right">Forks</span>
					<span className="hidden w-24 text-right sm:block">Lines</span>
					<span className="hidden w-16 text-right md:block">Files</span>
					<span className="w-8" />
				</div>

				{/* Rows */}
				{repos.map((repo, index) => (
					<motion.div
						animate={{ opacity: 1, x: 0 }}
						className="flex items-center border-border border-b py-3 transition-colors last:border-b-0 hover:bg-muted/20"
						initial={{ opacity: 0, x: -10 }}
						key={repo.id}
						transition={{ delay: index * 0.04, duration: 0.3 }}
					>
						<span className="w-8 text-center font-mono text-muted-foreground text-xs tabular-nums">
							{index + 1}
						</span>
						<span className="min-w-0 flex-1">
							<Link
								className="flex items-center gap-1 truncate font-mono text-foreground text-sm transition-colors hover:text-accent"
								href={`/${repo.owner}/${repo.name}`}
							>
								<span className="truncate">{repo.fullName}</span>
							</Link>
						</span>
						<span className="w-20 text-right font-mono text-foreground text-sm tabular-nums">
							{formatNumber(repo.stars)}
						</span>
						<span className="w-20 text-right font-mono text-muted-foreground text-sm tabular-nums">
							{formatNumber(repo.forks)}
						</span>
						<span className="hidden w-24 text-right font-mono text-muted-foreground text-sm tabular-nums sm:block">
							{formatNumber(repo.totalLines)}
						</span>
						<span className="hidden w-16 text-right font-mono text-muted-foreground text-sm tabular-nums md:block">
							{formatNumber(repo.totalFiles)}
						</span>
						<Link
							className="w-8 text-muted-foreground transition-colors hover:text-foreground"
							href={`/${repo.owner}/${repo.name}`}
						>
							<ExternalLink className="h-3 w-3" />
						</Link>
					</motion.div>
				))}
			</div>
		</div>
	);
}
