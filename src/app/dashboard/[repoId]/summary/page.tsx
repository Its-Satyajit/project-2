"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { useRepoStatus } from "~/hooks/useRepoStatus";

export default function RepoSummaryPage() {
	return (
		<Suspense fallback={<SummarySkeleton />}>
			<RepoSummaryContent />
		</Suspense>
	);
}

function RepoSummaryContent() {
	const params = useParams();
	const repoId = params.repoId as string;
	const { data: status, isLoading, error } = useRepoStatus(repoId);

	if (isLoading) {
		return <SummarySkeleton />;
	}

	if (error || !status?.analysis?.summary) {
		return (
			<div className="flex h-[calc(100vh-100px)] items-center justify-center">
				<div className="text-center">
					<h2 className="font-semibold text-xl">Summary not available</h2>
					<p className="mt-2 text-muted-foreground">
						{error ? "Failed to load summary." : "Analysis not yet complete."}
					</p>
					<Link
						className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm hover:bg-primary/90"
						href={`/dashboard/${repoId}`}
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Dashboard
					</Link>
				</div>
			</div>
		);
	}

	const summary = status.analysis.summary;

	return (
		<div className="mx-auto max-w-7xl p-6">
			<div className="mb-6">
				<Link
					className="mb-2 inline-flex items-center text-muted-foreground text-sm hover:text-foreground"
					href={`/dashboard/${repoId}`}
				>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Back to Dashboard
				</Link>
				<h1 className="font-bold text-3xl">Repository Summary</h1>
				<p className="text-muted-foreground">
					{status.metadata.owner}/{status.metadata.name}
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{/* Basic Stats */}
				<Card>
					<CardHeader>
						<CardTitle>Basic Statistics</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Total Files</span>
							<span className="font-mono">{summary.basic.totalFiles}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Total Directories</span>
							<span className="font-mono">
								{summary.basic.totalDirectories}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Lines of Code</span>
							<span className="font-mono">{summary.basic.totalLines}</span>
						</div>
					</CardContent>
				</Card>

				{/* Languages */}
				<Card>
					<CardHeader>
						<CardTitle>Languages</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="mb-2 flex items-center gap-2">
							<span className="font-semibold text-lg">
								{summary.languages.primaryLanguage}
							</span>
							<span className="text-muted-foreground text-sm">(Primary)</span>
						</div>
						<div className="space-y-2">
							{summary.languages.topLanguages.map((lang) => (
								<div className="flex justify-between" key={lang.name}>
									<span>{lang.name}</span>
									<span className="font-mono">
										{lang.percentage.toFixed(1)}%
									</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Structure */}
				<Card>
					<CardHeader>
						<CardTitle>Structure</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Maximum Depth</span>
							<span className="font-mono">{summary.structure.maxDepth}</span>
						</div>
						<div>
							<span className="text-muted-foreground">
								Top‑level Directories
							</span>
							<div className="mt-1 flex flex-wrap gap-1">
								{summary.structure.topLevelDirectories.map((dir) => (
									<span
										className="rounded-full bg-muted px-2 py-0.5 text-xs"
										key={dir}
									>
										{dir}
									</span>
								))}
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Dependencies */}
				<Card>
					<CardHeader>
						<CardTitle>Dependencies</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Total Files (Nodes)</span>
							<span className="font-mono">
								{summary.dependencies.totalNodes}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">
								Total Dependencies (Edges)
							</span>
							<span className="font-mono">
								{summary.dependencies.totalEdges}
							</span>
						</div>
						{summary.dependencies.mostDependedUpon.length > 0 && (
							<div>
								<h4 className="mb-2 font-medium">Most Depended Upon</h4>
								<div className="space-y-1">
									{summary.dependencies.mostDependedUpon
										.slice(0, 5)
										.map((item) => (
											<div
												className="flex justify-between text-sm"
												key={item.path}
											>
												<span className="truncate font-mono text-xs">
													{item.path}
												</span>
												<span className="font-mono">{item.fanIn}</span>
											</div>
										))}
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Hotspots */}
				<Card>
					<CardHeader>
						<CardTitle>Hotspots</CardTitle>
					</CardHeader>
					<CardContent>
						{summary.hotspots.topHotspots.length > 0 ? (
							<div className="space-y-2">
								{summary.hotspots.topHotspots.slice(0, 5).map((hotspot) => (
									<div
										className="flex items-center justify-between rounded-lg border p-2"
										key={hotspot.path}
									>
										<div className="min-w-0 flex-1">
											<p className="truncate font-mono text-sm">
												{hotspot.path}
											</p>
											<p className="text-muted-foreground text-xs">
												Score: {hotspot.score.toFixed(3)}
											</p>
										</div>
										<span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-primary text-xs">
											#{hotspot.rank}
										</span>
									</div>
								))}
							</div>
						) : (
							<p className="text-muted-foreground">No hotspots detected.</p>
						)}
					</CardContent>
				</Card>

				{/* File Types */}
				<Card>
					<CardHeader>
						<CardTitle>File Types</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{summary.fileTypes.topExtensions.map((ext) => (
								<div className="flex justify-between" key={ext.extension}>
									<span>.{ext.extension}</span>
									<span className="font-mono">{ext.count}</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function SummarySkeleton() {
	return (
		<div className="mx-auto max-w-7xl p-6">
			<div className="mb-6">
				<Skeleton className="h-4 w-32" />
				<Skeleton className="mt-2 h-8 w-64" />
				<Skeleton className="mt-1 h-4 w-48" />
			</div>
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<Card key={i}>
						<CardHeader>
							<Skeleton className="h-5 w-32" />
						</CardHeader>
						<CardContent className="space-y-2">
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-3/4" />
							<Skeleton className="h-4 w-1/2" />
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
