"use client";

import { SiGithub } from "@icons-pack/react-simple-icons";
import {
	BarChart3,
	Database,
	ExternalLink,
	FileCode,
	GitBranch,
	GitFork,
	Scale,
	Star,
	Users,
} from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface DashboardHeroProps {
	repo: {
		id: string;
		owner: string;
		name: string;
		fullName: string;
		description?: string;
		avatarUrl?: string;
		stars?: number;
		forks?: number;
		primaryLanguage?: string;
		isPrivate?: boolean;
		url?: string;
		license?: string | null;
	};
	analysis?: {
		totalFiles: number;
		totalDirectories: number;
		totalLines: number;
	};
	contributorCount?: number;
}

export function DashboardHero({
	repo,
	analysis,
	contributorCount,
}: DashboardHeroProps) {
	const stats = [
		{
			label: "Stars",
			value: repo.stars?.toLocaleString("en-US") ?? "0",
			icon: Star,
		},
		{
			label: "Forks",
			value: repo.forks?.toLocaleString("en-US") ?? "0",
			icon: GitFork,
		},
		{
			label: "Contributors",
			value: contributorCount?.toLocaleString("en-US") ?? "0",
			icon: Users,
		},
		{
			label: "Files",
			value: analysis?.totalFiles?.toLocaleString("en-US") ?? "0",
			icon: FileCode,
		},
		{
			label: "Lines",
			value: analysis?.totalLines?.toLocaleString("en-US") ?? "0",
			icon: Database,
		},
	];

	return (
		<motion.div
			animate={{ opacity: 1, y: 0 }}
			className="relative py-8"
			initial={{ opacity: 0, y: 20 }}
			transition={{ duration: 0.4 }}
		>
			<div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
				{/* Repo info - editorial layout */}
				<div className="min-w-0 flex-1">
					<div className="flex items-start gap-5">
						<motion.div
							transition={{ type: "spring", stiffness: 300 }}
							whileHover={{ scale: 1.02 }}
						>
							{repo.avatarUrl ? (
								<Image
									alt={repo.owner}
									className="border border-border"
									height={56}
									src={repo.avatarUrl}
									width={56}
								/>
							) : (
								<div className="flex h-14 w-14 items-center justify-center border border-border bg-secondary">
									<GitBranch className="h-5 w-5 text-muted-foreground" />
								</div>
							)}
						</motion.div>

						<div className="min-w-0 flex-1">
							<div className="mb-1 flex items-baseline gap-3">
								<h1 className="font-(family-name:--font-display) truncate text-4xl text-foreground leading-[1.15] tracking-tight md:text-5xl">
									{repo.name}
								</h1>
								{repo.isPrivate && (
									<span className="border border-border px-2 py-0.5 font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
										Private
									</span>
								)}
							</div>
							<p className="mb-3 font-mono text-muted-foreground text-xs uppercase tracking-wider">
								{repo.owner}
							</p>
							{repo.description && (
								<p className="max-w-2xl font-sans text-muted-foreground text-sm leading-relaxed">
									{repo.description}
								</p>
							)}

							<div className="mt-4 flex flex-wrap items-center gap-3">
								{repo.url && (
									<a
										className="group flex items-center gap-1.5 font-mono text-muted-foreground text-xs transition-colors hover:text-foreground"
										href={repo.url}
										rel="noopener noreferrer"
										target="_blank"
									>
										<SiGithub className="h-3 w-3" />
										<span>
											github.com/{repo.owner}/{repo.name}
										</span>
										<ExternalLink className="h-2.5 w-2.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
									</a>
								)}
								{repo.primaryLanguage && (
									<span className="flex items-center gap-1.5 border border-border px-2 py-0.5 font-mono text-muted-foreground text-xs">
										<div className="h-1.5 w-1.5 rounded-full bg-accent" />
										{repo.primaryLanguage}
									</span>
								)}
								{repo.license && (
									<span className="flex items-center gap-1.5 border border-border px-2 py-0.5 font-mono text-muted-foreground text-xs">
										<Scale className="h-2.5 w-2.5" />
										{repo.license}
									</span>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Analysis button */}
				<div className="shrink-0 lg:pt-2">
					<Link href={`/${repo.owner}/${repo.name}/analysis`}>
						<Button className="h-10 gap-2 border-foreground/20 bg-transparent px-6 font-mono text-foreground text-xs uppercase tracking-widest hover:bg-foreground hover:text-background">
							<BarChart3 className="h-3.5 w-3.5" />
							<span>Deep Analysis</span>
						</Button>
					</Link>
				</div>
			</div>

			{/* Stats Band - inline, not in cards */}
			<div className="mt-8 border-border border-t">
				<div className="grid grid-cols-2 gap-0 pt-6 md:grid-cols-5">
					{stats.map((stat, i) => (
						<motion.div
							animate={{ opacity: 1, y: 0 }}
							className={cn(
								"flex flex-col gap-1 py-4",
								i !== stats.length - 1 && "border-border border-r pr-6",
								i > 0 && "pl-6",
							)}
							initial={{ opacity: 0, y: 10 }}
							key={stat.label}
							transition={{ delay: 0.1 + i * 0.05 }}
						>
							<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
								{stat.label}
							</span>
							<span className="font-(family-name:--font-display) text-3xl text-foreground tracking-tight">
								{stat.value}
							</span>
						</motion.div>
					))}
				</div>
			</div>
		</motion.div>
	);
}
