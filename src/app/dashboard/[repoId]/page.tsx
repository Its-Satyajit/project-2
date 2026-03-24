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
	Loader2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { Suspense, use, useState } from "react";
import type { FileTreeItem } from "~/components/CollapsibleFileTree";
import { AnalysisProgress } from "~/components/dashboard/AnalysisProgress";
import { FileTypeChart } from "~/components/dashboard/FileTypeChart";
import { FileViewer } from "~/components/dashboard/FileViewer";
import { StatCardsSkeleton } from "~/components/dashboard/StatCards";
import { VirtualizedFileTree } from "~/components/dashboard/VirtualizedFileTree";
import { Button } from "~/components/ui/button";

import { api } from "~/lib/eden";

export default function RepoPage({
	params,
}: {
	params: Promise<{ repoId: string }>;
}) {
	return (
		<main className="relative min-h-screen overflow-hidden bg-[#050505] pt-14">
			<div className="absolute inset-0 -z-10">
				<div className="absolute inset-0 bg-[linear-gradient(rgba(20,20,20,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(20,20,20,0.4)_1px,transparent_1px)] bg-[size:30px_30px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(245,158,11,0.06),transparent_40%)]" />
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(6,182,212,0.05),transparent_40%)]" />
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
	const [explorerTab, setExplorerTab] = useState<"code" | "files">("code");

	const { data: response, isLoading } = useQuery({
		queryKey: ["repo-dashboard", repoId],
		queryFn: async () => {
			const res = await api.dashboard({ repoId: repoId as any }).get();
			return res;
		},
		enabled: !!repoId,
		retry: false,
	});

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
				<div className="mb-6 flex items-center gap-3 font-mono text-amber-400">
					<Loader2 className="h-5 w-5 animate-spin" />
					<span className="text-sm tracking-wider">INITIALIZING_DASHBOARD</span>
				</div>
				<div className="h-1 w-48 overflow-hidden rounded-full bg-white/10">
					<div
						className="h-full animate-pulse bg-amber-500"
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
			fileTypeBreakdownJson: Record<string, number>;
		}>;
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
									className="rounded-full border border-amber-500/30"
									height={36}
									src={data.avatarUrl}
									width={36}
								/>
							) : (
								<div className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10">
									<GitBranch className="h-4 w-4 text-amber-400" />
								</div>
							)}
							<h1 className="font-bold font-mono text-2xl text-white tracking-tight">
								<span className="text-amber-400">{data.owner}</span>
								<span className="text-white/50">/</span>
								<span className="text-white">{data.name}</span>
							</h1>
							{data.isPrivate && (
								<span className="rounded border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 font-mono text-orange-400 text-xs">
									PRIVATE
								</span>
							)}
						</div>
						{data.description && (
							<p className="max-w-2xl font-mono text-sm text-white/40 leading-relaxed">
								{data.description}
							</p>
						)}
					</div>
					<Link href={`/dashboard/${repoId}/analysis`}>
						<Button className="gap-2 border border-cyan-500/30 bg-cyan-500/10 font-mono text-cyan-400 text-sm hover:bg-cyan-500/20">
							<BarChart3 className="h-4 w-4" />
							<span>DEEP_ANALYSIS</span>
							<ArrowRight className="h-4 w-4" />
						</Button>
					</Link>
				</div>
			</header>

			<section>
				<div className="mb-4 flex items-center gap-2">
					<span className="font-mono text-white/30 text-xs">{"//"}</span>
					<span className="font-mono text-sky-400 text-xs tracking-wider">
						REPO_STATS
					</span>
				</div>
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
			</section>

			<section>
				<div className="mb-4 flex items-center gap-2">
					<span className="font-mono text-white/30 text-xs">{"//"}</span>
					<span className="font-mono text-emerald-400 text-xs tracking-wider">
						ANALYSIS_STATUS
					</span>
				</div>
				<div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.03] p-4">
					<AnalysisProgress repoId={repoId} />
				</div>
			</section>

			<section>
				<div className="mb-4 flex items-center gap-2">
					<span className="font-mono text-white/30 text-xs">{"//"}</span>
					<span className="font-mono text-blue-400 text-xs tracking-wider">
						EXPLORER
					</span>
				</div>

				<div className="mb-4 flex items-center gap-2">
					<button
						className={`tab-pill ${explorerTab === "code" ? "active" : ""}`}
						onClick={() => setExplorerTab("code")}
						type="button"
					>
						<Code2 className="mr-1.5 h-3.5 w-3.5" />
						Code
					</button>
					<button
						className={`tab-pill ${explorerTab === "files" ? "active" : ""}`}
						onClick={() => setExplorerTab("files")}
						type="button"
					>
						<BarChart3 className="mr-1.5 h-3.5 w-3.5" />
						File Distribution
					</button>
				</div>

				{explorerTab === "code" ? (
					<div
						className="grid gap-4 lg:grid-cols-[350px_1fr]"
						style={{ height: "calc(100vh - 380px)" }}
					>
						<div className="overflow-hidden rounded-lg border border-white/5 bg-white/[0.02]">
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
						<div className="overflow-hidden rounded-lg border border-white/5 bg-white/[0.02]">
							{selectedFile ? (
								<FileViewer
									content={fileContent ?? null}
									error={fileError ?? null}
									filePath={selectedFile}
									isLoading={isFileLoading ?? false}
								/>
							) : (
								<div className="flex h-full min-h-[400px] flex-col items-center justify-center text-white/30">
									<Code2 className="mb-4 h-12 w-12 opacity-30" />
									<p className="font-mono text-sm">
										Select a file to view its contents
									</p>
								</div>
							)}
						</div>
					</div>
				) : analysis?.fileTypeBreakdownJson ? (
					<div className="rounded-lg border border-white/5 bg-white/[0.02] p-6">
						<FileTypeChart
							data={analysis.fileTypeBreakdownJson as Record<string, number>}
						/>
					</div>
				) : null}
			</section>

			<footer className="mt-4 flex items-center justify-between border-white/5 border-t pt-6">
				<div className="font-mono text-white/20 text-xs">
					<span className="text-amber-400">branch:</span> {data.defaultBranch}
				</div>
				<div className="font-mono text-white/20 text-xs">
					<span className="text-green-400">status:</span> analyzed
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
		sky: "text-sky-400 border-sky-500/30 bg-sky-500/5",
		blue: "text-blue-400 border-blue-500/30 bg-blue-500/5",
		emerald: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
		violet: "text-violet-400 border-violet-500/30 bg-violet-500/5",
	};

	const iconBgClasses = {
		sky: "bg-sky-500/10",
		blue: "bg-blue-500/10",
		emerald: "bg-emerald-500/10",
		violet: "bg-violet-500/10",
	};

	return (
		<div
			className={`group relative rounded-lg border p-4 transition-all hover:scale-[1.02] ${colorClasses[color]}`}
		>
			<div className="flex items-start justify-between">
				<div>
					<p className="mb-1 font-mono text-white/50 text-xs tracking-wider">
						{label}
					</p>
					<p className="font-bold font-mono text-2xl text-white">{value}</p>
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
