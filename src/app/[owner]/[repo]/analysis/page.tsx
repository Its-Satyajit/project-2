import { Loader2 } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { getCachedRepoByPath } from "~/lib/server/data";
import { AnalysisPageClient } from "./AnalysisPageClient";

interface AnalysisPageProps {
	params: Promise<{ owner: string; repo: string }>;
}

export async function generateMetadata({
	params,
}: AnalysisPageProps): Promise<Metadata> {
	const { owner, repo } = await params;
	const repoData = await getCachedRepoByPath(owner, repo);

	if (!repoData) {
		return {
			title: "Repository Not Found",
		};
	}

	return {
		title: `${repoData.fullName} - Code Analysis & Hotspots`,
		description: `Comprehensive code analysis for ${repoData.fullName}: dependency graph, hotspot detection, file structure, and ${repoData.primaryLanguage || "multi-language"} codebase insights.`,
		openGraph: {
			title: `${repoData.fullName} Analysis - Git Insights`,
			description: `Deep code analysis for ${repoData.fullName}`,
			images: repoData.avatarUrl ? [repoData.avatarUrl] : undefined,
		},
		keywords: [
			`${owner} ${repo}`,
			"code analysis",
			"dependency graph",
			"hotspot detection",
			repoData.primaryLanguage || "",
		].filter(Boolean),
	};
}

async function AnalysisContent({
	owner,
	repo,
}: {
	owner: string;
	repo: string;
}) {
	const repoData = await getCachedRepoByPath(owner, repo);

	if (!repoData) {
		return (
			<main className="blueprint-grid min-h-screen bg-background pt-14">
				<div className="flex min-h-screen flex-col items-center justify-center">
					<div className="border border-border bg-card p-8 text-center">
						<div className="mb-4 flex justify-center">
							<div className="flex h-10 w-10 items-center justify-center border border-destructive/30 bg-destructive/5">
								<span className="text-destructive text-lg">!</span>
							</div>
						</div>
						<h2 className="font-(family-name:--font-display) mb-2 text-2xl text-foreground">
							Repository Not Found
						</h2>
						<p className="mb-6 font-mono text-muted-foreground text-xs uppercase tracking-wider">
							{owner}/{repo} has not been analyzed yet.
						</p>
						<a
							className="border border-foreground bg-foreground px-4 py-2 font-mono text-background text-xs uppercase tracking-wider hover:bg-foreground/90"
							href="/"
						>
							Analyze a Repository
						</a>
					</div>
				</div>
			</main>
		);
	}

	return <AnalysisPageClient owner={owner} repo={repo} repoId={repoData.id} />;
}

export default async function AnalysisPage({ params }: AnalysisPageProps) {
	const { owner, repo } = await params;

	return (
		<Suspense
			fallback={
				<main className="blueprint-grid min-h-screen bg-background pt-14">
					<div className="flex min-h-screen flex-col items-center justify-center">
						<div className="flex flex-col items-center gap-6">
							<Loader2 className="h-10 w-10 animate-spin text-foreground" />
							<p className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
								Loading analysis...
							</p>
						</div>
					</div>
				</main>
			}
		>
			<AnalysisContent owner={owner} repo={repo} />
		</Suspense>
	);
}
