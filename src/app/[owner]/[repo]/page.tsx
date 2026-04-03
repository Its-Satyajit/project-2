import { SiGithub } from "@icons-pack/react-simple-icons";
import { GitBranch, GitGraph, Loader2, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
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
import { FallbackImage } from "~/components/FallbackImage";
import { Button } from "~/components/ui/button";
import { api } from "~/lib/eden";
import { getRepositoryByOwnerAndName } from "~/server/dal/repositories";

interface RepoPageProps {
	params: Promise<{ owner: string; repo: string }>;
}

async function getRepoId(owner: string, repo: string) {
	"use cache";
	cacheLife({ stale: 86400, revalidate: 86400, expire: 86400 });
	cacheTag("repository", `repo-${owner}-${repo}`);
	const repoData = await getRepositoryByOwnerAndName(owner, repo);
	return repoData?.id ?? null;
}

async function getDashboardData(repoId: string) {
	"use cache";
	cacheLife({ stale: 86400, revalidate: 86400, expire: 86400 });
	cacheTag("dashboard", `repo-${repoId}`);
	const res = await api.dashboard({ repoId }).get();
	if (res.error || !res.data) return null;
	return res.data;
}

async function getContributors(
	repoId: string,
	sort: "contributions" | "newest" = "contributions",
) {
	"use cache";
	cacheLife({ stale: 86400, revalidate: 86400, expire: 86400 });
	cacheTag("contributors", `repo-${repoId}`);
	const res = await api
		.repos({ repoId })
		.contributors.get({ query: { sort, limit: 100 } });
	if (res.error) {
		console.error("Failed to fetch contributors:", res.error);
		return null;
	}
	const contributors =
		res.data?.filter(
			(
				c,
			): c is {
				id: string;
				githubLogin: string;
				avatarUrl: string | null;
				htmlUrl: string | null;
				contributions: number;
				firstContributionAt: string | null;
				lastContributionAt: string | null;
			} => c.contributions !== null,
		) ?? null;
	return contributors;
}

async function RepoNotFound({ owner, repo }: { owner: string; repo: string }) {
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

function LoadingState() {
	return (
		<div className="flex flex-col items-center justify-center py-32">
			<div className="mb-6 flex items-center gap-3 font-mono text-muted-foreground text-sm">
				<Loader2 className="h-4 w-4 animate-spin" />
				<span className="uppercase tracking-widest">Loading Dashboard</span>
			</div>
		</div>
	);
}

function ContributorsSection({
	repoId,
	initialSort,
}: {
	repoId: string;
	initialSort: "contributions" | "newest";
}) {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center p-8">
					<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
				</div>
			}
		>
			<ContributorsListInner initialSort={initialSort} repoId={repoId} />
		</Suspense>
	);
}

async function ContributorsListInner({
	repoId,
	initialSort,
}: {
	repoId: string;
	initialSort: "contributions" | "newest";
}) {
	const contributors = await getContributors(repoId, initialSort);

	if (!contributors || contributors.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
				<GitGraph className="mb-4 h-8 w-8 opacity-20" />
				<p className="font-mono text-xs uppercase tracking-wider">
					No contributors found
				</p>
			</div>
		);
	}

	return <ContributorsGrid contributors={contributors} />;
}

function ContributorsGrid({
	contributors,
}: {
	contributors: Array<{
		id: string;
		githubLogin: string;
		avatarUrl: string | null;
		htmlUrl: string | null;
		contributions: number;
	}>;
}) {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{contributors.map((contributor) => (
				<div
					className="flex items-center gap-4 rounded-lg border border-border bg-muted/20 p-4"
					key={contributor.id}
				>
					{contributor.avatarUrl ? (
						<FallbackImage
							alt={contributor.githubLogin}
							className="rounded-full"
							height={48}
							src={contributor.avatarUrl}
							width={48}
						/>
					) : (
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
							<GitBranch className="h-6 w-6 text-muted-foreground" />
						</div>
					)}
					<div className="min-w-0 flex-1">
						<p className="truncate font-medium font-mono">
							{contributor.githubLogin}
						</p>
					</div>
					<div className="text-right">
						<p className="font-bold font-mono text-foreground text-lg">
							{contributor.contributions}
						</p>
						<p className="font-mono text-muted-foreground text-xs">
							contributions
						</p>
					</div>
				</div>
			))}
		</div>
	);
}

async function DashboardContent({
	owner,
	repo,
}: {
	owner: string;
	repo: string;
}) {
	const repoId = await getRepoId(owner, repo);

	if (!repoId) {
		return <RepoNotFound owner={owner} repo={repo} />;
	}

	const data = (await getDashboardData(repoId)) as {
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
		analysisStatus: string;
		analysisResults?: Array<{
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
	} | null;

	if (!data) {
		return <RepoNotFound owner={owner} repo={repo} />;
	}

	const analysis = data.analysisResults?.[0];

	return (
		<div className="flex flex-col gap-0">
			<RepositoryHero
				avatarUrl={data.avatarUrl}
				contributorCount={data.contributorCount}
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
				status={
					data.analysisStatus as
						| "complete"
						| "pending"
						| "queued"
						| "fetching"
						| "basic-analysis"
						| "dependency-analysis"
						| "failed"
						| undefined
				}
				updatedAt={data.updatedAt}
				url={data.url}
			/>

			<section className="border-border border-t">
				<EnhancedStatCards
					contributorCount={data.contributorCount}
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

			<section className="grid gap-0 border-border border-t lg:grid-cols-2">
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

			<section className="grid gap-0 border-border border-t lg:grid-cols-2">
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

			<section className="border-border border-t bg-muted/20">
				<div className="flex items-center gap-3 px-6 py-4">
					<Sparkles className="h-4 w-4 text-amber-400" />
					<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
						Computed Insights
					</span>
					<div className="line-rule flex-1" />
				</div>
			</section>

			<section className="grid gap-0 border-border border-t lg:grid-cols-2">
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

			<section className="grid gap-0 border-border border-t lg:grid-cols-2">
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

			<section className="border-border border-t py-6">
				<div className="mb-6 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
							Contributors
						</span>
						<div className="line-rule hidden flex-1 sm:block" />
					</div>
				</div>

				<div className="border border-border bg-card p-6">
					<Suspense
						fallback={
							<div className="flex items-center justify-center p-8">
								<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
							</div>
						}
					>
						<ContributorsSection initialSort="contributions" repoId={repoId} />
					</Suspense>
				</div>
			</section>
		</div>
	);
}

export async function generateMetadata({ params }: RepoPageProps) {
	const { owner, repo } = await params;
	return {
		title: `${owner}/${repo} — Analyze`,
		description: `Comprehensive code analysis for ${owner}/${repo}. View repository structure, dependency graphs, hotspot analysis, and code quality metrics.`,
	};
}

export default async function RepoPage({ params }: RepoPageProps) {
	const { owner, repo } = await params;

	return (
		<main className="blueprint-grid relative min-h-screen overflow-hidden bg-background">
			<div className="mx-auto max-w-7xl px-6 py-8">
				<Suspense fallback={<LoadingState />}>
					<DashboardContent owner={owner} repo={repo} />
				</Suspense>
			</div>
		</main>
	);
}
