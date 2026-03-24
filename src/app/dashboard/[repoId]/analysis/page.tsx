"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
	ArrowLeft,
	BarChart3,
	Check,
	Copy,
	FileCode,
	FileType,
	FolderTree,
	GitBranch,
	Layers,
	Loader2,
	Network,
	Search,
	Target,
	X,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import React, { Activity, Suspense, useMemo, useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Scatter,
	ScatterChart,
	Tooltip,
	XAxis,
	YAxis,
	ZAxis,
} from "recharts";
import { FilterBar, type FilterState } from "~/components/dashboard/FilterBar";
import { Treemap } from "~/components/dashboard/Treemap";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Skeleton } from "~/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useRepoStatus } from "~/hooks/useRepoStatus";
import { api } from "~/lib/eden";
import "~/styles/analysis.css";

type Node = {
	id: string;
	path: string;
	language: string;
	imports: number;
	loc?: number;
};

type HotspotDataPoint = {
	path: string;
	language: string;
	fanIn: number;
	fanOut: number;
	loc: number;
	score: number;
	rank: number;
};

const CHART_COLORS = [
	"#f59e0b",
	"#10b981",
	"#0ea5e9",
	"#f43f5e",
	"#8b5cf6",
	"#ec4899",
	"#06b6d4",
	"#84cc16",
];

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.06 },
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 16 },
	visible: { opacity: 1, y: 0 },
};

const staggerDelays = [0, 0.1, 0.2, 0.3, 0.4, 0.5];

