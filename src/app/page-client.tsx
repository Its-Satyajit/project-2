"use client";
import { useForm } from "@tanstack/react-form-nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
	GitBranch,
	GitFork,
	Github,
	Search,
	Star,
	Terminal,
	Type,
	Users,
	Workflow,
	Zap,
} from "lucide-react";
import { redirect } from "next/navigation";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/lib/eden";

const FEATURES = [
	{
		icon: GitBranch,
		title: "Explore Structure",
		description:
			"View the complete file tree with language breakdown and folder organization.",
	},
	{
		icon: Workflow,
		title: "Analyze Dependencies",
		description:
			"Visualize import relationships between files to understand code dependencies.",
	},
	{
		icon: Terminal,
		title: "Find Hotspots",
		description:
			"Identify high-risk files based on complexity, dependencies, and change frequency.",
	},
	{
		icon: Type,
		title: "Get Insights",
		description:
			"Receive AI-powered summaries about your codebase structure and health.",
	},
];

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.08,
			delayChildren: 0.2,
		},
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 16, scale: 0.98 },
	visible: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: {
			type: "spring" as const,
			stiffness: 200,
			damping: 20,
		},
	},
};

export default function HomeClient() {
	const queryClient = useQueryClient();
	const form = useForm({
		defaultValues: {
			githubUrl: "",
		},

		onSubmit: async ({ value }) => {
			const res = await api.analyze.post({ githubUrl: value.githubUrl });
			const data = res.data as { repoId?: string } | null;
			if (res.error || !data?.repoId) {
				toast.error(
					"Unable to analyze repository. Check the URL and try again.",
				);
				return;
			}
			queryClient.invalidateQueries({ queryKey: ["top-repos"] });
			redirect(`/dashboard/${data.repoId}`);
		},
	});

	const { data: topRepos, isLoading: isLoadingRepos } = useQuery({
		queryKey: ["top-repos"],
		queryFn: async () => {
			const res = await api.repos.top.get({ query: { limit: 10 } });
			if (res.error) throw new Error("Failed to fetch top repositories");
			return res.data;
		},
	});

	return (
		<main className="relative min-h-screen overflow-hidden bg-background">
			<div className="absolute inset-0 -z-10">
				<div className="mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] absolute inset-0 bg-[linear-gradient(rgba(100,100,100,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(100,100,100,0.1)_1px,transparent_1px)] bg-size-[40px_40px] dark:bg-[linear-gradient(rgba(20,20,20,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(20,20,20,0.3)_1px,transparent_1px)]" />
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,var(--color-primary-transparent),transparent_50%)]" />
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,var(--color-accent-transparent),transparent_50%)]" />
				<div
					className="pointer-events-none absolute inset-0 opacity-[0.015]"
					style={{
						backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
					}}
				/>
			</div>

			<motion.div
				animate="visible"
				className="relative mx-auto max-w-5xl px-6 py-16 md:py-24"
				initial="hidden"
				variants={containerVariants}
			>
				<motion.div className="mb-10" variants={itemVariants}>
					<div className="mb-6 inline-flex items-center gap-2.5 rounded-md border border-primary/20 bg-primary/5 px-3.5 py-1.5 font-mono text-primary/90 text-xs tracking-wide">
						<span className="relative flex h-2 w-2">
							<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
							<span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
						</span>
						<span className="tracking-wider">git://analyze</span>
					</div>
					<h1 className="font-(family-name:--font-geist-sans) mb-5 font-bold text-5xl text-foreground tracking-tight md:text-6xl lg:text-7xl">
						<span className="text-primary">Repository</span>{" "}
						<span className="text-foreground/90">Analyzer</span>
					</h1>
					<p className="max-w-xl font-mono text-base text-muted-foreground leading-relaxed">
						<span className="text-muted-foreground/70">$</span> analyze
						--target=github --depth=full{" "}
						<span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-accent align-middle" />
					</p>
				</motion.div>

				<motion.div className="mb-16" variants={itemVariants}>
					<div className="relative rounded-lg border border-border bg-card/60 p-1 backdrop-blur-xl">
						<div className="absolute inset-0 rounded-lg bg-linear-to-r from-primary/5 via-transparent to-accent/5" />
						<form
							className="relative flex items-center gap-2"
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								form.handleSubmit();
							}}
						>
							<div className="flex items-center px-3 text-muted-foreground/50">
								<Search className="h-4 w-4" />
							</div>
							<form.Field name="githubUrl">
								{(field) => (
									<div className="flex-1">
										<Label className="sr-only" htmlFor={field.name}>
											GitHub URL
										</Label>
										<Input
											className="h-14 border-0 bg-transparent font-mono text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
											id={field.name}
											name={field.name}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="github.com/owner/repo"
											value={field.state.value}
										/>
									</div>
								)}
							</form.Field>
							<form.Subscribe
								selector={(state) => [state.canSubmit, state.isSubmitting]}
							>
								{([canSubmit, isSubmitting]) => (
									<Button
										className="mr-1 h-10 bg-linear-to-r from-primary to-primary/80 px-6 font-medium font-mono text-primary-foreground text-sm transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
										disabled={!canSubmit}
										type="submit"
									>
										{isSubmitting ? (
											<span className="flex items-center gap-2">
												<svg
													aria-hidden="true"
													className="h-4 w-4 animate-spin"
													viewBox="0 0 24 24"
												>
													<circle
														className="opacity-25"
														cx="12"
														cy="12"
														fill="none"
														r="10"
														stroke="currentColor"
														strokeWidth="4"
													/>
													<path
														className="opacity-75"
														d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
														fill="currentColor"
													/>
												</svg>
												<span>Scanning</span>
											</span>
										) : (
											<span className="flex items-center gap-2">
												<Zap className="h-4 w-4" />
												<span>EXEC</span>
											</span>
										)}
									</Button>
								)}
							</form.Subscribe>
						</form>
					</div>
					<p className="mt-3 font-mono text-muted-foreground/60 text-xs">
						Supported: github.com, gist.github.com
					</p>
				</motion.div>

				<motion.div className="mb-16" variants={itemVariants}>
					<div className="mb-8 flex items-center gap-3">
						<div className="flex h-8 w-8 items-center justify-center rounded border border-border bg-secondary/50">
							<span className="font-mono text-accent text-xs">01</span>
						</div>
						<h2 className="font-mono font-semibold text-foreground text-xl tracking-wide">
							MODULES
						</h2>
					</div>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						{FEATURES.map((feature) => (
							<motion.div
								className="group relative rounded-lg border border-border bg-card/50 p-5 transition-all hover:border-accent/30 hover:bg-card/80"
								key={feature.title}
								variants={itemVariants}
								whileHover={{ y: -2 }}
							>
								<div className="absolute inset-0 rounded-lg bg-linear-to-b from-accent/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
								<div className="relative mb-4 flex h-10 w-10 items-center justify-center rounded border border-border bg-secondary/50">
									<feature.icon className="h-5 w-5 text-accent" />
								</div>
								<h3 className="mb-2 font-medium font-mono text-foreground text-sm">
									{feature.title}
								</h3>
								<p className="font-mono text-muted-foreground text-xs leading-relaxed">
									{feature.description}
								</p>
							</motion.div>
						))}
					</div>
				</motion.div>

				<motion.div variants={itemVariants}>
					<div className="mb-8 flex items-center gap-3">
						<div className="flex h-8 w-8 items-center justify-center rounded border border-border bg-secondary/50">
							<span className="font-mono text-primary text-xs">02</span>
						</div>
						<h2 className="font-mono font-semibold text-foreground text-xl tracking-wide">
							RECENT_ANALYSES
						</h2>
					</div>
					{isLoadingRepos ? (
						<div className="grid gap-3 md:grid-cols-2">
							{Array.from({ length: 4 }).map((_, i) => (
								<Card
									className="border-border bg-card/50"
									// biome-ignore lint/suspicious/noArrayIndexKey: safe
									key={`skeleton-${i}`}
								>
									<CardHeader>
										<Skeleton className="h-4 w-3/4 bg-muted" />
										<Skeleton className="mt-2 h-3 w-1/2 bg-muted" />
									</CardHeader>
									<CardContent>
										<Skeleton className="h-3 w-full bg-muted" />
									</CardContent>
								</Card>
							))}
						</div>
					) : (
						<div className="grid gap-3 md:grid-cols-2">
							{topRepos?.map((repo) => (
								<motion.div
									key={repo.id}
									transition={{ type: "spring", stiffness: 300 }}
									whileHover={{ scale: 1.01 }}
								>
									<a href={`/dashboard/${repo.id}`}>
										<Card className="group cursor-pointer border-border bg-card/50 transition-all hover:border-primary/30 hover:bg-card/80">
											<CardHeader className="pb-2">
												<div className="flex items-start justify-between">
													<div className="flex items-center gap-2">
														<div className="flex h-6 w-6 items-center justify-center rounded border border-border bg-secondary/50">
															<GitBranch className="h-3 w-3 text-muted-foreground" />
														</div>
														<CardTitle className="font-medium font-mono text-foreground text-sm group-hover:text-primary">
															{repo.fullName}
														</CardTitle>
													</div>
												</div>
												{repo.description && (
													<p className="mt-2 line-clamp-2 font-mono text-muted-foreground text-xs leading-relaxed">
														{repo.description}
													</p>
												)}
											</CardHeader>
											<CardContent>
												<div className="flex items-center gap-4 font-mono text-xs">
													<div className="flex items-center gap-1.5 text-primary">
														<Star className="h-3 w-3 fill-primary text-primary" />
														<span>{repo.stars?.toLocaleString()}</span>
													</div>
													<div className="flex items-center gap-1.5 text-muted-foreground">
														<GitFork className="h-3 w-3" />
														<span>{repo.forks?.toLocaleString()}</span>
													</div>
													{repo.contributorCount !== undefined &&
														repo.contributorCount > 0 && (
															<div className="flex items-center gap-1.5 text-violet-500 dark:text-violet-400">
																<Users className="h-3 w-3" />
																<span>
																	{repo.contributorCount >= 100
																		? "100+"
																		: repo.contributorCount}
																</span>
															</div>
														)}
													{repo.primaryLanguage && (
														<span className="rounded border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-accent text-xs">
															{repo.primaryLanguage}
														</span>
													)}
												</div>
											</CardContent>
										</Card>
									</a>
								</motion.div>
							))}
						</div>
					)}
				</motion.div>

				<motion.footer
					className="mt-20 flex flex-col items-center justify-between gap-4 border-border border-t pt-8 md:flex-row"
					variants={itemVariants}
				>
					<div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
						<div className="font-mono text-muted-foreground text-xs">
							<span className="text-primary">▲</span> repo-analyzer v1.0.0
						</div>
						<div className="flex items-center gap-4 font-mono text-muted-foreground text-xs">
							<a
								className="flex items-center gap-1.5 transition-colors hover:text-primary"
								href="https://github.com/Its-Satyajit/git-insights-analyzer"
								rel="noopener noreferrer"
								target="_blank"
							>
								<Github className="h-3 w-3" />
								<span>Source</span>
							</a>
							<span className="text-border">|</span>
							<span>
								built by{" "}
								<a
									className="text-foreground transition-colors hover:text-primary"
									href="https://github.com/Its-Satyajit"
									rel="noopener noreferrer"
									target="_blank"
								>
									Its-Satyajit
								</a>
							</span>
						</div>
					</div>
					<div className="flex items-center gap-4 font-mono text-muted-foreground text-xs">
						<span>
							status:{" "}
							<span className="text-green-600 dark:text-green-400">online</span>
						</span>
						<span>
							latency: <span className="text-accent">12ms</span>
						</span>
					</div>
				</motion.footer>
			</motion.div>
		</main>
	);
}
