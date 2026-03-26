"use client";

import { SiGithub } from "@icons-pack/react-simple-icons";
import { useQuery } from "@tanstack/react-query";
import { Code2, FolderTree, GitBranch, GitGraph, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { Suspense, use, useState } from "react";
import type { FileTreeItem } from "~/components/CollapsibleFileTree";
import { AnalysisProgress } from "~/components/dashboard/AnalysisProgress";
import { ContributorsList } from "~/components/dashboard/ContributorsList";
import { DashboardHero } from "~/components/dashboard/DashboardHero";
import { FileViewer } from "~/components/dashboard/FileViewer";
import { StatCardsSkeleton } from "~/components/dashboard/StatCards";
import { VirtualizedFileTree } from "~/components/dashboard/VirtualizedFileTree";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { api } from "~/lib/eden";

export default function RepoPage({
	params,
}: {
	params: Promise<{ repoId: string }>;
}) {
	return (
		<main className="relative min-h-screen overflow-hidden bg-background pt-14">
			<div className="absolute inset-0 -z-10">
				<div className="mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] absolute inset-0 bg-[linear-gradient(rgba(100,100,100,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(100,100,100,0.1)_1px,transparent_1px)] bg-size-[30px_30px] dark:bg-[linear-gradient(rgba(20,20,20,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(20,20,20,0.4)_1px,transparent_1px)]" />
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,var(--color-primary)/0.06,transparent_40%)]" />
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,var(--color-accent)/0.05,transparent_40%)]" />
				<div
					className="pointer-events-none absolute inset-0 opacity-[0.02]"
					style={{
						backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
					}}
				/>
			</div>

			<div className="mx-auto max-w-[140ch] px-6 py-8">
				<Suspense fallback={<StatCardsSkeleton />}>
					<DashboardData params={params} />
				</Suspense>
			</div>
		</main>
	);
}

