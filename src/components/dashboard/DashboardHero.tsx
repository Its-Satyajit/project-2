"use client";

import { SiGithub } from "@icons-pack/react-simple-icons";
import {
	BarChart3,
	Database,
	ExternalLink,
	FileCode,
	GitBranch,
	GitFork,
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
			label: "STARS",
			value: repo.stars?.toLocaleString() ?? "0",
			icon: Star,
			color: "text-amber-400",
		},
		{
			label: "FORKS",
			value: repo.forks?.toLocaleString() ?? "0",
			icon: GitFork,
			color: "text-blue-400",
		},
		{
			label: "CONTRIBUTORS",
			value: contributorCount?.toLocaleString() ?? "0",
			icon: Users,
			color: "text-emerald-400",
		},
		{
			label: "FILES",
			value: analysis?.totalFiles?.toLocaleString() ?? "0",
			icon: FileCode,
			color: "text-sky-400",
		},
		{
			label: "LINES",
			value: analysis?.totalLines?.toLocaleString() ?? "0",
			icon: Database,
			color: "text-violet-400",
		},
	];

	return (
		<motion.div
			animate={{ opacity: 1, y: 0 }}
			className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-8 backdrop-blur-md"
			initial={{ opacity: 0, y: 20 }}
			transition={{ duration: 0.5 }}
		>
			{/* Decorative elements */}
			<div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
			<div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />

			<div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
				<div className="flex flex-1 items-start gap-6">
					<motion.div
						transition={{ type: "spring", stiffness: 300 }}
						whileHover={{ scale: 1.05 }}
					>
						{repo.avatarUrl ? (
							<Image
								alt={repo.owner}
								className="rounded-2xl border-2 border-primary/20 bg-background shadow-2xl"
								height={96}
								src={repo.avatarUrl}
								width={96}
							/>
						) : (
							<div className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-primary/20 bg-primary/5 text-primary">
								<GitBranch size={40} />
							</div>
						)}
					</motion.div>

					<div className="flex-1 space-y-3">
						<div className="flex items-center gap-3">
							<h1 className="font-bold font-mono text-3xl text-foreground tracking-tight md:text-4xl">
								<span className="text-primary/80">{repo.owner}</span>
								<span className="mx-1 text-muted-foreground/50">/</span>
								<span>{repo.name}</span>
							</h1>
							{repo.isPrivate && (
								<span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-primary text-xs tracking-widest">
									PRIVATE
								</span>
							)}
						</div>

						{repo.description && (
							<p className="max-w-2xl font-mono text-muted-foreground text-sm leading-relaxed md:text-base">
								{repo.description}
							</p>
						)}

						<div className="flex flex-wrap items-center gap-4 pt-2">
							{repo.url && (
								<a
									className="group flex items-center gap-2 font-mono text-muted-foreground text-sm transition-colors hover:text-primary"
									href={repo.url}
									rel="noopener noreferrer"
									target="_blank"
								>
									<SiGithub className="h-4 w-4" />
									<span>
										github.com/{repo.owner}/{repo.name}
									</span>
									<ExternalLink className="h-3 w-3 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
								</a>
							)}
							<div className="flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 py-1 font-mono text-muted-foreground text-xs">
								<div className="h-2 w-2 rounded-full bg-primary" />
								<span>{repo.primaryLanguage || "Unknown"}</span>
							</div>
						</div>
					</div>
				</div>

				<div className="flex min-w-[200px] flex-col gap-4">
					<Link href={`/dashboard/${repo.id}/analysis`}>
						<Button className="w-full gap-2 border-accent/30 bg-accent/10 px-6 py-6 font-mono font-semibold text-accent hover:bg-accent/20">
							<BarChart3 className="h-5 w-5" />
							<span>DEEP_ANALYSIS</span>
						</Button>
					</Link>
				</div>
			</div>

			<div className="mt-10 grid grid-cols-2 gap-4 border-white/5 border-t pt-8 md:grid-cols-5">
				{stats.map((stat, i) => (
					<motion.div
						animate={{ opacity: 1, x: 0 }}
						className="space-y-1"
						initial={{ opacity: 0, x: -10 }}
						key={stat.label}
						transition={{ delay: 0.2 + i * 0.1 }}
					>
						<div className="flex items-center gap-2 font-mono text-muted-foreground text-xs tracking-wider">
							<stat.icon className={cn("h-3 w-3", stat.color)} />
							{stat.label}
						</div>
						<div className="font-bold font-mono text-foreground text-xl md:text-2xl">
							{stat.value}
						</div>
					</motion.div>
				))}
			</div>
		</motion.div>
	);
}
