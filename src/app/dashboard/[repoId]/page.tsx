"use client";
import { useQuery } from "@tanstack/react-query";
import {
	ArrowRight,
	BarChart3,
	Code2,
	Database,
	FileCode,
	FolderTree,
	GitBranch,
	Github,
	GitGraph,
	Loader2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { Suspense, use, useState } from "react";
import type { FileTreeItem } from "~/components/CollapsibleFileTree";
import { AnalysisProgress } from "~/components/dashboard/AnalysisProgress";
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

	const data = response.data as {
		id: string;
		owner: string;
		name: string;
		fullName: string;
		defaultBranch: string;
		isPrivate: boolean;
		primaryLanguage: string;
		description?: string;
		avatarUrl?: string;
		fileTree: FileTreeItem[];
		analysisResults: Array<{
			totalFiles: number;
			totalDirectories: number;
			totalLines: number;
		}>;
		fileTypeBreakdown?: Record<string, number>;
	};
	const analysis = data.analysisResults?.[0];

	const handleFileSelect = (filePath: string) => {
		setSelectedFile(filePath);
	};

	return (
		<div className="flex flex-col gap-8">
			<header className="mb-2">
				<div className="flex items-start justify-between">
					<div>
						<div className="mb-3 flex items-center gap-3">
							{data.avatarUrl ? (
								<Image
									alt={data.owner}
									className="rounded-full border border-primary/30"
									height={36}
									src={data.avatarUrl}
									width={36}
								/>
							) : (
								<div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
									<GitBranch className="h-4 w-4 text-primary" />
								</div>
							)}
							<h1 className="font-bold font-mono text-2xl text-foreground tracking-tight">
								<span className="text-primary">{data.owner}</span>
								<span className="text-muted-foreground">/</span>
								<span className="text-foreground">{data.name}</span>
							</h1>
							{data.isPrivate && (
								<span className="rounded border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-primary text-xs">
									PRIVATE
								</span>
							)}
						</div>
						{data.description && (
							<p className="max-w-2xl font-mono text-muted-foreground text-sm leading-relaxed">
								{data.description}
							</p>
						)}
					</div>
					<Link href={`/dashboard/${repoId}/analysis`}>
						<Button className="gap-2 border border-accent/30 bg-accent/10 font-mono text-accent text-sm hover:bg-accent/20">
							<BarChart3 className="h-4 w-4" />
							<span>DEEP_ANALYSIS</span>
							<ArrowRight className="h-4 w-4" />
						</Button>
					</Link>
				</div>
			</header>
			<section>
				<div className="mb-4 flex items-center gap-2">
					<span className="font-mono text-muted-foreground text-xs">
						{"//"}
					</span>
					<span className="font-mono text-accent text-xs tracking-wider">
						REPOSITORY_OVERVIEW
					</span>
				</div>
				<div className="grid gap-6 lg:grid-cols-[1fr_400px]">
					<div className="grid gap-4 md:grid-cols-2">
						<StatCard
							color="sky"
							icon={FileCode}
							label="TOTAL_FILES"
							value={analysis?.totalFiles ?? 0}
						/>
						<StatCard
							color="blue"
							icon={FolderTree}
							label="DIRECTORIES"
							value={analysis?.totalDirectories ?? 0}
						/>
						<StatCard
							color="emerald"
							icon={Database}
							label="LINES_OF_CODE"
							value={(analysis?.totalLines ?? 0).toLocaleString()}
						/>
						<StatCard
							color="violet"
							icon={Code2}
							label="PRIMARY_LANG"
							value={data.primaryLanguage || "N/A"}
						/>
					</div>
					<div className="flex h-full flex-col justify-center">
						<AnalysisProgress repoId={repoId} />
					</div>
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
									className="grid gap-4"
									style={{
										gridTemplateColumns:
											"repeat(auto-fill, minmax(280px, 1fr))",
									}}
								>
									{contributorsData.map(
										(contributor: {
											id: string;
											githubLogin: string;
											avatarUrl: string | null;
											htmlUrl: string | null;
											contributions: number;
										}) => (
											<div
												className="flex items-center gap-4 rounded-lg border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/40"
												key={contributor.id}
											>
												{contributor.avatarUrl ? (
													<Image
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
													{contributor.htmlUrl && (
														<a
															className="block truncate font-mono text-muted-foreground text-xs hover:underline"
															href={contributor.htmlUrl}
															rel="noopener noreferrer"
															target="_blank"
														>
															{contributor.htmlUrl}
														</a>
													)}
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
										),
									)}
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
			<footer className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border py-6 md:flex-row">
				<div className="flex items-center gap-6 font-mono text-muted-foreground text-xs">
					<div>
						<span className="text-primary font-bold">▲</span> repo-analyzer
					</div>
					<div className="flex items-center gap-4">
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

function StatCard({
	icon: Icon,
	label,
	value,
	color,
}: {
	icon: React.ElementType;
	label: string;
	value: string | number;
	color: "sky" | "blue" | "emerald" | "violet";
}) {
	const colorClasses = {
		sky: "text-primary border-primary/30 bg-primary/5",
		blue: "text-primary border-primary/30 bg-primary/5",
		emerald: "text-accent border-accent/30 bg-accent/5",
		violet: "text-accent border-accent/30 bg-accent/5",
	};

	const iconBgClasses = {
		sky: "bg-primary/10",
		blue: "bg-primary/10",
		emerald: "bg-accent/10",
		violet: "bg-accent/10",
	};

	return (
		<div
			className={`group relative rounded-lg border p-4 transition-all hover:scale-[1.02] ${colorClasses[color]}`}
		>
			<div className="flex items-start justify-between">
				<div>
					<p className="mb-1 font-mono text-muted-foreground text-xs tracking-wider">
						{label}
					</p>
					<p className="font-bold font-mono text-2xl text-foreground">
						{value}
					</p>
				</div>
				<div
					className={`flex h-10 w-10 items-center justify-center rounded ${iconBgClasses[color]}`}
				>
					<Icon className="h-5 w-5" />
				</div>
			</div>
		</div>
	);
}
