import { GitGraph, Search } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { CodeQualityMetrics } from "~/components/insights/CodeQualityMetrics";
import { FilesByLanguageChart } from "~/components/insights/FilesByLanguageChart";
import { GrowthTimeline } from "~/components/insights/GrowthTimeline";
import { InsightsHero } from "~/components/insights/InsightsHero";
import { InsightsHeroHeader } from "~/components/insights/InsightsHeroHeader";
import { LanguageDistribution } from "~/components/insights/LanguageDistribution";
import { LanguageLocVsFiles } from "~/components/insights/LanguageLocVsFiles";
import { LicenseBreakdown } from "~/components/insights/LicenseBreakdown";
import { LocByLanguage } from "~/components/insights/LocByLanguage";
import { RepoSizeDistribution } from "~/components/insights/RepoSizeDistribution";
import { StarDistribution } from "~/components/insights/StarDistribution";
import { StarsForksScatter } from "~/components/insights/StarsForksScatter";
import { TopContributorsByRepos } from "~/components/insights/TopContributorsByRepos";
import { TopContributorsTable } from "~/components/insights/TopContributorsTable";
import { TopRepositoriesTable } from "~/components/insights/TopRepositoriesTable";
import { getCachedGlobalInsights } from "~/lib/server/data";

export const metadata = {
	title: "Insights | Git Insights Analyzer",
	description:
		"Global insights and statistics across all analyzed repositories",
};

function EmptyState() {
	return (
		<div className="flex flex-col items-center justify-center py-24">
			<div className="mb-6 flex h-16 w-16 items-center justify-center border border-border bg-secondary">
				<GitGraph className="h-8 w-8 text-muted-foreground" />
			</div>
			<h2 className="font-(family-name:--font-display) mb-2 text-2xl text-foreground">
				No Insights Yet
			</h2>
			<p className="mb-8 max-w-md text-center font-mono text-muted-foreground text-sm">
				Analyze some repositories to see global insights and statistics across
				your codebase.
			</p>
			<Link
				className="inline-flex h-10 items-center gap-2 border border-foreground bg-foreground px-6 font-mono text-background text-sm uppercase tracking-wider transition-colors hover:bg-foreground/90"
				href="/"
			>
				<Search className="h-4 w-4" />
				<span>Analyze a Repository</span>
			</Link>
		</div>
	);
}

function InsightsSkeleton() {
	return (
		<div className="animate-pulse space-y-8">
			<div className="grid grid-cols-4 gap-4">
				<div className="h-24 rounded-lg bg-muted" />
				<div className="h-24 rounded-lg bg-muted" />
				<div className="h-24 rounded-lg bg-muted" />
				<div className="h-24 rounded-lg bg-muted" />
			</div>
			<div className="h-64 rounded-lg bg-muted" />
			<div className="grid grid-cols-2 gap-4">
				<div className="h-64 rounded-lg bg-muted" />
				<div className="h-64 rounded-lg bg-muted" />
			</div>
		</div>
	);
}

async function InsightsData() {
	const insights = await getCachedGlobalInsights();

	if (insights.stats.totalRepos === 0) {
		return <EmptyState />;
	}

	return (
		<>
			<section className="mb-8 border border-border bg-card">
				<InsightsHero stats={insights.stats} />
			</section>

			{insights.stats.totalRepos > 0 && (
				<section className="mb-8 border border-border bg-card">
					<CodeQualityMetrics stats={insights.stats} />
				</section>
			)}

			<div className="mb-8 grid grid-cols-1 gap-0 lg:grid-cols-2">
				{insights.languages.length > 0 && (
					<div className="border border-border bg-card lg:border-r">
						<LanguageDistribution data={insights.languages} />
					</div>
				)}
				{insights.topLanguagesByLoc.length > 0 && (
					<div className="border border-border bg-card">
						<LocByLanguage data={insights.topLanguagesByLoc} />
					</div>
				)}
			</div>

			<div className="mb-8 grid grid-cols-1 gap-0 lg:grid-cols-2">
				{insights.languageLocVsFiles.length > 0 && (
					<div className="border border-border bg-card lg:border-r">
						<LanguageLocVsFiles data={insights.languageLocVsFiles} />
					</div>
				)}
				{insights.filesByLanguage.length > 0 && (
					<div className="border border-border bg-card">
						<FilesByLanguageChart data={insights.filesByLanguage} />
					</div>
				)}
			</div>

			<div className="mb-8 grid grid-cols-1 gap-0 md:grid-cols-2">
				{insights.starDistribution.length > 0 && (
					<div className="border border-border bg-card md:border-r">
						<StarDistribution data={insights.starDistribution} />
					</div>
				)}
				{insights.repoSizeDistribution.length > 0 && (
					<div className="border border-border bg-card">
						<RepoSizeDistribution data={insights.repoSizeDistribution} />
					</div>
				)}
			</div>

			{insights.starsForksData.length > 0 && (
				<section className="mb-8 border border-border bg-card">
					<StarsForksScatter data={insights.starsForksData} />
				</section>
			)}

			{insights.topRepos.length > 0 && (
				<section className="mb-8 border border-border bg-card">
					<TopRepositoriesTable repos={insights.topRepos} />
				</section>
			)}

			<div className="mb-8 grid grid-cols-1 gap-0 lg:grid-cols-2">
				{insights.topContributors.length > 0 && (
					<div className="border border-border bg-card lg:border-r">
						<TopContributorsTable contributors={insights.topContributors} />
					</div>
				)}
				{insights.mostActiveContributors.length > 0 && (
					<div className="border border-border bg-card">
						<TopContributorsByRepos
							contributors={insights.mostActiveContributors}
						/>
					</div>
				)}
			</div>

			{insights.licenses.length > 0 && (
				<section className="mb-8 border border-border bg-card">
					<LicenseBreakdown data={insights.licenses} />
				</section>
			)}

			{insights.timeline.length > 0 && (
				<section className="mb-8 border border-border bg-card">
					<GrowthTimeline data={insights.timeline} />
				</section>
			)}
		</>
	);
}

export default async function InsightsPage() {
	return (
		<main className="blueprint-grid min-h-screen bg-background">
			<div className="mx-auto max-w-7xl px-6 py-8">
				<Suspense
					fallback={
						<>
							<InsightsHeroHeader
								totalContributors={0}
								totalFiles={0}
								totalLines={0}
								totalRepos={0}
							/>
							<InsightsSkeleton />
						</>
					}
				>
					<InsightsData />
				</Suspense>
			</div>
		</main>
	);
}
