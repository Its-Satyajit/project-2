import { Loader2 } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { env } from "~/env";
import { getCachedRepoByPath } from "~/lib/server/data";
import { AnalysisPageClient } from "./AnalysisPageClient";
import { AnalysisPageHeader } from "./AnalysisPageHeader";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ owner: string; repo: string }>;
}): Promise<Metadata> {
	const { owner, repo } = await params;
	const title = `${owner}/${repo} Analysis — Analyze`;
	const description = `Detailed code analysis for ${owner}/${repo}. Explore hotspots, complexity metrics, dependency analysis, and architectural insights.`;
	const url = `${env.NEXT_PUBLIC_BASE_URL}/${owner}/${repo}/analysis`;

	return {
		title,
		description,
		alternates: {
			canonical: url,
		},
		openGraph: {
			type: "website",
			locale: "en_US",
			url,
			siteName: "Analyze",
			title,
			description,
			images: [
				{
					url: "/og-image.png",
					width: 1200,
					height: 630,
					alt: `${owner}/${repo} Analysis`,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			images: ["/og-image.png"],
		},
		robots: {
			index: true,
			follow: true,
			googleBot: {
				index: true,
				follow: true,
				"max-video-preview": -1,
				"max-image-preview": "large",
				"max-snippet": -1,
			},
		},
	};
}

interface AnalysisPageProps {
	params: Promise<{ owner: string; repo: string }>;
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

	return (
		<>
			<AnalysisPageHeader owner={owner} repo={repo} />
			<AnalysisPageClient
				owner={owner}
				repo={repo}
				repoId={repoData.id}
				showHeader={false}
			/>
		</>
	);
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
