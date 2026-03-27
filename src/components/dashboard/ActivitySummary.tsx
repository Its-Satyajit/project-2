"use client";

import { Calendar, Clock, GitCommit, Info, User } from "lucide-react";
import { motion } from "motion/react";
import React, { useMemo } from "react";

interface Commit {
	sha: string;
	message: string;
	authorName: string;
	committedAt: string;
}

interface ActivitySummaryProps {
	commits: Commit[];
	sampleSize?: number;
}

interface AuthorStats {
	name: string;
	count: number;
	percentage: number;
}

function formatRelativeTime(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays < 1) return "today";
	if (diffDays === 1) return "yesterday";
	if (diffDays < 7) return `${diffDays} days ago`;
	if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
	if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
	return `${Math.floor(diffDays / 365)} years ago`;
}

function getDateRange(
	commits: Commit[],
): { newest: string; oldest: string } | null {
	if (commits.length === 0) return null;
	const dates = commits.map((c) => new Date(c.committedAt).getTime());
	const newest = new Date(Math.max(...dates)).toISOString();
	const oldest = new Date(Math.min(...dates)).toISOString();
	return { newest, oldest };
}

function getCommitFrequency(commits: Commit[]): string {
	if (commits.length < 2) return "N/A";
	const dates = commits.map((c) => new Date(c.committedAt).getTime());
	const newest = Math.max(...dates);
	const oldest = Math.min(...dates);
	const diffDays = (newest - oldest) / (1000 * 60 * 60 * 24);
	if (diffDays < 1) return "Multiple/day";
	const avgDaysBetween = diffDays / (commits.length - 1);
	if (avgDaysBetween < 1) return "Multiple/day";
	if (avgDaysBetween < 7) return `${avgDaysBetween.toFixed(1)} days/commit`;
	if (avgDaysBetween < 30)
		return `${(avgDaysBetween / 7).toFixed(1)} weeks/commit`;
	return `${(avgDaysBetween / 30).toFixed(1)} months/commit`;
}

export const ActivitySummary = React.memo(function ActivitySummary({
	commits,
	sampleSize = 100,
}: ActivitySummaryProps) {
	const summary = useMemo(() => {
		if (!commits || commits.length === 0) {
			return {
				totalCommits: 0,
				uniqueAuthors: 0,
				topAuthors: [] as AuthorStats[],
				dateRange: null as { newest: string; oldest: string } | null,
				frequency: "N/A",
			};
		}

		// Count commits per author
		const authorCounts = new Map<string, number>();
		for (const commit of commits) {
			authorCounts.set(
				commit.authorName,
				(authorCounts.get(commit.authorName) || 0) + 1,
			);
		}

		// Convert to sorted array
		const topAuthors: AuthorStats[] = Array.from(authorCounts.entries())
			.map(([name, count]) => ({
				name,
				count,
				percentage: (count / commits.length) * 100,
			}))
			.sort((a, b) => b.count - a.count)
			.slice(0, 5);

		// Find dates
		const dateRange = getDateRange(commits);
		const frequency = getCommitFrequency(commits);

		return {
			totalCommits: commits.length,
			uniqueAuthors: authorCounts.size,
			topAuthors,
			dateRange,
			frequency,
		};
	}, [commits]);

	if (!commits || commits.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-8">
				<GitCommit className="mb-3 h-8 w-8 text-muted-foreground/30" />
				<p className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
					No commit data
				</p>
			</div>
		);
	}

	return (
		<motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 10 }}>
			{/* Header with sample notice */}
			<div className="mb-4 flex items-center justify-between">
				<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
					Recent Activity
				</span>
				<div className="flex items-center gap-1.5">
					<Info className="h-3 w-3 text-muted-foreground" />
					<span className="font-mono text-[10px] text-muted-foreground">
						Last {sampleSize} commits
					</span>
				</div>
			</div>

			{/* Stats row */}
			<div className="mb-4 grid grid-cols-3 gap-3">
				<div className="border border-border p-3 text-center">
					<GitCommit className="mx-auto mb-1 h-3.5 w-3.5 text-muted-foreground" />
					<span className="font-(family-name:--font-display) mb-0.5 block text-foreground text-xl">
						{summary.totalCommits}
					</span>
					<span className="font-mono text-[9px] text-muted-foreground uppercase">
						Sampled
					</span>
				</div>
				<div className="border border-border p-3 text-center">
					<User className="mx-auto mb-1 h-3.5 w-3.5 text-muted-foreground" />
					<span className="font-(family-name:--font-display) mb-0.5 block text-foreground text-xl">
						{summary.uniqueAuthors}
					</span>
					<span className="font-mono text-[9px] text-muted-foreground uppercase">
						Authors
					</span>
				</div>
				<div className="border border-border p-3 text-center">
					<Clock className="mx-auto mb-1 h-3.5 w-3.5 text-muted-foreground" />
					<span className="mb-0.5 block font-mono text-foreground text-sm">
						{summary.frequency}
					</span>
					<span className="font-mono text-[9px] text-muted-foreground uppercase">
						Frequency
					</span>
				</div>
			</div>

			{/* Date range - clearly labeled as sample range */}
			{summary.dateRange && (
				<div className="mb-4 border border-border p-3">
					<div className="mb-2">
						<span className="font-mono text-[9px] text-muted-foreground uppercase">
							Sample Date Range
						</span>
					</div>
					<div className="flex items-center justify-between">
						<div>
							<span className="mb-0.5 block font-mono text-[9px] text-muted-foreground uppercase">
								Oldest in Sample
							</span>
							<span className="font-mono text-foreground text-xs">
								{formatRelativeTime(summary.dateRange.oldest)}
							</span>
						</div>
						<div className="mx-3 h-px flex-1 bg-border" />
						<div className="text-right">
							<span className="mb-0.5 block font-mono text-[9px] text-muted-foreground uppercase">
								Most Recent
							</span>
							<span className="font-mono text-foreground text-xs">
								{formatRelativeTime(summary.dateRange.newest)}
							</span>
						</div>
					</div>
				</div>
			)}

			{/* Top authors in sample */}
			{summary.topAuthors.length > 0 && (
				<div className="border-border border-t pt-3">
					<span className="mb-2 block font-mono text-[9px] text-muted-foreground uppercase">
						Most Active (in sample)
					</span>
					<div className="space-y-2">
						{summary.topAuthors.map((author, index) => (
							<motion.div
								animate={{ opacity: 1, x: 0 }}
								className="flex items-center gap-3"
								initial={{ opacity: 0, x: -10 }}
								key={author.name}
								transition={{ delay: index * 0.05 }}
							>
								<div className="flex h-6 w-6 shrink-0 items-center justify-center border border-border bg-secondary font-mono text-[10px] text-muted-foreground">
									{author.name.charAt(0).toUpperCase()}
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex items-center justify-between">
										<span className="truncate font-mono text-foreground text-xs">
											{author.name}
										</span>
										<span className="font-mono text-muted-foreground text-xs tabular-nums">
											{author.count} ({author.percentage.toFixed(0)}%)
										</span>
									</div>
									<div className="mt-1 h-1 w-full bg-border">
										<motion.div
											animate={{ width: `${author.percentage}%` }}
											className="h-full bg-primary"
											initial={{ width: 0 }}
											transition={{ delay: index * 0.1, duration: 0.3 }}
										/>
									</div>
								</div>
							</motion.div>
						))}
					</div>
					<p className="mt-3 font-mono text-[9px] text-muted-foreground">
						Percentages based on sampled commits only
					</p>
				</div>
			)}
		</motion.div>
	);
});
