"use client";

import { SiGithub } from "@icons-pack/react-simple-icons";
import { useQuery } from "@tanstack/react-query";
import { GitBranch, GitGraph, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import React, { Suspense, use, useState } from "react";
import { ActivitySummary } from "~/components/dashboard/ActivitySummary";
import { CodeQualityMetrics } from "~/components/dashboard/CodeQualityMetrics";
import { CommitsTimeline } from "~/components/dashboard/CommitsTimeline";
import { ContributorsList } from "~/components/dashboard/ContributorsList";
import { DependencyOverview } from "~/components/dashboard/DependencyOverview";
import { EnhancedStatCards } from "~/components/dashboard/EnhancedStatCards";
import { FileInsights } from "~/components/dashboard/FileInsights";
import { FileTypeChart } from "~/components/dashboard/FileTypeChart";
import { HotspotRankings } from "~/components/dashboard/HotspotRankings";
import { HotspotSummary } from "~/components/dashboard/HotspotSummary";
import { RepositoryHero } from "~/components/dashboard/RepositoryHero";
import { StatCardsSkeleton } from "~/components/dashboard/StatCards";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { api } from "~/lib/eden";

export default function RepoPage({
	params,
}: {
	params: Promise<{ owner: string; repo: string }>;
}) {
	return (
		<main className="blueprint-grid relative min-h-screen overflow-hidden bg-background pt-14">
			<div className="mx-auto max-w-7xl px-6 py-8">
				<Suspense fallback={<StatCardsSkeleton />}>
					<DashboardData params={params} />
				</Suspense>
			</div>
		</main>
	);
}

function DashboardData({
	params,
}: {
	params: Promise<{ owner: string; repo: string }>;
}) {
	const { owner, repo } = use(params);
	const [contributorsSort, setContributorsSort] = useState<
		"contributions" | "newest"
	>("contributions");
	const contributorsParentRef = React.useRef<HTMLDivElement>(null);

	// First get the repo ID from owner/repo
	const { data: repoLookup, isLoading: isLookingUp } = useQuery({
		queryKey: ["repo-lookup", owner, repo],
		queryFn: async () => {
			const res = await fetch(`/api/repos/lookup?owner=${owner}&name=${repo}`);
			if (!res.ok) throw new Error("Failed to lookup repository");
			return res.json() as Promise<{ id: string }>;
		},
	});

	const repoId = repoLookup?.id;

	const { data: response, isLoading } = useQuery({
		queryKey: ["repo-dashboard", repoId],
		queryFn: async () => {
			const res = await api.dashboard({ repoId: repoId! }).get();
			return res;
		},
		enabled: !!repoId,
		retry: false,
	});

	const {
		data: contributorsData,
		isLoading: isContributorsLoading,
		isError,
	} = useQuery<
		Array<{
			id: string;
			githubLogin: string;
			avatarUrl: string | null;
			htmlUrl: string | null;
			contributions: number;
		}>
	>({
		queryKey: ["contributors", repoId, contributorsSort],
		queryFn: async () => {
			const res = await fetch(
				`/api/repos/${repoId}/contributors?sort=${contributorsSort}`,
			);
			if (!res.ok) throw new Error("Failed to fetch contributors");
			return res.json();
		},
		enabled: !!repoId,
		retry: 2,
	});

	if (isLookingUp || isLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-32">
				<div className="mb-6 flex items-center gap-3 font-mono text-muted-foreground text-sm">
					<Loader2 className="h-4 w-4 animate-spin" />
					<span className="uppercase tracking-widest">Loading Dashboard</span>
				</div>
			</div>
		);
	}

	if (!response?.data || typeof response.data !== "object") {
		return (
			<div className="flex flex-col items-center justify-center py-32">
				<div className="mb-4 border border-destructive/30 bg-destructive/5 px-4 py-2 font-mono text-destructive text-sm">
					ERROR: Repository {owner}/{repo} not found or not analyzed yet
				</div>
				<Link href="/">
					<Button
						className="font-mono text-xs uppercase tracking-wider"
						variant="outline"
					>
						Analyze Repository
					</Button>
				</Link>
			</div>
		);
	}

	const data = response.data as unknown as {
		id: string;
		owner: string;
		name: string;
		fullName: string;
		url?: string;
		defaultBranch: string;
		isPrivate: boolean;
		primaryLanguage: string;
		description?: string;
		avatarUrl?: string;
		stars?: number;
		forks?: number;
		license?: string | null;
		createdAt?: string;
		updatedAt?: string;
		analysisResults: Array<{
			totalFiles: number;
			totalDirectories: number;
			totalLines: number;
		}>;
		fileTypeBreakdown?: Record<string, number>;
		contributorCount?: number;
		commits?: Array<{
			sha: string;
			message: string;
			authorName: string;
			committedAt: string;
		}>;
		dependencyGraph?: {
			nodes: Array<{
				id: string;
				path: string;
				language: string;
				imports: number;
				loc?: number;
			}>;
			edges: Array<{
				source: string;
				target: string;
			}>;
			metadata: {
				totalNodes: number;
				totalEdges: number;
				languageBreakdown: Record<string, number>;
				unresolvedImports: number;
			};
		};
		hotSpotData?: Array<{
			path: string;
			language: string;
			fanIn: number;
			fanOut: number;
			loc: number;
			score: number;
			rank: number;
		}>;
	};
	const analysis = data.analysisResults?.[0];

	return (
		<div className="flex flex-col gap-0">
			{/* Repository Hero Section */}
			<RepositoryHero
				avatarUrl={data.avatarUrl}
				contributorCount={data.contributorCount ?? contributorsData?.length}
				createdAt={data.createdAt}
				defaultBranch={data.defaultBranch}
				description={data.description}
				forks={data.forks}
				fullName={data.fullName}
				id={data.id}
				isPrivate={data.isPrivate}
				license={data.license}
				name={data.name}
				owner={data.owner}
				primaryLanguage={data.primaryLanguage}
				stars={data.stars}
				status="complete"
				updatedAt={data.updatedAt}
				url={data.url}
			/>

			{/* Enhanced Stats Row */}
			<section className="border-border border-t">
				<EnhancedStatCards
					contributorCount={data.contributorCount ?? contributorsData?.length}
					createdAt={data.createdAt}
					defaultBranch={data.defaultBranch}
					license={data.license}
					primaryLanguage={data.primaryLanguage}
					totalDirectories={analysis?.totalDirectories ?? 0}
					totalFiles={analysis?.totalFiles ?? 0}
					totalLines={analysis?.totalLines ?? 0}
					updatedAt={data.updatedAt}
				/>
			</section>

			{/* Dependency Overview & Hotspots - Grid Layout */}
			<section className="grid gap-0 border-border border-t lg:grid-cols-2">
				{/* Dependency Stats */}
				<div className="border-border border-r p-6">
					{data.dependencyGraph?.metadata ? (
						<DependencyOverview
							languageBreakdown={
								data.dependencyGraph.metadata.languageBreakdown
							}
							totalEdges={data.dependencyGraph.metadata.totalEdges}
							totalNodes={data.dependencyGraph.metadata.totalNodes}
							unresolvedImports={
								data.dependencyGraph.metadata.unresolvedImports
							}
						/>
					) : (
						<div className="flex flex-col items-center justify-center py-8">
							<span className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
								No dependency data available
							</span>
						</div>
					)}
				</div>

				{/* Hotspots */}
				<div className="p-6">
					{data.hotSpotData && data.hotSpotData.length > 0 ? (
						<HotspotRankings hotspots={data.hotSpotData} maxVisible={5} />
					) : (
						<div className="flex flex-col items-center justify-center py-8">
							<span className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
								No hotspot data available
							</span>
						</div>
					)}
				</div>
			</section>

			{/* File Type Breakdown & File Composition */}
			<section className="grid gap-0 border-border border-t lg:grid-cols-2">
				{/* File Types */}
				<div className="border-border border-r p-6">
					{data.fileTypeBreakdown ? (
						<FileTypeChart data={data.fileTypeBreakdown} />
					) : (
						<div className="flex flex-col items-center justify-center py-8">
							<span className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
								No file type data available
							</span>
						</div>
					)}
				</div>

				{/* File Composition Insights */}
				<div className="p-6">
					{data.fileTypeBreakdown ? (
						<FileInsights
							fileTypeBreakdown={data.fileTypeBreakdown}
							totalFiles={analysis?.totalFiles ?? 0}
						/>
					) : (
						<div className="flex flex-col items-center justify-center py-8">
							<span className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
								No file type data available
							</span>
						</div>
					)}
				</div>
			</section>

			{/* Computed Insights Header */}
			<section className="border-border border-t bg-muted/20">
				<div className="flex items-center gap-3 px-6 py-4">
					<Sparkles className="h-4 w-4 text-amber-400" />
					<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
						Computed Insights
					</span>
					<div className="line-rule flex-1" />
				</div>
			</section>

			{/* Code Quality & Risk Summary */}
			<section className="grid gap-0 border-border border-t lg:grid-cols-2">
				{/* Code Quality Metrics */}
				<div className="border-border border-r p-6">
					{data.dependencyGraph?.nodes && data.hotSpotData ? (
						<CodeQualityMetrics
							edges={data.dependencyGraph.edges}
							hotspots={data.hotSpotData}
							nodes={data.dependencyGraph.nodes}
							totalFiles={analysis?.totalFiles ?? 0}
							totalLines={analysis?.totalLines ?? 0}
						/>
					) : (
						<div className="flex flex-col items-center justify-center py-8">
							<span className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
								Insufficient data for quality metrics
							</span>
						</div>
					)}
				</div>

				{/* Hotspot Summary */}
				<div className="p-6">
					{data.hotSpotData && data.hotSpotData.length > 0 ? (
						<HotspotSummary hotspots={data.hotSpotData} />
					) : (
						<div className="flex flex-col items-center justify-center py-8">
							<span className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
								No hotspot data available
							</span>
						</div>
					)}
				</div>
			</section>

			{/* Activity Summary & Commits */}
			<section className="grid gap-0 border-border border-t lg:grid-cols-2">
				{/* Activity Summary */}
				<div className="border-border border-r p-6">
					{data.commits && data.commits.length > 0 ? (
						<ActivitySummary
							commits={data.commits}
							sampleSize={data.commits.length}
						/>
					) : (
						<div className="flex flex-col items-center justify-center py-8">
							<span className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
								No commit data available
							</span>
						</div>
					)}
				</div>

				{/* Recent Commits Timeline */}
				<div className="p-6">
					{data.commits && data.commits.length > 0 ? (
						<CommitsTimeline
							commits={data.commits}
							maxVisible={6}
							sampleSize={data.commits.length}
						/>
					) : (
						<div className="flex flex-col items-center justify-center py-8">
							<span className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
								No commits available
							</span>
						</div>
					)}
				</div>
			</section>

			{/* Contributors Section */}
			<section className="border-border border-t py-6">
				<div className="mb-6 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
							Contributors
						</span>
						<div className="line-rule hidden flex-1 sm:block" />
					</div>
					{contributorsData && contributorsData.length > 0 && (
						<Tabs
							onValueChange={(v) =>
								setContributorsSort(v as typeof contributorsSort)
							}
							value={contributorsSort}
						>
							<TabsList className="bg-transparent p-0">
								<TabsTrigger className="tab-pill" value="contributions">
									Top Contributors
								</TabsTrigger>
								<TabsTrigger className="tab-pill" value="newest">
									Recently Added
								</TabsTrigger>
							</TabsList>
						</Tabs>
					)}
				</div>

				<div className="border border-border bg-card p-6">
					{isContributorsLoading ? (
						<div className="flex items-center justify-center p-8">
							<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
						</div>
					) : isError ? (
						<div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
							<GitGraph className="mb-4 h-8 w-8 opacity-20" />
							<p className="font-mono text-xs uppercase tracking-wider">
								Failed to load contributors
							</p>
						</div>
					) : contributorsData && contributorsData.length > 0 ? (
						<div
							className="relative w-full overflow-auto"
							ref={contributorsParentRef}
							style={{ maxHeight: "500px" }}
						>
							<ContributorsList
								contributors={contributorsData}
								parentRef={contributorsParentRef}
							/>
						</div>
					) : (
						<div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
							<GitGraph className="mb-4 h-8 w-8 opacity-20" />
							<p className="font-mono text-xs uppercase tracking-wider">
								No contributors found
							</p>
						</div>
					)}
				</div>
			</section>

			{/* Footer */}
			<footer className="mt-8 flex flex-col items-center justify-between gap-4 border-border border-t py-6 md:flex-row">
				<div className="flex items-center gap-6">
					<span className="font-(family-name:--font-display) text-foreground text-sm">
						Analyze
					</span>
					<div className="flex items-center gap-4 font-mono text-muted-foreground text-xs">
						<a
							className="flex items-center gap-1.5 transition-colors hover:text-foreground"
							href="https://github.com/Its-Satyajit/git-insights-analyzer"
							rel="noopener noreferrer"
							target="_blank"
						>
							<SiGithub className="h-3 w-3" />
							<span>Source</span>
						</a>
						<span className="text-border">·</span>
						<span>
							Built by{" "}
							<a
								className="text-foreground transition-colors hover:text-accent"
								href="https://github.com/Its-Satyajit"
								rel="noopener noreferrer"
								target="_blank"
							>
								Satyajit
							</a>
						</span>
						<span className="text-border">·</span>
						<Link
							className="transition-colors hover:text-foreground"
							href="/legal"
						>
							Legal
						</Link>
					</div>
				</div>
				<div className="flex items-center gap-6 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
					<span>
						Branch <span className="text-foreground">{data.defaultBranch}</span>
					</span>
					<span className="text-border">·</span>
					<span>
						Status <span className="text-accent">Analyzed</span>
					</span>
				</div>
			</footer>
		</div>
	);
}
