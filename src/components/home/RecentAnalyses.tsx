import { ArrowRight, GitFork, Star, Users } from "lucide-react";
import Link from "next/link";
import { getTopRepositories } from "~/lib/server/data";

export async function RecentAnalyses() {
	const topRepos = await getTopRepositories(10);

	return (
		<div>
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

			{topRepos.length === 0 ? (
				<div className="border-border border-t py-12 text-center">
					<p className="font-mono text-muted-foreground text-sm uppercase tracking-wider">
						No repositories analyzed yet
					</p>
				</div>
			) : (
				<div className="border-border border-t">
					{topRepos.map((repo, i) => (
						<Link
							className="group relative flex items-baseline justify-between border-border border-b py-5 transition-colors hover:bg-secondary/20"
							href={`/${repo.owner}/${repo.name}`}
							key={repo.id}
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
								{repo.stars != null && repo.stars > 0 && (
									<div className="flex items-center gap-1.5 font-mono text-muted-foreground text-xs tabular-nums">
										<Star className="h-3 w-3" />
										<span>{repo.stars!.toLocaleString("en-US")}</span>
									</div>
								)}
								{repo.forks != null && repo.forks > 0 && (
									<div className="flex items-center gap-1.5 font-mono text-muted-foreground text-xs tabular-nums">
										<GitFork className="h-3 w-3" />
										<span>{repo.forks!.toLocaleString("en-US")}</span>
									</div>
								)}
								{repo.contributorCount !== undefined &&
									repo.contributorCount > 0 && (
										<div className="hidden items-center gap-1.5 font-mono text-muted-foreground text-xs tabular-nums sm:flex">
											<Users className="h-3 w-3" />
											<span>{repo.contributorCount}</span>
										</div>
									)}
								<ArrowRight className="h-4 w-4 text-muted-foreground/0 transition-all group-hover:translate-x-1 group-hover:text-accent" />
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
