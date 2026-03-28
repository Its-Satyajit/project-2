import { Loader2 } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import type { RepoStatus } from "~/hooks/useRepoStatus";
import { api } from "~/lib/eden";
import { getCachedRepoByPath } from "~/lib/server/data";
import { AnalysisPageClient } from "./AnalysisPageClient";

type Props = { params: Promise<{ owner: string; repo: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { owner, repo } = await params;
	return {
		title: `${owner}/${repo} Analysis — Analyze`,
		description: `Detailed code analysis for ${owner}/${repo}.`,
	};
}

interface AnalysisPageProps {
	params: Promise<{ owner: string; repo: string }>;
}

async function getAnalysisStatus(repoId: string): Promise<RepoStatus | null> {
	"use cache";
	const res = await api.dashboard({ repoId }).status.get();
	if (res.error || !res.data) return null;
	return res.data as RepoStatus;
}

async function getFullRepoDetails(repoId: string) {
	"use cache";
	const res = await api.dashboard({ repoId }).get();
	if (res.error || !res.data) return null;
	return res.data;
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
			<main className="blueprint-grid min-h-screen bg-background">
				<div className="flex min-h-screen flex-col items-center justify-center">
					<div className="border border-border bg-card p-8 text-center">
						<div className="mb-4 flex justify-center">
							<div className="flex h-10 w-10 items-center justify-center border border-destructive/30 bg-destructive/5">
								<span className="text-destructive text-lg">!</span>
							</div>
						</div>
						<h1 className="font-(family-name:--font-display) mb-2 text-2xl text-foreground">
							Repository Not Found
						</h1>
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

	const repoId = repoData.id;

	return (
		<div className="mx-auto max-w-7xl px-6">
			<Suspense
				fallback={
					<div className="flex min-h-[200px] items-center justify-center">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					</div>
				}
			>
				<AnalysisDataFetcher owner={owner} repo={repo} repoId={repoId} />
			</Suspense>
		</div>
	);
}

async function AnalysisDataFetcher({
	owner,
	repo,
	repoId,
}: {
	owner: string;
	repo: string;
	repoId: string;
}) {
	const [status, fullData] = await Promise.all([
		getAnalysisStatus(repoId),
		getFullRepoDetails(repoId),
	]);

	return (
		<AnalysisPageClient
			initialFullData={fullData ?? undefined}
			initialStatus={status ?? undefined}
			owner={owner}
			repo={repo}
			repoId={repoId}
			showHeader={true}
		/>
	);
}

export default async function AnalysisPage({ params }: AnalysisPageProps) {
	const { owner, repo } = await params;

	return (
		<Suspense
			fallback={
				<main className="blueprint-grid min-h-screen bg-background">
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