function AnalysisContent() {
	const params = useParams();
	const router = useRouter();
	const repoId = params.repoId as string;

	const { data: status, isLoading, error } = useRepoStatus(repoId);

	const [searchQuery, setSearchQuery] = useState("");
	const [selectedNode, setSelectedNode] = useState<Node | null>(null);
	const [activeTab, setActiveTab] = useState<
		"overview" | "charts" | "treemap" | "hotspots"
	>("overview");
	const [selectedHotspotFile, setSelectedHotspotFile] = useState<string | null>(
		null,
	);
	const [copied, setCopied] = useState(false);
	const [treemapColorMode, setTreemapColorMode] = useState<
		"language" | "hotspot"
	>("language");
	const [hotspotViewMode, setHotspotViewMode] = useState<"scatter" | "table">(
		"scatter",
	);
	const [filters, setFilters] = useState<FilterState>({
		selectedExtensions: [],
		showHotspotsOnly: false,
		hotspotThreshold: 0,
	});

	const graph = status?.analysis?.dependencyGraph;
	const hotSpotData = status?.analysis?.hotSpotData;
	const summary = status?.analysis?.summary;
	const { metadata } = status ?? {};

	const allExtensions = useMemo(() => {
		if (!graph?.nodes) return [];
		const exts = new Set<string>();
		for (const node of graph.nodes) {
			const path = node.path;
			const ext = path.split(".").pop() ?? "";
			if (ext) exts.add(ext);
		}
		return Array.from(exts).sort();
	}, [graph?.nodes]);

	const { data: hotspotFileContent, isLoading: isHotspotContentLoading } =
		useQuery({
			queryKey: ["hotspot-file-content", repoId, selectedHotspotFile],
			queryFn: async () => {
				if (!selectedHotspotFile) return null;
				const owner = metadata?.owner;
				const repo = metadata?.name;
				const branch = metadata?.defaultBranch || "main";
				const isPrivate = metadata?.isPrivate;

				if (!isPrivate) {
					const url = `https://raw.githubusercontent.com/${owner}/${repo}/refs/heads/${branch}/${selectedHotspotFile}`;
					const res = await fetch(url);
					if (!res.ok) throw new Error("Failed to fetch public file");
					return res.text();
				}

				const res = await api["file-content"].get({
					query: { repoId, path: selectedHotspotFile },
				});
				if (res.error) {
					const errorVal = res.error.value;
					const errorMsg =
						typeof errorVal === "string"
							? errorVal
							: errorVal &&
									typeof errorVal === "object" &&
									"summary" in errorVal
								? (errorVal as { summary: string }).summary
								: JSON.stringify(errorVal);
					throw new Error(errorMsg);
				}
				return res.data?.content;
			},
			enabled: !!selectedHotspotFile,
		});

	const filteredNodes = useMemo(() => {
		if (!graph?.nodes) return [];
		const query = searchQuery.toLowerCase();
		return graph.nodes
			.filter((node) => {
				if (query && !node.path.toLowerCase().includes(query)) return false;
				const ext = node.path.split(".").pop() ?? "";
				if (
					filters.selectedExtensions.length > 0 &&
					!filters.selectedExtensions.includes(ext)
				) {
					return false;
				}
				return true;
			})
			.sort((a, b) => b.imports - a.imports);
	}, [graph?.nodes, searchQuery, filters.selectedExtensions]);

	const topImportedFiles = useMemo(() => {
		if (!graph?.nodes) return [];
		return [...graph.nodes]
			.sort((a, b) => b.imports - a.imports)
			.slice(0, 10)
			.map((n) => ({
				name: n.path.split("/").pop() || n.path,
				path: n.path,
				imports: n.imports,
			}));
	}, [graph?.nodes]);

	const languageData = useMemo(() => {
		if (!graph?.metadata.languageBreakdown) return [];
		return Object.entries(graph.metadata.languageBreakdown)
			.map(([name, value]) => ({ name, value }))
			.sort((a, b) => b.value - a.value);
	}, [graph?.metadata.languageBreakdown]);

	const filesByLanguage = useMemo(() => {
		if (!graph?.nodes) return [];
		const counts: Record<string, number> = {};
		for (const node of graph.nodes) {
			counts[node.language] = (counts[node.language] || 0) + 1;
		}
		return Object.entries(counts)
			.map(([name, count]) => ({ name, count }))
			.sort((a, b) => b.count - a.count);
	}, [graph?.nodes]);

	const locByLanguage = useMemo(() => {
		if (!graph?.nodes) return [];
		const totals: Record<string, number> = {};
		for (const node of graph.nodes) {
			totals[node.language] = (totals[node.language] || 0) + (node.loc || 0);
		}
		return Object.entries(totals)
			.map(([name, loc]) => ({ name, loc }))
			.sort((a, b) => b.loc - a.loc);
	}, [graph?.nodes]);

	if (isLoading) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center bg-mesh pt-14">
				<div className="flex flex-col items-center gap-6">
					<div className="relative">
						<div className="absolute inset-0 animate-pulse rounded-full bg-amber-500/20 blur-xl" />
						<Loader2 className="relative h-12 w-12 animate-spin text-amber-500" />
					</div>
					<div className="text-center">
						<p className="font-mono text-neutral-400 text-sm uppercase tracking-widest">
							Analyzing Repository
						</p>
						<p className="mt-1 font-mono text-neutral-600 text-xs">
							Scanning dependencies...
						</p>
					</div>
				</div>
			</div>
		);
	}

	if (error || !status) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center bg-mesh pt-14">
				<div className="card-glass rounded-lg p-8 text-center">
					<div className="mb-4 flex justify-center">
						<div className="icon-box border-rose-500/30">
							<X className="h-6 w-6 text-rose-500" />
						</div>
					</div>
					<h2 className="mb-2 font-mono font-semibold text-lg tracking-tight">
						Unable to Load Repository
					</h2>
					<p className="mb-6 font-mono text-neutral-500 text-sm">
						The repository may not exist or may be private.
					</p>
					<button
						className="btn-primary"
						onClick={() => router.push("/")}
						type="button"
					>
						Go Back Home
					</button>
				</div>
			</div>
		);
	}

	const getConnections = (nodeId: string) => {
		if (!graph) return { imports: [], importedBy: [] };
		const imports = graph.edges
			.filter((e) => e.source === nodeId)
			.map((e) => graph.nodes.find((n) => n.id === e.target))
			.filter(Boolean) as Node[];
		const importedBy = graph.edges
			.filter((e) => e.target === nodeId)
			.map((e) => graph.nodes.find((n) => n.id === e.source))
			.filter(Boolean) as Node[];
		return { imports, importedBy };
	};

	const connections = selectedNode ? getConnections(selectedNode.id) : null;

	return (
		<motion.div
			animate="visible"
			className="min-h-screen bg-grid-pattern bg-mesh pt-14"
			initial="hidden"
			variants={containerVariants}
		>
			<div className="border-neutral-800 border-b bg-black/50 backdrop-blur-xl">
				<div className="mx-auto max-w-7xl px-6 py-5">
					<motion.div variants={itemVariants}>
						<div className="mb-5 flex items-start justify-between">
							<div className="flex flex-col gap-1">
								<button
									className="group mb-3 flex w-fit items-center gap-2 text-left font-mono text-neutral-500 text-xs uppercase tracking-wider transition-colors hover:text-amber-500"
									onClick={() => router.push(`/dashboard/${repoId}`)}
									type="button"
								>
									<ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
									Back to Dashboard
								</button>
								<div className="flex items-center gap-3">
									{metadata?.avatarUrl ? (
										<Image
											alt={metadata.owner}
											className="rounded-full"
											height={40}
											src={metadata.avatarUrl}
											width={40}
										/>
									) : (
										<div className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10">
											<GitBranch className="h-5 w-5 text-amber-400" />
										</div>
									)}
									<div>
										<h1 className="font-bold font-mono text-2xl text-neutral-100 tracking-tight">
											{metadata?.fullName ?? "..."}
										</h1>
										<p className="font-mono text-neutral-500 text-xs uppercase tracking-widest">
											{status?.analysis?.summary
												? "Comprehensive Analysis"
												: "Dependency Analysis"}
										</p>
									</div>
								</div>
							</div>
							<div className="flex gap-3">
								<div className="stat-card">
									<p className="stat-value">
										{graph?.metadata.totalNodes ?? 0}
									</p>
									<p className="stat-label">Files</p>
								</div>
								<div className="stat-card">
									<p className="stat-value">
										{graph?.metadata.totalEdges ?? 0}
									</p>
									<p className="stat-label">Connections</p>
								</div>
								<div className="stat-card">
									<p className="stat-value">
										{
											Object.keys(graph?.metadata.languageBreakdown ?? {})
												.length
										}
									</p>
									<p className="stat-label">Languages</p>
								</div>
							</div>
						</div>

						<Tabs
							className="w-full"
							onValueChange={(v) => setActiveTab(v as typeof activeTab)}
							value={activeTab}
						>
							<TabsList className="flex gap-1 bg-transparent p-0">
								<TabsTrigger className="tab-pill" value="overview">
									Overview
								</TabsTrigger>
								<TabsTrigger className="tab-pill" value="charts">
									Charts
								</TabsTrigger>
								<TabsTrigger className="tab-pill" value="treemap">
									Treemap
								</TabsTrigger>
								<TabsTrigger className="tab-pill" value="hotspots">
									Hotspots
								</TabsTrigger>
							</TabsList>
						</Tabs>
					</motion.div>
				</div>
			</div>

			<div className="mx-auto max-w-7xl p-6">
				{activeTab === "overview" ? (
					<motion.div variants={itemVariants}>
						{summary ? (
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								<motion.div
									className="card-glass animate-fade-in-up rounded-lg p-5"
									style={{ animationDelay: "0.1s" }}
								>
									<div className="mb-4 flex items-center gap-3">
										<div className="icon-box border-amber-500/30">
											<BarChart3 className="h-4 w-4 text-amber-500" />
										</div>
										<CardTitle className="font-mono font-semibold text-sm uppercase tracking-wider">
											Basic Statistics
										</CardTitle>
									</div>
									<div className="space-y-3">
										<div className="flex items-center justify-between border-neutral-800 border-b pb-2">
											<span className="font-mono text-neutral-500 text-xs uppercase tracking-wider">
												Total Files
											</span>
											<span className="font-data font-medium text-neutral-200 text-sm">
												{summary.basic.totalFiles}
											</span>
										</div>
										<div className="flex items-center justify-between border-neutral-800 border-b pb-2">
											<span className="font-mono text-neutral-500 text-xs uppercase tracking-wider">
												Directories
											</span>
											<span className="font-data font-medium text-neutral-200 text-sm">
												{summary.basic.totalDirectories}
											</span>
										</div>
										<div className="flex items-center justify-between pb-2">
											<span className="font-mono text-neutral-500 text-xs uppercase tracking-wider">
												Lines of Code
											</span>
											<span className="font-data font-medium text-neutral-200 text-sm">
												{summary.basic.totalLines.toLocaleString()}
											</span>
										</div>
									</div>
								</motion.div>

								<motion.div
									className="card-glass animate-fade-in-up rounded-lg p-5"
									style={{ animationDelay: "0.15s" }}
								>
									<div className="mb-4 flex items-center gap-3">
										<div className="icon-box border-emerald-500/30">
											<Layers className="h-4 w-4 text-emerald-500" />
										</div>
										<CardTitle className="font-mono font-semibold text-sm uppercase tracking-wider">
											Languages
										</CardTitle>
									</div>
									<div className="mb-4 flex items-baseline gap-2">
										<span className="font-bold font-mono text-neutral-100 text-xl">
											{summary.languages.primaryLanguage}
										</span>
										<span className="font-mono text-neutral-500 text-xs uppercase">
											(Primary)
										</span>
									</div>
									<div className="space-y-2.5">
										{summary.languages.topLanguages.map((lang) => (
											<div
												className="flex items-center justify-between"
												key={lang.name}
											>
												<span className="font-data text-neutral-400 text-xs">
													{lang.name}
												</span>
												<div className="flex items-center gap-2">
													<div className="progress-bar w-16">
														<div
															className="progress-fill"
															style={{ width: `${lang.percentage}%` }}
														/>
													</div>
													<span className="w-10 text-right font-data text-neutral-400 text-xs">
														{lang.percentage.toFixed(1)}%
													</span>
												</div>
											</div>
										))}
									</div>
								</motion.div>

								<motion.div
									className="card-glass animate-fade-in-up rounded-lg p-5"
									style={{ animationDelay: "0.2s" }}
								>
									<div className="mb-4 flex items-center gap-3">
										<div className="icon-box border-sky-500/30">
											<FolderTree className="h-4 w-4 text-sky-500" />
										</div>
										<CardTitle className="font-mono font-semibold text-sm uppercase tracking-wider">
											Structure
										</CardTitle>
									</div>
									<div className="space-y-3">
										<div className="flex items-center justify-between border-neutral-800 border-b pb-2">
											<span className="font-mono text-neutral-500 text-xs uppercase tracking-wider">
												Max Depth
											</span>
											<span className="font-data font-medium text-neutral-200 text-sm">
												{summary.structure.maxDepth}
											</span>
										</div>
										<div>
											<span className="mb-2 block font-mono text-neutral-500 text-xs uppercase tracking-wider">
												Top-level Directories
											</span>
											<div className="flex flex-wrap gap-1.5">
												{summary.structure.topLevelDirectories.map((dir) => (
													<span className="badge" key={dir}>
														{dir}
													</span>
												))}
											</div>
										</div>
									</div>
								</motion.div>

								<motion.div
									className="card-glass animate-fade-in-up rounded-lg p-5"
									style={{ animationDelay: "0.25s" }}
								>
									<div className="mb-4 flex items-center gap-3">
										<div className="icon-box border-violet-500/30">
											<Network className="h-4 w-4 text-violet-500" />
										</div>
										<CardTitle className="font-mono font-semibold text-sm uppercase tracking-wider">
											Dependencies
										</CardTitle>
									</div>
									<div className="space-y-3">
										<div className="flex items-center justify-between border-neutral-800 border-b pb-2">
											<span className="font-mono text-neutral-500 text-xs uppercase tracking-wider">
												Total Files
											</span>
											<span className="font-data font-medium text-neutral-200 text-sm">
												{summary.dependencies.totalNodes}
											</span>
										</div>
										<div className="flex items-center justify-between border-neutral-800 border-b pb-2">
											<span className="font-mono text-neutral-500 text-xs uppercase tracking-wider">
												Connections
											</span>
											<span className="font-data font-medium text-neutral-200 text-sm">
												{summary.dependencies.totalEdges}
											</span>
										</div>
										{summary.dependencies.mostDependedUpon.length > 0 && (
											<div>
												<h4 className="mb-2 font-medium font-mono text-neutral-500 text-xs uppercase tracking-wider">
													Most Depended Upon
												</h4>
												<div className="space-y-1.5">
													{summary.dependencies.mostDependedUpon
														.slice(0, 5)
														.map((item) => (
															<div
																className="flex items-center justify-between"
																key={item.path}
															>
																<span className="max-w-[180px] truncate font-data text-neutral-400 text-xs">
																	{item.path.split("/").pop()}
																</span>
																<span className="font-data text-amber-500">
																	{item.fanIn}
																</span>
															</div>
														))}
												</div>
											</div>
										)}
									</div>
								</motion.div>

								<motion.div
									className="card-glass animate-fade-in-up rounded-lg p-5"
									style={{ animationDelay: "0.3s" }}
								>
									<div className="mb-4 flex items-center gap-3">
										<div className="icon-box border-rose-500/30">
											<Target className="h-4 w-4 text-rose-500" />
										</div>
										<CardTitle className="font-mono font-semibold text-sm uppercase tracking-wider">
											Hotspots
										</CardTitle>
									</div>
									{summary.hotspots.topHotspots.length > 0 ? (
										<div className="space-y-2">
											{summary.hotspots.topHotspots
												.slice(0, 5)
												.map((hotspot) => (
													<div
														className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-900/50 p-2.5 transition-colors hover:border-neutral-700"
														key={hotspot.path}
													>
														<div className="min-w-0 flex-1">
															<p className="truncate font-data text-neutral-300 text-xs">
																{hotspot.path.split("/").pop()}
															</p>
															<p className="font-mono text-neutral-600 text-xs">
																Score: {hotspot.score.toFixed(2)}
															</p>
														</div>
														<span className="badge-amber ml-2">
															#{hotspot.rank}
														</span>
													</div>
												))}
										</div>
									) : (
										<p className="font-mono text-neutral-500 text-xs">
											No hotspots detected.
										</p>
									)}
								</motion.div>

								<motion.div
									className="card-glass animate-fade-in-up rounded-lg p-5"
									style={{ animationDelay: "0.35s" }}
								>
									<div className="mb-4 flex items-center gap-3">
										<div className="icon-box border-cyan-500/30">
											<FileType className="h-4 w-4 text-cyan-500" />
										</div>
										<CardTitle className="font-mono font-semibold text-sm uppercase tracking-wider">
											File Types
										</CardTitle>
									</div>
									<div className="space-y-2">
										{summary.fileTypes.topExtensions.map((ext) => (
											<div
												className="flex items-center justify-between border-neutral-800 border-b py-1.5 last:border-0"
												key={ext.extension}
											>
												<div className="flex items-center gap-2">
													<span className="font-data text-neutral-400 text-xs">
														.{ext.extension}
													</span>
												</div>
												<span className="font-data text-neutral-400 text-xs">
													{ext.count}
												</span>
											</div>
										))}
									</div>
								</motion.div>
							</div>
						) : (
							<div className="card-glass flex flex-col items-center justify-center rounded-lg py-16">
								<div className="relative mb-6">
									<div className="absolute inset-0 animate-pulse rounded-full bg-amber-500/10 blur-xl" />
									<BarChart3 className="relative h-12 w-12 text-neutral-600" />
								</div>
								<p className="font-mono text-neutral-400 text-sm">
									Analysis in progress...
								</p>
								<p className="mt-1 font-mono text-neutral-600 text-xs">
									Summary data will appear once analysis completes.
								</p>
							</div>
						)}
					</motion.div>
				) : activeTab === "charts" ? (
					<div className="space-y-4">
						<div className="grid gap-4 lg:grid-cols-2">
							<motion.div
								className="card-glass animate-fade-in-up rounded-lg p-5"
								style={{ animationDelay: "0.1s" }}
							>
								<h3 className="mb-4 font-mono font-semibold text-neutral-400 text-xs uppercase tracking-widest">
									Top Imported Files
								</h3>
								<ResponsiveContainer height={280}>
									<BarChart data={topImportedFiles} layout="vertical">
										<XAxis
											axisLine={{ stroke: "#262626" }}
											tick={{ fill: "#525252", fontSize: 11 }}
											type="number"
										/>
										<YAxis
											axisLine={{ stroke: "#262626" }}
											dataKey="name"
											tick={{ fill: "#525252", fontSize: 10 }}
											type="category"
											width={90}
										/>
										<Tooltip
											content={({ active, payload }) => {
												if (active && payload && payload.length && payload[0]) {
													const data = payload[0];
													return (
														<div className="rounded-md border border-neutral-700 bg-neutral-900 p-2 shadow-lg">
															<p className="font-data text-neutral-200 text-xs">
																{data.payload.path}
															</p>
															<p className="mt-1 font-mono text-neutral-500 text-xs">
																{data.value} imports
															</p>
														</div>
													);
												}
												return null;
											}}
										/>
										<Bar
											dataKey="imports"
											fill="#f59e0b"
											radius={[0, 4, 4, 0]}
										/>
									</BarChart>
								</ResponsiveContainer>
							</motion.div>

							<motion.div
								className="card-glass animate-fade-in-up rounded-lg p-5"
								style={{ animationDelay: "0.15s" }}
							>
								<h3 className="mb-4 font-mono font-semibold text-neutral-400 text-xs uppercase tracking-widest">
									Language Distribution
								</h3>
								<ResponsiveContainer height={280}>
									<PieChart>
										<Pie
											cx="50%"
											cy="50%"
											data={languageData}
											dataKey="value"
											innerRadius={50}
											label={({ name, percent = 0 }) =>
												`${name} ${(percent * 100).toFixed(0)}%`
											}
											labelLine={false}
											outerRadius={90}
											paddingAngle={2}
										>
											{languageData.map((entry, index) => (
												<Cell
													fill={CHART_COLORS[index % CHART_COLORS.length]}
													key={`cell-${entry.name}`}
												/>
											))}
										</Pie>
										<Tooltip
											content={({ active, payload }) => {
												if (active && payload && payload.length && payload[0]) {
													return (
														<div className="rounded-md border border-neutral-700 bg-neutral-900 p-2 shadow-lg">
															<p className="font-mono text-neutral-200 text-xs">
																{payload[0].name}
															</p>
															<p className="font-data text-neutral-500 text-xs">
																{payload[0].value?.toLocaleString()} files
															</p>
														</div>
													);
												}
												return null;
											}}
										/>
									</PieChart>
								</ResponsiveContainer>
							</motion.div>

							<motion.div
								className="card-glass animate-fade-in-up rounded-lg p-5"
								style={{ animationDelay: "0.2s" }}
							>
								<h3 className="mb-4 font-mono font-semibold text-neutral-400 text-xs uppercase tracking-widest">
									Files by Language
								</h3>
								<ResponsiveContainer height={280}>
									<BarChart data={filesByLanguage}>
										<XAxis
											axisLine={{ stroke: "#262626" }}
											dataKey="name"
											tick={{ fill: "#525252", fontSize: 10 }}
										/>
										<YAxis
											axisLine={{ stroke: "#262626" }}
											tick={{ fill: "#525252", fontSize: 11 }}
										/>
										<Tooltip
											content={({ active, payload }) => {
												if (
													active &&
													payload &&
													payload.length &&
													payload[0] &&
													payload[0].payload
												) {
													return (
														<div className="rounded-md border border-neutral-700 bg-neutral-900 p-2 shadow-lg">
															<p className="font-mono text-neutral-200 text-xs">
																{payload[0].payload.name}
															</p>
															<p className="font-data text-neutral-500 text-xs">
																{payload[0].value} files
															</p>
														</div>
													);
												}
												return null;
											}}
										/>
										<Bar dataKey="count" radius={[4, 4, 0, 0]}>
											{filesByLanguage.map((entry) => (
												<Cell
													fill={
														CHART_COLORS[
															filesByLanguage.indexOf(entry) %
																CHART_COLORS.length
														]
													}
													key={`cell-${entry.name}`}
												/>
											))}
										</Bar>
									</BarChart>
								</ResponsiveContainer>
							</motion.div>

							<motion.div
								className="card-glass animate-fade-in-up rounded-lg p-5"
								style={{ animationDelay: "0.25s" }}
							>
								<h3 className="mb-4 font-mono font-semibold text-neutral-400 text-xs uppercase tracking-widest">
									Lines of Code by Language
								</h3>
								<ResponsiveContainer height={280}>
									<BarChart data={locByLanguage}>
										<XAxis
											axisLine={{ stroke: "#262626" }}
											dataKey="name"
											tick={{ fill: "#525252", fontSize: 10 }}
										/>
										<YAxis
											axisLine={{ stroke: "#262626" }}
											tick={{ fill: "#525252", fontSize: 11 }}
										/>
										<Tooltip
											content={({ active, payload }) => {
												if (
													active &&
													payload &&
													payload.length &&
													payload[0] &&
													payload[0].payload
												) {
													return (
														<div className="rounded-md border border-neutral-700 bg-neutral-900 p-2 shadow-lg">
															<p className="font-mono text-neutral-200 text-xs">
																{payload[0].payload.name}
															</p>
															<p className="font-data text-neutral-500 text-xs">
																{Number(payload[0].value).toLocaleString()}{" "}
																lines
															</p>
														</div>
													);
												}
												return null;
											}}
										/>
										<Bar dataKey="loc" radius={[4, 4, 0, 0]}>
											{locByLanguage.map((entry) => (
												<Cell
													fill={
														CHART_COLORS[
															locByLanguage.indexOf(entry) % CHART_COLORS.length
														]
													}
													key={`cell-${entry.name}`}
												/>
											))}
										</Bar>
									</BarChart>
								</ResponsiveContainer>
							</motion.div>
						</div>

						<motion.div
							className="card-glass animate-fade-in-up rounded-lg p-5"
							style={{ animationDelay: "0.3s" }}
						>
							<h3 className="mb-4 font-mono font-semibold text-neutral-400 text-xs uppercase tracking-widest">
								Dependency Overview
							</h3>
							<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
								<div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-center">
									<p className="font-data font-semibold text-2xl text-amber-500">
										{graph?.metadata.totalNodes ?? 0}
									</p>
									<p className="font-mono text-neutral-500 text-xs uppercase tracking-wider">
										Total Files
									</p>
								</div>
								<div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
									<p className="font-data font-semibold text-2xl text-emerald-500">
										{graph?.metadata.totalEdges ?? 0}
									</p>
									<p className="font-mono text-neutral-500 text-xs uppercase tracking-wider">
										Dependencies
									</p>
								</div>
								<div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4 text-center">
									<p className="font-data font-semibold text-2xl text-orange-500">
										{graph?.metadata.unresolvedImports ?? 0}
									</p>
									<p className="font-mono text-neutral-500 text-xs uppercase tracking-wider">
										Unresolved
									</p>
								</div>
								<div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-4 text-center">
									<p className="font-data font-semibold text-2xl text-violet-500">
										{
											Object.keys(graph?.metadata.languageBreakdown ?? {})
												.length
										}
									</p>
									<p className="font-mono text-neutral-500 text-xs uppercase tracking-wider">
										Languages
									</p>
								</div>
							</div>
						</motion.div>
					</div>
				) : activeTab === "treemap" ? (
					<motion.div variants={itemVariants}>
						<div className="mb-4 flex items-center justify-between">
							<h3 className="font-mono font-semibold text-neutral-400 text-xs uppercase tracking-widest">
								File Treemap
							</h3>
							<div className="flex gap-2">
								<button
									className={`tab-pill ${
										treemapColorMode === "language" ? "active" : ""
									}`}
									onClick={() => setTreemapColorMode("language")}
									type="button"
								>
									By Language
								</button>
								<button
									className={`tab-pill ${
										treemapColorMode === "hotspot" ? "active" : ""
									}`}
									onClick={() => setTreemapColorMode("hotspot")}
									type="button"
								>
									By Hotspot
								</button>
							</div>
						</div>
						<div className="h-[calc(100vh-240px)]">
							<Activity mode={activeTab === "treemap" ? "visible" : "hidden"}>
								<Treemap
									colorMode={treemapColorMode}
									onFileClick={(file) => setSelectedHotspotFile(file.path)}
									repoId={repoId}
								/>
							</Activity>
						</div>
					</motion.div>
				) : (
					<motion.div variants={itemVariants}>
						<div className="mb-4 flex items-center justify-between">
							<h3 className="font-mono font-semibold text-neutral-400 text-xs uppercase tracking-widest">
								Hotspots
							</h3>
							<div className="flex gap-2">
								<button
									className={`tab-pill ${hotspotViewMode === "scatter" ? "active" : ""}`}
									onClick={() => setHotspotViewMode("scatter")}
									type="button"
								>
									Scatter
								</button>
								<button
									className={`tab-pill ${hotspotViewMode === "table" ? "active" : ""}`}
									onClick={() => setHotspotViewMode("table")}
									type="button"
								>
									Table
								</button>
							</div>
						</div>

						{hotspotViewMode === "scatter" ? (
							<div className="card-glass rounded-lg p-5">
								{/* Header with filter */}
								<div className="mb-4 flex items-center justify-between">
									<h4 className="font-medium font-mono text-neutral-500 text-xs uppercase tracking-wider">
										Complexity vs. Connectivity
									</h4>
									{hotSpotData && hotSpotData.length > 0 && (
										<div className="flex items-center gap-3">
											<span className="font-mono text-neutral-600 text-xs">
												Show top:
											</span>
											<select
												className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1 font-mono text-neutral-300 text-xs"
												defaultValue={Math.min(25, hotSpotData.length)}
												onChange={(e) => {
													// Store the filter value in a ref or state if needed
													// For now, we'll use a simple approach
													const container = e.target.closest(".card-glass");
													if (container) {
														const scatter =
															container.querySelector(".recharts-scatter");
														if (scatter) {
															// Trigger re-render by updating data attribute
															scatter.setAttribute(
																"data-limit",
																e.target.value,
															);
														}
													}
												}}
											>
												<option value={10}>10</option>
												<option value={25}>25</option>
												<option value={50}>50</option>
												<option value={hotSpotData.length}>
													All ({hotSpotData.length})
												</option>
											</select>
										</div>
									)}
								</div>

								{/* Chart with quadrant backgrounds */}
								<ResponsiveContainer height={420}>
									<ScatterChart
										margin={{ top: 30, right: 30, bottom: 60, left: 60 }}
									>
										{/* Quadrant background rectangles */}
										{(() => {
											if (!hotSpotData || hotSpotData.length === 0) return null;
											const maxFanIn = Math.max(
												...hotSpotData.map((d) => d.fanIn),
												1,
											);
											const maxFanOut = Math.max(
												...hotSpotData.map((d) => d.fanOut),
												1,
											);
											const midFanIn = maxFanIn / 2;
											const midFanOut = maxFanOut / 2;
											return (
												<>
													{/* Top-right: Hubs (high both) - Red zone */}
													<rect
														fill="#f43f5e"
														fillOpacity={0.03}
														height={210}
														width={window.innerWidth > 768 ? 350 : 150}
														x={midFanIn}
														y={0}
													/>
													{/* Top-left: Utilities (high fan-out, low fan-in) - Yellow zone */}
													<rect
														fill="#f59e0b"
														fillOpacity={0.03}
														height={210}
														width={window.innerWidth > 768 ? 350 : 150}
														x={0}
														y={0}
													/>
													{/* Bottom-right: Dependents (high fan-in, low fan-out) - Blue zone */}
													<rect
														fill="#3b82f6"
														fillOpacity={0.03}
														height={210}
														width={window.innerWidth > 768 ? 350 : 150}
														x={midFanIn}
														y={midFanOut}
													/>
													{/* Bottom-left: Isolated (low both) - Green zone */}
													<rect
														fill="#10b981"
														fillOpacity={0.03}
														height={210}
														width={window.innerWidth > 768 ? 350 : 150}
														x={0}
														y={midFanOut}
													/>
												</>
											);
										})()}
										<CartesianGrid
											stroke="#1f1f1f"
											strokeDasharray="3 3"
											vertical={true}
										/>
										<XAxis
											axisLine={{ stroke: "#333" }}
											dataKey="fanIn"
											label={{
												value: "Dependencies (files that depend on this)",
												position: "bottom",
												offset: 40,
												fill: "#737373",
												fontSize: 11,
												fontFamily: "IBM Plex Mono",
											}}
											name="Dependencies"
											tick={{ fill: "#737373", fontSize: 10 }}
											tickLine={{ stroke: "#333" }}
											type="number"
										/>
										<YAxis
											axisLine={{ stroke: "#333" }}
											dataKey="fanOut"
											label={{
												value: "Imports (files this depends on)",
												angle: -90,
												position: "insideLeft",
												offset: 50,
												fill: "#737373",
												fontSize: 11,
												fontFamily: "IBM Plex Mono",
											}}
											name="Imports"
											tick={{ fill: "#737373", fontSize: 10 }}
											tickLine={{ stroke: "#333" }}
											type="number"
										/>
										<ZAxis
											dataKey="loc"
											domain={[0, "auto"]}
											name="LOC"
											range={[80, 500]}
										/>
										{/* Quadrant labels */}
										{(() => {
											if (!hotSpotData || hotSpotData.length === 0) return null;
											const maxFanIn = Math.max(
												...hotSpotData.map((d) => d.fanIn),
												1,
											);
											const maxFanOut = Math.max(
												...hotSpotData.map((d) => d.fanOut),
												1,
											);
											const midFanIn = maxFanIn / 2;
											const midFanOut = maxFanOut / 2;
											return (
												<>
													{/* Top-right: Hubs */}
													<text
														fill="#f43f5e"
														fillOpacity={0.4}
														fontFamily="IBM Plex Mono"
														fontSize={10}
														fontWeight={600}
														textAnchor="middle"
														x={midFanIn + (maxFanIn - midFanIn) / 2}
														y={20}
													>
														HOTSPOTS
													</text>
													{/* Top-left: Utilities */}
													<text
														fill="#f59e0b"
														fillOpacity={0.4}
														fontFamily="IBM Plex Mono"
														fontSize={10}
														fontWeight={600}
														textAnchor="middle"
														x={midFanIn / 2}
														y={20}
													>
														UTILITIES
													</text>
													{/* Bottom-right: Dependents */}
													<text
														fill="#3b82f6"
														fillOpacity={0.4}
														fontFamily="IBM Plex Mono"
														fontSize={10}
														fontWeight={600}
														textAnchor="middle"
														x={midFanIn + (maxFanIn - midFanIn) / 2}
														y={400}
													>
														DEPENDENTS
													</text>
													{/* Bottom-left: Isolated */}
													<text
														fill="#10b981"
														fillOpacity={0.4}
														fontFamily="IBM Plex Mono"
														fontSize={10}
														fontWeight={600}
														textAnchor="middle"
														x={midFanIn / 2}
														y={400}
													>
														ISOLATED
													</text>
												</>
											);
										})()}
										<Tooltip
											content={({ active, payload }) => {
												if (active && payload && payload.length && payload[0]) {
													const data = payload[0].payload as HotspotDataPoint;
													const severity =
														data.score >= 8
															? "critical"
															: data.score >= 5
																? "warning"
																: "normal";
													const severityColor =
														severity === "critical"
															? "text-rose-400"
															: severity === "warning"
																? "text-amber-400"
																: "text-emerald-400";
													const severityBg =
														severity === "critical"
															? "bg-rose-500/10 border-rose-500/30"
															: severity === "warning"
																? "bg-amber-500/10 border-amber-500/30"
																: "bg-emerald-500/10 border-emerald-500/30";

													return (
														<div
															className={`rounded-lg border ${severityBg} p-3 shadow-xl backdrop-blur-sm`}
															style={{ minWidth: 220 }}
														>
															<div className="mb-2 flex items-start justify-between gap-2">
																<p className="truncate font-semibold text-neutral-200 text-sm">
																	{data.path?.split("/").pop()}
																</p>
																<span
																	className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] uppercase ${severityColor}`}
																>
																	{severity}
																</span>
															</div>
															<p className="mb-3 truncate font-mono text-neutral-500 text-xs">
																{data.path}
															</p>
															<div className="grid grid-cols-2 gap-2 text-xs">
																<div className="rounded bg-neutral-800/50 p-2">
																	<div className="mb-0.5 font-mono text-[10px] text-neutral-500 uppercase">
																		Depended on by
																	</div>
																	<div className="font-semibold text-neutral-200">
																		{data.fanIn} files
																	</div>
																</div>
																<div className="rounded bg-neutral-800/50 p-2">
																	<div className="mb-0.5 font-mono text-[10px] text-neutral-500 uppercase">
																		Depends on
																	</div>
																	<div className="font-semibold text-neutral-200">
																		{data.fanOut} files
																	</div>
																</div>
																<div className="rounded bg-neutral-800/50 p-2">
																	<div className="mb-0.5 font-mono text-[10px] text-neutral-500 uppercase">
																		Lines of Code
																	</div>
																	<div className="font-semibold text-neutral-200">
																		{data.loc?.toLocaleString()}
																	</div>
																</div>
																<div className="rounded bg-neutral-800/50 p-2">
																	<div className="mb-0.5 font-mono text-[10px] text-neutral-500 uppercase">
																		Risk Score
																	</div>
																	<div
																		className={`font-semibold ${severityColor}`}
																	>
																		{data.score?.toFixed(2)}
																	</div>
																</div>
															</div>
															<button
																className="mt-3 w-full rounded border border-amber-500/30 bg-amber-500/10 py-1.5 font-mono text-amber-400 text-xs uppercase tracking-wider transition-colors hover:bg-amber-500/20"
																onClick={() =>
																	setSelectedHotspotFile(data.path)
																}
																type="button"
															>
																View Source Code →
															</button>
														</div>
													);
												}
												return null;
											}}
											cursor={{ strokeDasharray: "3 3" }}
										/>
										<Scatter
											data={hotSpotData ?? undefined}
											onClick={(data) => {
												if (data && "path" in data) {
													setSelectedHotspotFile(
														(data as unknown as HotspotDataPoint).path,
													);
												}
											}}
											shape={(props: {
												cx?: number;
												cy?: number;
												payload?: HotspotDataPoint;
											}) => {
												const { cx, cy, payload } = props;
												if (!cx || !cy || !payload) return null;

												// Better radius calculation: logarithmic scale for better distribution
												const baseRadius = Math.max(
													5,
													Math.min(
														25,
														4 * Math.log2(Math.max(payload.loc, 1) + 1),
													),
												);
												const severity =
													payload.score >= 8
														? "critical"
														: payload.score >= 5
															? "warning"
															: "normal";
												const fillColor =
													severity === "critical"
														? "#f43f5e"
														: severity === "warning"
															? "#f59e0b"
															: "#10b981";
												const glowColor =
													severity === "critical"
														? "rgba(244, 63, 94, 0.4)"
														: severity === "warning"
															? "rgba(245, 158, 11, 0.4)"
															: "rgba(16, 185, 129, 0.2)";

												return (
													<g>
														{/* Glow effect for critical files */}
														{severity === "critical" && (
															<circle
																cx={cx}
																cy={cy}
																fill={glowColor}
																r={baseRadius + 4}
															/>
														)}
														{/* Main circle */}
														<circle
															cx={cx}
															cy={cy}
															fill={fillColor}
															fillOpacity={0.6}
															r={baseRadius}
															stroke={fillColor}
															strokeOpacity={1}
															strokeWidth={severity === "critical" ? 2.5 : 1.5}
															style={{ cursor: "pointer" }}
														/>
													</g>
												);
											}}
										/>
									</ScatterChart>
								</ResponsiveContainer>

								{/* Legend */}
								<div className="mt-4 flex flex-wrap items-center justify-center gap-4 border-neutral-800 border-t pt-4">
									<div className="flex items-center gap-4">
										<span className="font-mono text-[10px] text-neutral-600 uppercase">
											Risk Level:
										</span>
										<div className="flex items-center gap-1.5">
											<div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
											<span className="font-mono text-neutral-400 text-xs">
												Critical
											</span>
										</div>
										<div className="flex items-center gap-1.5">
											<div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
											<span className="font-mono text-neutral-400 text-xs">
												Warning
											</span>
										</div>
										<div className="flex items-center gap-1.5">
											<div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
											<span className="font-mono text-neutral-400 text-xs">
												Normal
											</span>
										</div>
									</div>
									<div className="h-4 w-px bg-neutral-800" />
									<div className="flex items-center gap-2">
										<span className="text-neutral-500 text-xs">○</span>
										<span className="font-mono text-neutral-500 text-xs">
											Size = LOC
										</span>
									</div>
								</div>

								{/* Quadrant explanation */}
								<div className="mt-3 grid grid-cols-2 gap-2 text-[10px] sm:grid-cols-4">
									<div className="rounded bg-rose-500/5 p-2 text-center">
										<span className="font-semibold text-rose-400">
											HOTSPOTS
										</span>
										<span className="block text-neutral-500">
											Many depend on, many imports
										</span>
									</div>
									<div className="rounded bg-amber-500/5 p-2 text-center">
										<span className="font-semibold text-amber-400">
											UTILITIES
										</span>
										<span className="block text-neutral-500">
											Few depend on, many imports
										</span>
									</div>
									<div className="rounded bg-blue-500/5 p-2 text-center">
										<span className="font-semibold text-blue-400">
											DEPENDENTS
										</span>
										<span className="block text-neutral-500">
											Many depend on, few imports
										</span>
									</div>
									<div className="rounded bg-emerald-500/5 p-2 text-center">
										<span className="font-semibold text-emerald-400">
											ISOLATED
										</span>
										<span className="block text-neutral-500">
											Few depend on, few imports
										</span>
									</div>
								</div>
							</div>
						) : isLoading ? (
							<div className="card-glass overflow-hidden rounded-lg">
								<table className="data-table">
									<thead>
										<tr>
											<th className="w-16">Rank</th>
											<th>File</th>
											<th className="w-24">Language</th>
											<th className="w-20 text-right">Fan-in</th>
											<th className="w-20 text-right">Fan-out</th>
											<th className="w-20 text-right">LOC</th>
											<th className="w-24 text-right">Score</th>
										</tr>
									</thead>
									<tbody>
										{Array.from({ length: 5 }).map((__, idx) => (
											<tr
												key={`skeleton-row-${idx.toString().padStart(2, "0")}`}
											>
												<td>
													<Skeleton className="h-4 w-8" />
												</td>
												<td>
													<Skeleton className="h-4 w-48" />
												</td>
												<td>
													<Skeleton className="h-4 w-16" />
												</td>
												<td className="text-right">
													<Skeleton className="ml-auto h-4 w-12" />
												</td>
												<td className="text-right">
													<Skeleton className="ml-auto h-4 w-12" />
												</td>
												<td className="text-right">
													<Skeleton className="ml-auto h-4 w-12" />
												</td>
												<td className="text-right">
													<Skeleton className="ml-auto h-4 w-16" />
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						) : hotSpotData && hotSpotData.length > 0 ? (
							<div className="card-glass overflow-hidden rounded-lg">
								<table className="data-table">
									<thead>
										<tr>
											<th className="w-16">Rank</th>
											<th>File</th>
											<th className="w-24">Language</th>
											<th className="w-20 text-right">Fan-in</th>
											<th className="w-20 text-right">Fan-out</th>
											<th className="w-20 text-right">LOC</th>
											<th className="w-24 text-right">Score</th>
										</tr>
									</thead>
									<tbody>
										{hotSpotData.map((hotspot) => (
											<tr
												className="cursor-pointer"
												key={hotspot.path}
												onClick={() => setSelectedHotspotFile(hotspot.path)}
											>
												<td className="font-data text-amber-500">
													{hotspot.rank}
												</td>
												<td className="font-data text-neutral-300">
													{hotspot.path}
												</td>
												<td>
													<span className="badge-sky">{hotspot.language}</span>
												</td>
												<td className="text-right">{hotspot.fanIn}</td>
												<td className="text-right">{hotspot.fanOut}</td>
												<td className="text-right">{hotspot.loc}</td>
												<td className="text-right font-data text-neutral-300">
													{hotspot.score.toFixed(3)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						) : (
							<div className="card-glass flex flex-col items-center justify-center rounded-lg py-16">
								<p className="font-mono text-neutral-500 text-sm">
									No hotspot data available.
								</p>
							</div>
						)}

						<Dialog
							onOpenChange={(open) => !open && setSelectedHotspotFile(null)}
							open={!!selectedHotspotFile}
						>
							<DialogContent className="flex max-h-[80vh] max-w-4xl flex-col overflow-hidden border-neutral-800 bg-neutral-950 p-0">
								<DialogHeader className="border-neutral-800 border-b p-4">
									<div className="flex items-center justify-between">
										<DialogTitle className="flex items-center gap-2 font-data text-sm">
											<FileCode className="h-4 w-4 text-amber-500" />
											{selectedHotspotFile?.split("/").pop()}
										</DialogTitle>
										<div className="flex items-center gap-2">
											<span className="badge">
												{selectedHotspotFile?.split(".").pop()?.toLowerCase() ||
													"text"}
											</span>
											<Button
												className="h-8 bg-neutral-900 px-2 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
												onClick={() => {
													if (hotspotFileContent) {
														navigator.clipboard.writeText(hotspotFileContent);
														setCopied(true);
														setTimeout(() => setCopied(false), 2000);
													}
												}}
												size="sm"
												variant="ghost"
											>
												{copied ? (
													<Check className="h-4 w-4 text-emerald-500" />
												) : (
													<Copy className="h-4 w-4" />
												)}
											</Button>
										</div>
									</div>
								</DialogHeader>
								<div className="flex-1 overflow-auto bg-[#0a0a0a]">
									{isHotspotContentLoading ? (
										<div className="flex h-full flex-col items-center justify-center gap-4">
											<Loader2 className="h-8 w-8 animate-spin text-neutral-600" />
											<p className="font-mono text-neutral-500 text-xs">
												Fetching content...
											</p>
										</div>
									) : (
										<div className="flex">
											<div className="select-none border-neutral-800 border-r bg-[#0a0a0a] py-4 text-right text-neutral-700">
												{hotspotFileContent?.split("\n").map((line, i) => {
													const lineNum = i + 1;
													return (
														<div
															className="px-4 font-data text-xs"
															key={`line-${lineNum}-${line.slice(0, 4)}`}
														>
															{lineNum}
														</div>
													);
												})}
											</div>
											<pre className="flex-1 whitespace-pre-wrap py-4 pr-4 pl-4 font-data text-neutral-300 text-xs leading-relaxed">
												<code>{hotspotFileContent}</code>
											</pre>
										</div>
									)}
								</div>
							</DialogContent>
						</Dialog>
					</motion.div>
				)}
			</div>
		</motion.div>
	);
}

function LoadingFallback() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-mesh pt-14">
			<div className="flex flex-col items-center gap-6">
				<div className="relative">
					<div className="absolute inset-0 animate-pulse rounded-full bg-amber-500/20 blur-xl" />
					<Loader2 className="relative h-12 w-12 animate-spin text-amber-500" />
				</div>
				<p className="font-mono text-neutral-400 text-sm uppercase tracking-widest">
					Loading Analysis
				</p>
			</div>
		</div>
	);
}

export default function AnalysisPage() {
	return (
		<Suspense fallback={<LoadingFallback />}>
			<AnalysisContent />
		</Suspense>
	);
}