function DashboardData({ params }: { params: Promise<{ repoId: string }> }) {
	const { repoId } = use(params);
	const [selectedFile, setSelectedFile] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<"explorer" | "contributors">(
		"explorer",
	);
	const [contributorsSort, setContributorsSort] = useState<
		"contributions" | "newest"
	>("contributions");
	const contributorsParentRef = React.useRef<HTMLDivElement>(null);

	const { data: response, isLoading } = useQuery({
		queryKey: ["repo-dashboard", repoId],
		queryFn: async () => {
			const res = await api.dashboard({ repoId }).get();
			return res;
		},
		enabled: !!repoId,
		retry: false,
	});

	const { data: contributorsData, isLoading: isContributorsLoading } = useQuery(
		{
			queryKey: ["contributors", repoId, contributorsSort],
			queryFn: async () => {
				const res = await fetch(
					`/api/repos/${repoId}/contributors?sort=${contributorsSort}`,
				);
				if (!res.ok) throw new Error("Failed to fetch contributors");
				return res.json();
			},
			enabled: !!repoId && activeTab === "contributors",
		},
	);

	const {
		data: fileContent,
		isLoading: isFileLoading,
		error: fileError,
	} = useQuery({
		queryKey: ["file-content", repoId, selectedFile],
		queryFn: async () => {
			if (!selectedFile || !response?.data) return null;

			const data = response.data as {
				owner: string;
				name: string;
				defaultBranch: string;
				isPrivate: boolean;
			};

			const ext = selectedFile.split(".").pop()?.toLowerCase();
			const isImage = [
				"png",
				"jpg",
				"jpeg",
				"gif",
				"svg",
				"webp",
				"ico",
			].includes(ext || "");
			if (isImage) {
				return "IMAGE_PLACEHOLDER";
			}

			if (!data.isPrivate) {
				const branch = data.defaultBranch || "main";
				const url = `https://raw.githubusercontent.com/${data.owner}/${data.name}/refs/heads/${branch}/${selectedFile}`;
				const res = await fetch(url);
				if (!res.ok) throw new Error("Failed to fetch file");
				return res.text();
			}

			const res = await api["file-content"].get({
				query: { repoId, path: selectedFile },
			});
			if (res.error) {
				const errorVal = res.error.value;
				const errorMsg =
					typeof errorVal === "string"
						? errorVal
						: errorVal && typeof errorVal === "object" && "summary" in errorVal
							? (errorVal as { summary: string }).summary
							: JSON.stringify(errorVal);
				throw new Error(errorMsg);
			}
			return res.data?.content;
		},
		enabled: !!selectedFile && !!response?.data,
	});

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-32">
				<div className="mb-6 flex items-center gap-3 font-mono text-primary">
					<Loader2 className="h-5 w-5 animate-spin" />
					<span className="text-sm tracking-wider">INITIALIZING_DASHBOARD</span>
				</div>
				<div className="h-1 w-48 overflow-hidden rounded-full bg-secondary">
					<div
						className="h-full animate-pulse bg-primary"
						style={{ width: "60%" }}
					/>
				</div>
			</div>
		);
	}

	if (!response?.data || typeof response.data !== "object") {
		return (
			<div className="flex flex-col items-center justify-center py-32">
				<div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 font-mono text-red-400 text-sm">
					ERROR: Failed to load repository
				</div>
				<Link href="/">
					<Button className="font-mono text-sm" variant="outline">
						Return to Terminal
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
		fileTree: FileTreeItem[];
		analysisResults: Array<{
			totalFiles: number;
			totalDirectories: number;
			totalLines: number;
		}>;
		fileTypeBreakdown?: Record<string, number>;
		contributorCount?: number;
	};
	const analysis = data.analysisResults?.[0];

	const handleFileSelect = (filePath: string) => {
		setSelectedFile(filePath);
	};

	return (
		<div className="flex flex-col gap-8">
			<DashboardHero
				analysis={analysis}
				contributorCount={data.contributorCount ?? contributorsData?.length}
				repo={data}
			/>

			<section>
				<div className="mb-4 flex items-center gap-2">
					<span className="font-mono text-muted-foreground text-xs">
						{"//"}
					</span>
					<span className="font-mono text-accent text-xs tracking-wider">
						ANALYSIS_STATUS
					</span>
				</div>
				<div className="rounded-xl border border-white/5 bg-black/10 p-6">
					<AnalysisProgress repoId={repoId} />
				</div>
			</section>
			<section>
				<Tabs
					onValueChange={(v) => setActiveTab(v as typeof activeTab)}
					value={activeTab}
				>
					<div className="mb-4 flex items-center justify-between">
						<div className="flex items-center gap-2">
							<span className="font-mono text-muted-foreground text-xs">
								{"//"}
							</span>
							<span className="font-mono text-primary text-xs tracking-wider">
								VIEW_MODE
							</span>
						</div>
						<TabsList className="bg-transparent p-0">
							<TabsTrigger className="tab-pill" value="explorer">
								<FolderTree className="h-4 w-4" />
								EXPLORER
							</TabsTrigger>
							<TabsTrigger className="tab-pill" value="contributors">
								<GitGraph className="h-4 w-4" />
								CONTRIBUTORS
							</TabsTrigger>
						</TabsList>
					</div>

					<TabsContent className="mt-0" value="explorer">
						<div
							className="grid gap-4 lg:grid-cols-[350px_1fr]"
							style={{ height: "calc(100vh - 320px)" }}
						>
							<div className="overflow-hidden rounded-lg border border-border bg-card">
								<VirtualizedFileTree
									defaultBranch={data.defaultBranch}
									fileTree={data.fileTree ?? []}
									isPrivate={data.isPrivate}
									name={data.name}
									onFileSelect={handleFileSelect}
									owner={data.owner}
									repoId={data.id}
								/>
							</div>
							<div className="overflow-hidden rounded-lg border border-border bg-card">
								{selectedFile ? (
									<FileViewer
										content={fileContent ?? null}
										error={fileError ?? null}
										filePath={selectedFile}
										isLoading={isFileLoading ?? false}
										repo={{
											owner: data.owner,
											name: data.name,
											branch: data.defaultBranch || "main",
											isPrivate: data.isPrivate,
										}}
									/>
								) : (
									<div className="flex h-full min-h-[400px] flex-col items-center justify-center text-muted-foreground">
										<Code2 className="mb-4 h-12 w-12 opacity-30" />
										<p className="font-mono text-sm">
											Select a file to view its contents
										</p>
									</div>
								)}
							</div>
						</div>
					</TabsContent>

					<TabsContent className="mt-0" value="contributors">
						<div className="rounded-lg border border-border bg-card p-4">
							{contributorsData && contributorsData.length > 0 && (
								<div className="mb-4 flex items-center justify-between">
									<div className="flex items-center gap-2">
										<span className="font-mono text-muted-foreground text-xs">
											{"//"}
										</span>
										<span className="font-mono text-primary text-xs tracking-wider">
											SORT_BY
										</span>
									</div>
									<Tabs
										onValueChange={(v) =>
											setContributorsSort(v as typeof contributorsSort)
										}
										value={contributorsSort}
									>
										<TabsList className="bg-transparent p-0">
											<TabsTrigger className="tab-pill" value="contributions">
												TOP_CONTRIBUTORS
											</TabsTrigger>
											<TabsTrigger className="tab-pill" value="newest">
												RECENTLY_ADDED
											</TabsTrigger>
										</TabsList>
									</Tabs>
								</div>
							)}
							{isContributorsLoading ? (
								<div className="flex items-center justify-center p-8">
									<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
								</div>
							) : contributorsData && contributorsData.length > 0 ? (
								<div
									className="relative w-full overflow-auto"
									ref={contributorsParentRef}
									style={{ height: "calc(100vh - 400px)" }}
								>
									<ContributorsList
										contributors={contributorsData}
										parentRef={contributorsParentRef}
									/>
								</div>
							) : (
								<div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
									<GitGraph className="mb-4 h-12 w-12 opacity-30" />
									<p className="font-mono text-sm">No contributors found</p>
								</div>
							)}
						</div>
					</TabsContent>
				</Tabs>
			</section>
			<footer className="mt-8 flex flex-col items-center justify-between gap-4 border-border border-t py-6 md:flex-row">
				<div className="flex items-center gap-6 font-mono text-muted-foreground text-xs">
					<div>
						<span className="font-bold text-primary">▲</span> repo-analyzer
					</div>
					<div className="flex items-center gap-4">
						<a
							className="flex items-center gap-1.5 transition-colors hover:text-primary"
							href="https://github.com/Its-Satyajit/git-insights-analyzer"
							rel="noopener noreferrer"
							target="_blank"
						>
							<SiGithub className="h-3 w-3" />
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
				<div className="flex items-center gap-6 font-mono text-muted-foreground text-xs">
					<div>
						<span className="text-primary">branch:</span> {data.defaultBranch}
					</div>
					<div>
						<span className="text-accent">status:</span> analyzed
					</div>
				</div>
			</footer>
		</div>
	);
}
