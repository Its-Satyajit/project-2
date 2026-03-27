"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, GitFork, Star, Users } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/lib/eden";

export function RecentAnalyses() {
	const { data: topRepos, isLoading: isLoadingRepos } = useQuery({
		queryKey: ["top-repos"],
		queryFn: async () => {
			const res = await api.repos.top.get({ query: { limit: 10 } });
			if (res.error) throw new Error("Failed to fetch top repositories");
			return res.data;
		},
	});

	return (
		<motion.div>
			<div className="mb-8 flex items-end justify-between">
				<div>
					<span className="font-(family-name:--font-display) mb-2 block text-3xl text-foreground">
						Recent
					</span>
					<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
						Previously analyzed repositories
					</span>
				</div>
				<span className="font-(family-name:--font-display) hidden text-[5rem] text-muted-foreground/10 leading-none md:block">
					{topRepos?.length ?? 0}
				</span>
			</div>

			{isLoadingRepos ? (
				<div className="space-y-0">
					{[1, 2, 3, 4].map((n) => (
						<div className="border-border border-b py-5" key={`skeleton-${n}`}>
							<Skeleton className="mb-2 h-5 w-64" />
							<Skeleton className="h-3 w-32" />
						</div>
					))}
				</div>
			) : (
				<div className="border-border border-t">
					{topRepos?.map((repo, i) => (
						<motion.a
							className="group relative flex items-baseline justify-between border-border border-b py-5 transition-colors hover:bg-secondary/20"
							href={`/${repo.owner}/${repo.name}`}
							key={repo.id}
							whileHover={{ x: 4 }}
						>
							<div className="flex-1">
								<div className="mb-1 flex items-baseline gap-3">
									<span className="absolute top-5 left-[-2rem] font-mono text-muted-foreground/30 text-xs tabular-nums">
										{String(i + 1).padStart(2, "0")}
									</span>
									<span className="font-(family-name:--font-display) text-foreground text-xl transition-colors group-hover:text-accent">
										{repo.fullName}
									</span>
									{repo.primaryLanguage && (
										<span className="flex items-center gap-1.5 border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
											<div className="h-1.5 w-1.5 rounded-full bg-accent" />
											{repo.primaryLanguage}
										</span>
									)}
								</div>
								{repo.description && (
									<p className="ml-8 max-w-xl truncate font-sans text-muted-foreground text-sm">
										{repo.description}
									</p>
								)}
							</div>
							<div className="my-auto ml-6 flex shrink-0 items-center gap-6">
								<div className="flex items-center gap-1.5 font-mono text-muted-foreground text-xs tabular-nums">
									<Star className="h-3 w-3" />
									<span>{repo.stars?.toLocaleString()}</span>
								</div>
								<div className="flex items-center gap-1.5 font-mono text-muted-foreground text-xs tabular-nums">
									<GitFork className="h-3 w-3" />
									<span>{repo.forks?.toLocaleString()}</span>
								</div>
								{repo.contributorCount !== undefined &&
									repo.contributorCount > 0 && (
										<div className="hidden items-center gap-1.5 font-mono text-muted-foreground text-xs tabular-nums sm:flex">
											<Users className="h-3 w-3" />
											<span>{repo.contributorCount}</span>
										</div>
									)}
								<ArrowRight className="h-4 w-4 text-muted-foreground/0 transition-all group-hover:translate-x-1 group-hover:text-accent" />
							</div>
						</motion.a>
					))}
				</div>
			)}
		</motion.div>
	);
}
