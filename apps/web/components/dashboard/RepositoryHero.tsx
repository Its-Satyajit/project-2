"use client";

import { SiGithub } from "@icons-pack/react-simple-icons";
import {
	Calendar,
	Check,
	ExternalLink,
	FileCode,
	GitBranch,
	GitFork,
	Lock,
	Shield,
	Star,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import React from "react";
import { FallbackImage } from "~/components/FallbackImage";
import { Button } from "~/components/ui/button";

type AnalysisStatus =
	| "complete"
	| "pending"
	| "queued"
	| "fetching"
	| "basic-analysis"
	| "dependency-analysis"
	| "failed";

interface RepositoryHeroProps {
	id: string;
	owner: string;
	name: string;
	fullName: string;
	url?: string;
	description?: string | null;
	avatarUrl?: string;
	stars?: number;
	forks?: number;
	license?: string | null;
	primaryLanguage?: string | null;
	defaultBranch: string;
	isPrivate: boolean;
	createdAt?: string;
	updatedAt?: string;
	contributorCount?: number;
	status?: AnalysisStatus;
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

function formatDate(dateString?: string): string {
	if (!dateString) return "";
	const date = new Date(dateString);
	return date.toLocaleDateString("en-US", {
		month: "short",
		year: "numeric",
	});
}

function formatRelativeTime(dateString?: string): string {
	if (!dateString) return "";
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

export const RepositoryHero = React.memo(function RepositoryHero({
	id: _id,
	owner,
	name,
	fullName: _fullName,
	url,
	description,
	avatarUrl,
	stars,
	forks,
	license,
	primaryLanguage,
	defaultBranch,
	isPrivate,
	createdAt,
	updatedAt,
	contributorCount,
	status,
}: RepositoryHeroProps) {
	const displayStars = stars?.toLocaleString("en-US") ?? "0";
	const displayForks = forks?.toLocaleString("en-US") ?? "0";
	const repoUrl = url || `https://github.com/${owner}/${name}`;

	return (
		<motion.div
			animate="visible"
			className="border-border border-b"
			initial="hidden"
			variants={containerVariants}
		>
			<div className="flex flex-col gap-6 py-6 lg:flex-row lg:items-start lg:justify-between">
				{/* Main info */}
				<motion.div className="min-w-0 flex-1" variants={itemVariants}>
					<div className="flex items-start gap-4">
						{/* Avatar */}
						<div className="shrink-0">
							{avatarUrl ? (
								<FallbackImage
									alt={owner}
									className="border border-border"
									height={56}
									src={avatarUrl}
									width={56}
								/>
							) : (
								<div className="flex h-14 w-14 items-center justify-center border border-border bg-secondary">
									<SiGithub className="h-6 w-6 text-muted-foreground" />
								</div>
							)}
						</div>

						{/* Name and description */}
						<div className="min-w-0 flex-1">
							<div className="mb-1 flex items-center gap-2">
								<h1 className="font-(family-name:--font-display) text-2xl text-foreground tracking-tight md:text-3xl">
									<span className="font-mono text-muted-foreground">
										{owner}
									</span>
									<span className="text-border">/</span>
									<span>{name}</span>
								</h1>
								{isPrivate && (
									<span className="flex items-center gap-1 border border-border px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground uppercase">
										<Lock className="h-2.5 w-2.5" />
										Private
									</span>
								)}
							</div>

							{description && (
								<p className="mb-4 max-w-2xl font-sans text-muted-foreground text-sm leading-relaxed">
									{description}
								</p>
							)}

							{/* Metadata row */}
							<div className="flex flex-wrap items-center gap-4 text-xs">
								{primaryLanguage && (
									<div className="flex items-center gap-1.5">
										<div className="h-3 w-3 rounded-full bg-accent" />
										<span className="font-mono text-foreground">
											{primaryLanguage}
										</span>
									</div>
								)}

								{license && (
									<div className="flex items-center gap-1.5">
										<Shield className="h-3 w-3 text-muted-foreground" />
										<span className="font-mono text-muted-foreground">
											{license}
										</span>
									</div>
								)}

								<div className="flex items-center gap-1.5">
									<GitBranch className="h-3 w-3 text-muted-foreground" />
									<span className="font-mono text-muted-foreground">
										{defaultBranch}
									</span>
								</div>

								{createdAt && (
									<div className="flex items-center gap-1.5">
										<Calendar className="h-3 w-3 text-muted-foreground" />
										<span className="font-mono text-muted-foreground">
											Created {formatDate(createdAt)}
										</span>
									</div>
								)}

								{updatedAt && (
									<span className="font-mono text-muted-foreground/60 text-xs">
										Updated {formatRelativeTime(updatedAt)}
									</span>
								)}

								{status && (
									<div className="flex items-center gap-1.5 border border-accent/20 bg-accent/5 px-2 py-0.5">
										{status === "complete" ? (
											<>
												<Check className="h-3 w-3 text-accent" />
												<span className="font-mono text-[10px] text-accent uppercase tracking-wider">
													Analyzed
												</span>
											</>
										) : status === "failed" ? (
											<span className="font-mono text-[10px] text-destructive uppercase tracking-wider">
												Failed
											</span>
										) : (
											<>
												<div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
												<span className="font-mono text-[10px] text-accent uppercase tracking-wider">
													{status === "queued" ? "Queued" : "Analyzing..."}
												</span>
											</>
										)}
									</div>
								)}
							</div>
						</div>
					</div>
				</motion.div>

				{/* Stats and link */}
				<motion.div
					className="flex items-center gap-6 lg:shrink-0 lg:pt-2"
					variants={itemVariants}
				>
					{/* Stars */}
					<div className="flex flex-col items-center gap-0.5">
						<div className="flex items-center gap-1.5">
							<Star className="h-4 w-4 text-amber-400" />
							<span className="font-(family-name:--font-display) text-foreground text-xl">
								{displayStars}
							</span>
						</div>
						<span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
							Stars
						</span>
					</div>

					{/* Forks */}
					<div className="flex flex-col items-center gap-0.5">
						<div className="flex items-center gap-1.5">
							<GitFork className="h-4 w-4 text-muted-foreground" />
							<span className="font-(family-name:--font-display) text-foreground text-xl">
								{displayForks}
							</span>
						</div>
						<span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
							Forks
						</span>
					</div>

					{/* Contributors */}
					{contributorCount !== undefined && (
						<div className="flex flex-col items-center gap-0.5">
							<span className="font-(family-name:--font-display) text-foreground text-xl">
								{contributorCount}
							</span>
							<span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
								Contributors
							</span>
						</div>
					)}

					{/* Action buttons */}
					<div className="ml-2 flex items-center gap-2">
						{/* Browse Files link */}
						<Link href={`/${owner}/${name}/files`}>
							<Button
								className="h-8 gap-1.5 border-border px-3 font-mono text-xs uppercase tracking-wider"
								size="sm"
								variant="outline"
							>
								<FileCode className="h-3 w-3" />
								<span className="hidden sm:inline">Files</span>
							</Button>
						</Link>

						{/* GitHub link */}
						<a
							className="flex h-8 items-center gap-1.5 border border-foreground bg-foreground px-3 font-mono text-background text-xs uppercase tracking-wider transition-colors hover:bg-foreground/90"
							href={repoUrl}
							rel="noopener noreferrer"
							target="_blank"
						>
							<SiGithub className="h-3 w-3" />
							<span className="hidden sm:inline">GitHub</span>
							<ExternalLink className="h-3 w-3" />
						</a>
					</div>
				</motion.div>
			</div>
		</motion.div>
	);
});
