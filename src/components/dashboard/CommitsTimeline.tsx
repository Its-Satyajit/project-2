"use client";

import { GitCommit, Info, User } from "lucide-react";
import { motion } from "motion/react";
import React, { useMemo } from "react";

interface Commit {
	sha: string;
	message: string;
	authorName: string;
	committedAt: string;
}

interface CommitsTimelineProps {
	commits: Commit[];
	maxVisible?: number;
	sampleSize?: number;
}

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.05,
		},
	},
};

const itemVariants = {
	hidden: { opacity: 0, x: -10 },
	visible: { opacity: 1, x: 0 },
};

function formatRelativeTime(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMinutes = Math.floor(diffMs / (1000 * 60));
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffMinutes < 1) return "just now";
	if (diffMinutes < 60) return `${diffMinutes}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;
	if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
	return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function truncateMessage(message: string, maxLength = 60): string {
	const firstLine = message.split("\n")[0] ?? message;
	if (firstLine.length <= maxLength) return firstLine;
	return firstLine.slice(0, maxLength - 1) + "…";
}

function formatSha(sha: string): string {
	return sha.slice(0, 7);
}

export const CommitsTimeline = React.memo(function CommitsTimeline({
	commits,
	maxVisible = 8,
	sampleSize = 100,
}: CommitsTimelineProps) {
	const visibleCommits = useMemo(() => {
		return commits.slice(0, maxVisible);
	}, [commits, maxVisible]);

	if (!commits || commits.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-8">
				<GitCommit className="mb-3 h-8 w-8 text-muted-foreground/30" />
				<p className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
					No commits available
				</p>
			</div>
		);
	}

	return (
		<motion.div
			animate="visible"
			className="relative"
			initial="hidden"
			variants={containerVariants}
		>
			{/* Header */}
			<div className="mb-4 flex items-center justify-between">
				<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
					Recent Commits
				</span>
				<div className="flex items-center gap-1.5">
					<Info className="h-3 w-3 text-muted-foreground" />
					<span className="font-mono text-[10px] text-muted-foreground">
						Last {sampleSize}
					</span>
				</div>
			</div>

			{/* Timeline */}
			<div className="relative">
				{/* Vertical line */}
				<div className="absolute top-2 bottom-2 left-[11px] w-px bg-border" />

				{/* Commits */}
				<div className="space-y-0">
					{visibleCommits.map((commit, index) => (
						<motion.div
							animate="visible"
							className="group relative flex gap-4 py-2.5"
							initial="hidden"
							key={commit.sha}
							variants={itemVariants}
						>
							{/* Timeline dot */}
							<div className="relative z-10 shrink-0">
								<div
									className={`flex h-6 w-6 items-center justify-center border ${
										index === 0
											? "border-accent bg-accent/10"
											: "border-border bg-background"
									}`}
								>
									<GitCommit
										className={`h-3 w-3 ${index === 0 ? "text-accent" : "text-muted-foreground"}`}
									/>
								</div>
							</div>

							{/* Content */}
							<div className="min-w-0 flex-1">
								<div className="flex items-baseline justify-between gap-2">
									<p className="truncate font-mono text-foreground text-sm group-hover:text-accent">
										{truncateMessage(commit.message)}
									</p>
									<span className="shrink-0 font-mono text-muted-foreground text-xs">
										{formatRelativeTime(commit.committedAt)}
									</span>
								</div>
								<div className="mt-1 flex items-center gap-3">
									<div className="flex items-center gap-1.5">
										<User className="h-3 w-3 text-muted-foreground" />
										<span className="font-mono text-muted-foreground text-xs">
											{commit.authorName}
										</span>
									</div>
									<span className="border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
										{formatSha(commit.sha)}
									</span>
								</div>
							</div>
						</motion.div>
					))}
				</div>

				{/* Show more indicator */}
				{commits.length > maxVisible && (
					<div className="flex items-center justify-center border-border border-t pt-3">
						<span className="font-mono text-muted-foreground text-xs">
							+{commits.length - maxVisible} more commits
						</span>
					</div>
				)}
			</div>
		</motion.div>
	);
});
