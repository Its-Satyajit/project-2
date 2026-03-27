"use client";

import { useQuery } from "@tanstack/react-query";
import {
	ArrowLeft,
	BarChart3,
	Brain,
	Calendar,
	Check,
	Copy,
	ExternalLink,
	FileCode,
	GitBranch,
	GitCommit,
	GitFork,
	History,
	Loader2,
	Lock,
	LockOpen,
	Network,
	Scale,
	Star,
	Table2,
	TrendingUp,
	Users,
	X,
} from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Tooltip as ChartTooltip,
	Label,
	Line,
	LineChart,
	Pie,
	PieChart,
	ReferenceArea,
	ReferenceLine,
	ResponsiveContainer,
	Scatter,
	ScatterChart,
	XAxis,
	YAxis,
	ZAxis,
} from "recharts";
import { AIInsightsPanel, HotspotAIExplainer } from "~/components/ai";
import { FileTreeVisualizer } from "~/components/dashboard/FileTreeVisualizer";
import { Button } from "~/components/ui/button";
import { CardTitle } from "~/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Skeleton } from "~/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { env } from "~/env";
import { useRepoStatus } from "~/hooks/useRepoStatus";
import { api } from "~/lib/eden";
import "~/styles/analysis.css";

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
	"var(--color-primary)",
	"var(--color-accent)",
	"color-mix(in srgb, var(--color-primary), white 20%)",
	"color-mix(in srgb, var(--color-accent), white 20%)",
	"color-mix(in srgb, var(--color-primary), black 20%)",
	"color-mix(in srgb, var(--color-accent), black 20%)",
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

export function AnalysisPageClient({
	owner,
	repo,
	repoId,
	showHeader = true,
}: {
	owner: string;
	repo: string;
	repoId: string;
	showHeader?: boolean;
}) {
	const router = useRouter();

	const { data: status, isLoading, error } = useRepoStatus(repoId);

	// Fetch full repo details (commits, contributorCount, analysisResults, etc.)
	const { data: fullData } = useQuery({
		queryKey: ["repo-full-details", repoId],
		queryFn: async () => {
			const res = await api.dashboard({ repoId }).get();
			if (res.error) throw new Error(String(res.error));
			return res.data as any;
		},
		enabled: !!repoId,
	});

	const [activeTab, setActiveTab] = useState<
		"overview" | "insights" | "hotspots" | "filetree"
	>("overview");
	const [selectedHotspotFile, setSelectedHotspotFile] = useState<string | null>(
		null,
	);
	const [copied, setCopied] = useState(false);
	const [hotspotViewMode, setHotspotViewMode] = useState<"scatter" | "table">(
		"scatter",
	);

	const [chartConfig, setChartConfig] = useState({
		xAxis: "loc" as "fanIn" | "fanOut" | "loc" | "score",
		yAxis: "fanOut" as "fanIn" | "fanOut" | "loc" | "score",
		colorBy: "language" as "risk" | "language",
	});
	const [scatterLimit, setScatterLimit] = useState(200);
	const [showAIPanel, setShowAIPanel] = useState(false);

	const graph = status?.analysis?.dependencyGraph;
	const hotSpotData = status?.analysis?.hotSpotData;

	const slicedHotSpotData = useMemo(() => {
		if (!hotSpotData) return [];
		return hotSpotData.slice(0, scatterLimit);
	}, [hotSpotData, scatterLimit]);
	const summary = status?.analysis?.summary;
	const { metadata } = status ?? {};

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

	const fileTree = fullData?.fileTree ?? [];

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
		return Object.entries(graph?.metadata?.languageBreakdown ?? {})
			.map(([name, value]) => ({ name, value }))
			.sort((a, b) => b.value - a.value);
	}, [graph?.metadata?.languageBreakdown]);

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

	// --- Derived computations from API response ---

	/** Hotspot risk bands derived from score distribution */
	const riskBands = useMemo(() => {
		if (!hotSpotData?.length) return [];
		const bands = { Low: 0, Medium: 0, High: 0, Critical: 0 };
		for (const h of hotSpotData) {
			if (h.score < 25) bands.Low++;
			else if (h.score < 50) bands.Medium++;
			else if (h.score < 75) bands.High++;
			else bands.Critical++;
		}
		return [
			{ name: "Low", count: bands.Low, fill: "var(--color-accent)" },
			{ name: "Medium", count: bands.Medium, fill: "#f59e0b" },
			{ name: "High", count: bands.High, fill: "#f97316" },
			{ name: "Critical", count: bands.Critical, fill: "#ef4444" },
		];
	}, [hotSpotData]);

	/** Top commit authors by frequency */
	const commitsByAuthor = useMemo(() => {
		if (!fullData?.commits?.length) return [];
		const counts: Record<string, number> = {};
		for (const c of fullData.commits) {
			const name = c.authorName || "Unknown";
			counts[name] = (counts[name] || 0) + 1;
		}
		return Object.entries(counts)
			.map(([name, commits]) => ({ name, commits }))
			.sort((a, b) => b.commits - a.commits)
			.slice(0, 8);
	}, [fullData?.commits]);

	/** LOC growth across analysis snapshots */
	const locGrowth = useMemo(() => {
		if (!fullData?.analysisResults?.length) return [];
		return [...fullData.analysisResults]
			.sort(
				(a: { createdAt: string }, b: { createdAt: string }) =>
					new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
			)
			.map((r: { totalLines: number; createdAt: string }, i: number) => ({
				label: `#${i + 1}`,
				date: new Date(r.createdAt).toLocaleDateString(undefined, {
					month: "short",
					day: "numeric",
				}),
				loc: r.totalLines,
			}));
	}, [fullData?.analysisResults]);

	/** Coupling density = edges / nodes (avg imports per file) */
	const couplingDensity = useMemo(() => {
		const nodes = graph?.metadata?.totalNodes ?? 0;
		const edges = graph?.metadata?.totalEdges ?? 0;
		if (!nodes) return 0;
		return (edges / nodes).toFixed(2);
	}, [graph?.metadata]);

	/** Unresolved import percentage */
	const unresolvedPct = useMemo(() => {
		const total = graph?.metadata?.totalEdges ?? 0;
		const unresolved = graph?.metadata?.unresolvedImports ?? 0;
		if (!total) return 0;
		return ((unresolved / total) * 100).toFixed(1);
	}, [graph?.metadata]);

	/** Isolated nodes: files with 0 imports AND no inbound edges */
	const isolatedNodeCount = useMemo(() => {
		if (!graph?.nodes || !graph?.edges) return 0;
		const hasInbound = new Set(
			graph.edges.map((e: { target: string }) => e.target),
		);
		return graph.nodes.filter(
			(n: { imports: number; id: string }) =>
				n.imports === 0 && !hasInbound.has(n.id),
		).length;
	}, [graph?.nodes, graph?.edges]);

	/** God files: highest fanIn (depended upon by many) */
	const godFiles = useMemo(() => {
		if (!hotSpotData?.length) return [];
		return [...hotSpotData]
			.sort((a, b) => b.fanIn - a.fanIn)
			.slice(0, 5)
			.map((h) => ({
				name: h.path.split("/").pop() || h.path,
				path: h.path,
				fanIn: h.fanIn,
				fanOut: h.fanOut,
				loc: h.loc,
			}));
	}, [hotSpotData]);

	/** Directory depth distribution from file paths */
	const directoryDepth = useMemo(() => {
		if (!graph?.nodes?.length) return [];
		const depthCounts: Record<number, number> = {};
		for (const node of graph.nodes) {
			const depth = (node.path.match(/\//g) || []).length;
			depthCounts[depth] = (depthCounts[depth] || 0) + 1;
		}
		return Object.entries(depthCounts)
			.map(([depth, count]) => ({ depth: Number(depth), count }))
			.sort((a, b) => a.depth - b.depth);
	}, [graph?.nodes]);

	/** Import complexity histogram - distribution of imports per file */
	const importComplexity = useMemo(() => {
		if (!graph?.nodes?.length) return [];
		const buckets = {
			"0": 0,
			"1-5": 0,
			"6-10": 0,
			"11-25": 0,
			"26-50": 0,
			"50+": 0,
		};
		for (const node of graph.nodes) {
			const imp = node.imports || 0;
			if (imp === 0) buckets["0"]++;
			else if (imp <= 5) buckets["1-5"]++;
			else if (imp <= 10) buckets["6-10"]++;
			else if (imp <= 25) buckets["11-25"]++;
			else if (imp <= 50) buckets["26-50"]++;
			else buckets["50+"]++;
		}
		return Object.entries(buckets).map(([range, count]) => ({ range, count }));
	}, [graph?.nodes]);

	/** LOC distribution histogram */
	const locDistribution = useMemo(() => {
		if (!graph?.nodes?.length) return [];
		const buckets = {
			"1-50": 0,
			"51-100": 0,
			"101-250": 0,
			"251-500": 0,
			"501-1000": 0,
			"1000+": 0,
		};
		for (const node of graph.nodes) {
			const loc = node.loc || 0;
			if (loc <= 50) buckets["1-50"]++;
			else if (loc <= 100) buckets["51-100"]++;
			else if (loc <= 250) buckets["101-250"]++;
			else if (loc <= 500) buckets["251-500"]++;
			else if (loc <= 1000) buckets["501-1000"]++;
			else buckets["1000+"]++;
		}
		return Object.entries(buckets).map(([range, count]) => ({ range, count }));
	}, [graph?.nodes]);

	/** Day of week commit heatmap */
	const commitHeatmap = useMemo(() => {
		if (!fullData?.commits?.length) return [];
		const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
		const dayCounts = new Array(7).fill(0);
		for (const commit of fullData.commits) {
			const day = new Date(commit.committedAt).getDay();
			dayCounts[day]++;
		}
		return days.map((day, i) => ({ day, count: dayCounts[i] }));
	}, [fullData?.commits]);

	/** Language LOC vs Files scatter data */
	const languageLocVsFiles = useMemo(() => {
		if (!graph?.nodes?.length) return [];
		const langStats: Record<string, { files: number; loc: number }> = {};
		for (const node of graph.nodes) {
			const lang = node.language || "Unknown";
			if (!langStats[lang]) langStats[lang] = { files: 0, loc: 0 };
			langStats[lang].files++;
			langStats[lang].loc += node.loc || 0;
		}
		return Object.entries(langStats)
			.map(([language, stats]) => ({ language, ...stats }))
			.sort((a, b) => b.loc - a.loc);
	}, [graph?.nodes]);

	/** File extension treemap data */
	const extensionData = useMemo(() => {
		if (!status?.analysis?.fileTypeBreakdown) return [];
		const breakdown = status.analysis.fileTypeBreakdown;
		return Object.entries(breakdown)
			.filter(([, count]) => count > 0)
			.map(([ext, count]) => ({
				name: ext.startsWith(".") ? ext : `.${ext}`,
				value: count,
			}))
			.sort((a, b) => b.value - a.value);
	}, [status?.analysis?.fileTypeBreakdown]);

	if (isLoading) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center bg-background pt-14">
				<div className="flex flex-col items-center gap-6">
					<div className="relative">
						<div className="absolute inset-0 animate-pulse rounded-full bg-accent/10 blur-xl" />
						<Loader2 className="relative h-10 w-10 animate-spin text-foreground" />
					</div>
					<div className="text-center">
						<p className="font-(family-name:--font-display) text-foreground text-xl">
							Analyzing Repository
						</p>
						<p className="mt-1 font-mono text-muted-foreground text-xs uppercase tracking-wider">
							Scanning dependencies...
						</p>
					</div>
				</div>
			</div>
		);
	}

	if (error || !status) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center bg-background pt-14">
				<div className="border border-border bg-card p-8 text-center">
					<div className="mb-4 flex justify-center">
						<div className="flex h-10 w-10 items-center justify-center border border-destructive/30 bg-destructive/5">
							<X className="h-5 w-5 text-destructive" />
						</div>
					</div>
					<h2 className="font-(family-name:--font-display) mb-2 text-2xl text-foreground">
						Unable to Load Repository
					</h2>
					<p className="mb-6 font-mono text-muted-foreground text-xs uppercase tracking-wider">
						The repository may not exist or may be private.
					</p>
					<button
						className="border border-foreground bg-foreground px-4 py-2 font-mono text-background text-xs uppercase tracking-wider hover:bg-foreground/90"
						onClick={() => router.push("/")}
						type="button"
					>
						Go Back Home
					</button>
				</div>
			</div>
		);
	}

	return (
		<motion.div
			animate="visible"
			className="blueprint-grid min-h-screen bg-background pt-14"
			initial="hidden"
			variants={containerVariants}
		>
			{/* Header */}
			<div className="border-border border-b bg-background/95 backdrop-blur-sm">
				<div className="mx-auto max-w-7xl px-6 py-6">
					<motion.div variants={itemVariants}>
						<div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
							<div className="min-w-0">
								<button
									className="group mb-4 flex w-fit items-center gap-2 font-mono text-muted-foreground text-xs uppercase tracking-widest transition-colors hover:text-foreground"
									onClick={() => router.push(`/dashboard/${repoId}`)}
									type="button"
								>
									<ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
									Back to Dashboard
								</button>
								<div className="flex items-center gap-4">
									{metadata?.avatarUrl ? (
										<Image
											alt={metadata.owner}
											className="border border-border"
											height={44}
											src={metadata.avatarUrl}
											width={44}
										/>
									) : (
										<div className="flex h-11 w-11 items-center justify-center border border-border bg-secondary">
											<GitBranch className="h-5 w-5 text-muted-foreground" />
										</div>
									)}
									<div className="min-w-0">
										<h1 className="font-(family-name:--font-display) truncate text-3xl text-foreground leading-[1.15] tracking-tight md:text-4xl">
											{metadata?.fullName ?? "..."}
										</h1>
										{/* Description tagline */}
										{fullData?.description && (
											<p className="mt-1 max-w-xl font-mono text-[11px] text-muted-foreground leading-relaxed">
												{fullData.description}
											</p>
										)}
										{/* Info strip */}
										<div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
											<span>
												{status?.analysis?.summary
													? "Full Architectural Analysis"
													: "Dependency Analysis"}
											</span>
											{/* Privacy badge */}
											<span className="text-border">|</span>
											<span
												className={`flex items-center gap-1 ${metadata?.isPrivate ? "text-amber-500" : "text-emerald-500"}`}
											>
												{metadata?.isPrivate ? (
													<>
														<Lock className="h-2 w-2" /> Private
													</>
												) : (
													<>
														<LockOpen className="h-2 w-2" /> Public
													</>
												)}
											</span>
											{/* Primary language */}
											{metadata?.primaryLanguage && (
												<>
													<span className="text-border">|</span>
													<span className="flex items-center gap-1">
														<FileCode className="h-2 w-2" />
														{metadata.primaryLanguage}
													</span>
												</>
											)}
											{/* License */}
											{fullData?.license && (
												<>
													<span className="text-border">|</span>
													<span className="flex items-center gap-1">
														<Scale className="h-2 w-2" />
														{fullData.license}
													</span>
												</>
											)}
											{/* Stars & Forks */}
											{(fullData?.stars ?? metadata?.stars) !== undefined && (
												<>
													<span className="text-border">|</span>
													<span className="flex items-center gap-1">
														<Star className="h-2 w-2" />
														{fullData?.stars ?? metadata?.stars}
													</span>
													<span className="flex items-center gap-1">
														<GitFork className="h-2 w-2" />
														{fullData?.forks ?? metadata?.forks}
													</span>
												</>
											)}
										</div>
									</div>
								</div>
							</div>

							{/* Inline stats - architectural style */}
							<div className="flex flex-wrap items-center gap-6 lg:pt-4">
								<div className="flex flex-col gap-0.5">
									<span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
										Files
									</span>
									<span className="font-(family-name:--font-display) text-2xl text-foreground">
										{status?.analysis?.totalFiles ??
											graph?.metadata?.totalNodes ??
											graph?.nodes?.length ??
											0}
									</span>
								</div>
								<div className="h-8 w-px bg-border" />
								<div className="flex flex-col gap-0.5">
									<span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
										Connections
									</span>
									<span className="font-(family-name:--font-display) text-2xl text-foreground">
										{graph?.metadata?.totalEdges ?? graph?.edges?.length ?? 0}
									</span>
								</div>
								<div className="h-8 w-px bg-border" />
								<div className="flex flex-col gap-0.5">
									<span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
										Languages
									</span>
									<span className="font-(family-name:--font-display) text-2xl text-foreground">
										{
											Object.keys(
												status?.analysis?.fileTypeBreakdown ??
													graph?.metadata?.languageBreakdown ??
													{},
											).length
										}
									</span>
								</div>
								{/* Default Branch stat */}
								{metadata?.defaultBranch && (
									<>
										<div className="h-8 w-px bg-border" />
										<div className="flex flex-col gap-0.5">
											<span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
												Branch
											</span>
											<span className="flex items-center gap-1 font-mono text-foreground text-sm">
												<GitBranch className="h-3 w-3 text-accent" />
												{metadata.defaultBranch}
											</span>
										</div>
									</>
								)}
							</div>
						</div>

						{/* Tabs */}
						<div className="mt-6 flex items-center justify-between">
							<Tabs
								onValueChange={(v) => setActiveTab(v as typeof activeTab)}
								value={activeTab}
							>
								<TabsList className="flex gap-1 bg-transparent p-0">
									<TabsTrigger className="tab-pill" value="overview">
										Overview
									</TabsTrigger>
									<TabsTrigger className="tab-pill" value="insights">
										Insights
									</TabsTrigger>
									<TabsTrigger className="tab-pill" value="hotspots">
										Hotspots
									</TabsTrigger>
									<TabsTrigger className="tab-pill" value="filetree">
										File Tree
									</TabsTrigger>
								</TabsList>
							</Tabs>
							{env.NEXT_PUBLIC_AI_ENABLED && (
								<Button
									className="gap-2"
									onClick={() => setShowAIPanel(!showAIPanel)}
									size="sm"
									variant={showAIPanel ? "default" : "outline"}
								>
									<Brain className="h-4 w-4" />
									{showAIPanel ? "Hide AI" : "AI Insights"}
								</Button>
							)}
						</div>
					</motion.div>
				</div>
			</div>

			{/* Content */}
			<div className="mx-auto flex max-w-7xl gap-6 px-6 py-8">
				{/* Main content */}
				<div
					className={`flex-1 ${showAIPanel ? "lg:max-w-[calc(100%-380px)]" : ""}`}
				>
					{activeTab === "overview" ? (
						<motion.div variants={itemVariants}>
							{summary ? (
								<div className="grid gap-0 md:grid-cols-2 lg:grid-cols-3">
									{/* Basic Statistics */}
									<motion.div
										className="animate-fade-in-up border-border border-r border-b p-6"
										style={{ animationDelay: "0.1s" }}
									>
										<div className="mb-5">
											<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
												Basic Statistics
											</span>
										</div>
										<div className="space-y-4">
											<div className="flex items-baseline justify-between border-border border-b pb-3">
												<span className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
													Total Files
												</span>
												<span className="font-(family-name:--font-display) text-2xl text-foreground">
													{summary.basic.totalFiles}
												</span>
											</div>
											<div className="flex items-baseline justify-between border-border border-b pb-3">
												<span className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
													Directories
												</span>
												<span className="font-(family-name:--font-display) text-2xl text-foreground">
													{summary.basic.totalDirectories}
												</span>
											</div>
											<div className="flex items-baseline justify-between pb-3">
												<span className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
													Lines of Code
												</span>
												<span className="font-(family-name:--font-display) text-2xl text-foreground">
													{summary.basic.totalLines.toLocaleString()}
												</span>
											</div>
										</div>
									</motion.div>

									{/* Languages */}
									<motion.div
										className="animate-fade-in-up border-border border-r border-b p-6 lg:border-r"
										style={{ animationDelay: "0.15s" }}
									>
										<div className="mb-5">
											<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
												Languages
											</span>
										</div>
										<div className="mb-5">
											<span className="font-(family-name:--font-display) text-3xl text-foreground">
												{summary.languages.primaryLanguage}
											</span>
											<span className="ml-2 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
												Primary
											</span>
										</div>
										<div className="space-y-3">
											{summary.languages.topLanguages.map((lang) => (
												<div
													className="flex items-center justify-between"
													key={lang.name}
												>
													<span className="font-mono text-muted-foreground text-xs">
														{lang.name}
													</span>
													<div className="flex items-center gap-3">
														<div className="h-1 w-16 bg-border">
															<div
																className="h-full bg-accent"
																style={{ width: `${lang.percentage}%` }}
															/>
														</div>
														<span className="w-12 text-right font-mono text-muted-foreground text-xs tabular-nums">
															{lang.percentage.toFixed(2)}%
														</span>
													</div>
												</div>
											))}
										</div>
									</motion.div>

									{/* Structure */}
									<motion.div
										className="animate-fade-in-up border-border border-b p-6 lg:border-r"
										style={{ animationDelay: "0.2s" }}
									>
										<div className="mb-5">
											<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
												Structure
											</span>
										</div>
										<div className="space-y-4">
											<div className="flex items-baseline justify-between border-border border-b pb-3">
												<span className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
													Max Depth
												</span>
												<span className="font-(family-name:--font-display) text-2xl text-foreground">
													{summary.structure.maxDepth}
												</span>
											</div>
											<div>
												<span className="mb-2 block font-mono text-muted-foreground text-xs uppercase tracking-wider">
													Top-level Directories
												</span>
												<div className="flex flex-wrap gap-1.5">
													{summary.structure.topLevelDirectories.map((dir) => (
														<span
															className="border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
															key={dir}
														>
															{dir}
														</span>
													))}
												</div>
											</div>
										</div>
									</motion.div>

									{/* Dependencies */}
									<motion.div
										className="animate-fade-in-up border-r border-b p-6 lg:border-b-0"
										style={{ animationDelay: "0.25s" }}
									>
										<div className="mb-5 flex items-center justify-between">
											<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
												Dependencies
											</span>
											<Network className="h-3 w-3 text-muted-foreground/30" />
										</div>
										<div className="space-y-4">
											<div className="flex items-baseline justify-between border-border border-b pb-3">
												<span className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
													Connectivity
												</span>
												<span className="font-(family-name:--font-display) text-2xl text-foreground">
													{summary.dependencies.totalEdges}
												</span>
											</div>

											<div className="grid grid-cols-2 gap-4 pt-2">
												<div>
													<h4 className="mb-3 font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
														Most Depended Upon
													</h4>
													<div className="space-y-2">
														{summary.dependencies.mostDependedUpon
															.slice(0, 3)
															.map((item) => (
																<div
																	className="flex items-center justify-between border-border/50 border-b pb-1"
																	key={item.path}
																>
																	<span className="max-w-[80px] truncate font-mono text-[10px] text-muted-foreground">
																		{item.path.split("/").pop()}
																	</span>
																	<span className="font-mono text-foreground text-xs">
																		{item.fanIn}
																	</span>
																</div>
															))}
													</div>
												</div>
												<div>
													<h4 className="mb-3 font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
														Most Dependent
													</h4>
													<div className="space-y-2">
														{summary.dependencies.mostDependent
															?.slice(0, 3)
															.map((item: { path: string; fanOut: number }) => (
																<div
																	className="flex items-center justify-between border-border/50 border-b pb-1"
																	key={item.path}
																>
																	<span className="max-w-[80px] truncate font-mono text-[10px] text-muted-foreground">
																		{item.path.split("/").pop()}
																	</span>
																	<span className="font-mono text-foreground text-xs">
																		{item.fanOut}
																	</span>
																</div>
															))}
													</div>
												</div>
											</div>
										</div>
									</motion.div>

									{/* Hotspots */}
									<motion.div
										className="animate-fade-in-up border-r p-6"
										style={{ animationDelay: "0.3s" }}
									>
										<div className="mb-5">
											<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
												Hotspots
											</span>
										</div>
										{summary.hotspots.topHotspots.length > 0 ? (
											<div className="space-y-2">
												{summary.hotspots.topHotspots
													.slice(0, 5)
													.map((hotspot) => (
														<div
															className="flex items-center justify-between border-border/50 border-b py-2"
															key={hotspot.path}
														>
															<div className="min-w-0 flex-1">
																<p className="truncate font-mono text-foreground text-xs">
																	{hotspot.path.split("/").pop()}
																</p>
																<p className="font-mono text-[10px] text-muted-foreground">
																	Score: {hotspot.score.toFixed(2)}
																</p>
															</div>
															<span className="ml-2 border border-border px-2 py-0.5 font-mono text-muted-foreground text-xs">
																#{hotspot.rank}
															</span>
														</div>
													))}
											</div>
										) : (
											<p className="font-mono text-muted-foreground text-xs">
												No hotspots detected.
											</p>
										)}
									</motion.div>

									{/* File Types */}
									<motion.div
										className="animate-fade-in-up p-6"
										style={{ animationDelay: "0.35s" }}
									>
										<div className="mb-5">
											<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
												System Pulse
											</span>
										</div>
										<div className="space-y-4">
											<div className="flex items-center justify-between border-border border-b pb-3">
												<div className="flex flex-col">
													<span className="font-mono text-[10px] text-muted-foreground uppercase">
														Evolution
													</span>
													<span className="font-mono text-foreground text-xs">
														{fullData?.analysisResults?.length ?? 0} Snapshots
													</span>
												</div>
												<TrendingUp className="h-4 w-4 text-emerald-500" />
											</div>
											<div className="flex items-center justify-between border-border border-b pb-3">
												<div className="flex flex-col">
													<span className="font-mono text-[10px] text-muted-foreground uppercase">
														Contributors
													</span>
													<span className="font-mono text-foreground text-xs">
														{fullData?.contributorCount ?? 0} Developers
													</span>
												</div>
												<Users className="h-4 w-4 text-accent" />
											</div>
											<div className="pt-2">
												<Link
													className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground uppercase hover:text-foreground"
													href={fullData?.url || "#"}
													target="_blank"
												>
													<ExternalLink className="h-3 w-3" />
													View on GitHub
												</Link>
											</div>
										</div>
									</motion.div>
								</div>
							) : (
								<div className="flex flex-col items-center justify-center border border-border py-20">
									<div className="relative mb-6">
										<div className="absolute inset-0 animate-pulse rounded-full bg-accent/5 blur-xl" />
										<BarChart3 className="relative h-10 w-10 text-muted-foreground" />
									</div>
									<p className="font-(family-name:--font-display) text-foreground text-lg">
										Analysis in progress
									</p>
									<p className="mt-1 font-mono text-muted-foreground text-xs uppercase tracking-wider">
										Summary data will appear once analysis completes.
									</p>
								</div>
							)}
						</motion.div>
					) : activeTab === "insights" ? (
						<div className="space-y-0">
							<div className="grid gap-0 lg:grid-cols-2">
								{/* Top Imported Files */}
								<motion.div
									className="animate-fade-in-up border-border border-r border-b p-6"
									style={{ animationDelay: "0.1s" }}
								>
									<h3 className="mb-6 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
										Top Imported Files
									</h3>
									<ResponsiveContainer height={280}>
										<BarChart data={topImportedFiles} layout="vertical">
											<XAxis
												axisLine={{ stroke: "var(--color-border)" }}
												tick={{
													fill: "var(--color-muted-foreground)",
													fontSize: 11,
												}}
												type="number"
											/>
											<YAxis
												axisLine={{ stroke: "var(--color-border)" }}
												dataKey="name"
												tick={{
													fill: "var(--color-muted-foreground)",
													fontSize: 10,
												}}
												type="category"
												width={90}
											/>
											<ChartTooltip
												content={({ active, payload }) => {
													if (
														active &&
														payload?.length &&
														payload[0]?.payload
													) {
														const data = payload[0];
														return (
															<div className="border border-border bg-card p-3 shadow-lg">
																<p className="font-mono text-foreground text-xs">
																	{data.payload.path}
																</p>
																<p className="mt-1 font-mono text-muted-foreground text-xs">
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
												fill="var(--color-primary)"
												radius={[0, 2, 2, 0]}
											/>
										</BarChart>
									</ResponsiveContainer>
								</motion.div>

								{/* Language Distribution */}
								<motion.div
									className="animate-fade-in-up border-border border-b p-6"
									style={{ animationDelay: "0.15s" }}
								>
									<h3 className="mb-6 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
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
											<ChartTooltip
												content={({ active, payload }) => {
													if (active && payload?.length) {
														return (
															<div className="border border-border bg-card p-3 shadow-lg">
																<p className="font-mono text-foreground text-xs">
																	{payload[0].name}
																</p>
																<p className="font-mono text-muted-foreground text-xs">
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

								{/* Files by Language */}
								<motion.div
									className="animate-fade-in-up border-border border-r border-b p-6 lg:border-b-0"
									style={{ animationDelay: "0.2s" }}
								>
									<h3 className="mb-6 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
										Files by Language
									</h3>
									<ResponsiveContainer height={280}>
										<BarChart data={filesByLanguage}>
											<XAxis
												axisLine={{ stroke: "var(--color-border)" }}
												dataKey="name"
												tick={{
													fill: "var(--color-muted-foreground)",
													fontSize: 10,
												}}
											/>
											<YAxis
												axisLine={{ stroke: "var(--color-border)" }}
												tick={{
													fill: "var(--color-muted-foreground)",
													fontSize: 11,
												}}
											/>
											<ChartTooltip
												content={({ active, payload }) => {
													if (active && payload?.length) {
														return (
															<div className="border border-border bg-card p-3 shadow-lg">
																<p className="font-mono text-foreground text-xs">
																	{payload[0].payload.name}
																</p>
																<p className="font-mono text-muted-foreground text-xs">
																	{payload[0].value} files
																</p>
															</div>
														);
													}
													return null;
												}}
											/>
											<Bar dataKey="count" radius={[2, 2, 0, 0]}>
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

								{/* LOC by Language */}
								<motion.div
									className="animate-fade-in-up border-border border-b p-6 lg:border-b-0"
									style={{ animationDelay: "0.25s" }}
								>
									<h3 className="mb-6 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
										Lines of Code by Language
									</h3>
									<ResponsiveContainer height={280}>
										<BarChart data={locByLanguage}>
											<XAxis
												axisLine={{ stroke: "var(--color-border)" }}
												dataKey="name"
												tick={{
													fill: "var(--color-muted-foreground)",
													fontSize: 10,
												}}
											/>
											<YAxis
												axisLine={{ stroke: "var(--color-border)" }}
												tick={{
													fill: "var(--color-muted-foreground)",
													fontSize: 11,
												}}
											/>
											<ChartTooltip
												content={({ active, payload }) => {
													if (active && payload?.length) {
														return (
															<div className="border border-border bg-card p-3 shadow-lg">
																<p className="font-mono text-foreground text-xs">
																	{payload[0].payload.name}
																</p>
																<p className="font-mono text-muted-foreground text-xs">
																	{Number(payload[0].value).toLocaleString()}{" "}
																	lines
																</p>
															</div>
														);
													}
													return null;
												}}
											/>
											<Bar dataKey="loc" radius={[2, 2, 0, 0]}>
												{locByLanguage.map((entry) => (
													<Cell
														fill={
															CHART_COLORS[
																locByLanguage.indexOf(entry) %
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
							</div>

							{/* Hotspot Risk Distribution */}
							{riskBands.length > 0 && (
								<motion.div
									className="animate-fade-in-up border-border border-t p-6 lg:col-span-2"
									style={{ animationDelay: "0.28s" }}
								>
									<div className="mb-6 flex items-start justify-between">
										<div>
											<h3 className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
												Hotspot Risk Distribution
											</h3>
											<p className="mt-1 font-mono text-[9px] text-muted-foreground/60">
												Files grouped by risk score bands
											</p>
										</div>
										<div className="flex gap-3">
											{riskBands.map((b) => (
												<div className="text-center" key={b.name}>
													<p
														className="font-(family-name:--font-display) text-xl"
														style={{ color: b.fill }}
													>
														{b.count}
													</p>
													<p className="font-mono text-[9px] text-muted-foreground uppercase">
														{b.name}
													</p>
												</div>
											))}
										</div>
									</div>
									<ResponsiveContainer height={120} width="100%">
										<BarChart barSize={48} data={riskBands}>
											<CartesianGrid
												stroke="var(--color-border)"
												strokeOpacity={0.5}
												vertical={false}
											/>
											<XAxis
												dataKey="name"
												tick={{
													fontSize: 9,
													fontFamily: "monospace",
													fill: "var(--color-muted-foreground)",
												}}
												tickLine={false}
											/>
											<YAxis hide />
											<ChartTooltip
												contentStyle={{
													background: "var(--color-card)",
													border: "1px solid var(--color-border)",
													borderRadius: 0,
													fontFamily: "monospace",
													fontSize: 11,
												}}
											/>
											<Bar dataKey="count" radius={0}>
												{riskBands.map((b) => (
													<Cell fill={b.fill} fillOpacity={0.85} key={b.name} />
												))}
											</Bar>
										</BarChart>
									</ResponsiveContainer>
								</motion.div>
							)}

							{/* Commit Author Frequency */}
							{commitsByAuthor.length > 0 && (
								<motion.div
									className="animate-fade-in-up border-border border-t p-6 lg:col-span-2"
									style={{ animationDelay: "0.32s" }}
								>
									<h3 className="mb-6 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
										Commit Authorship
									</h3>
									<ResponsiveContainer height={160} width="100%">
										<BarChart
											data={commitsByAuthor}
											layout="vertical"
											margin={{ left: 8, right: 8 }}
										>
											<CartesianGrid
												horizontal={false}
												stroke="var(--color-border)"
												strokeOpacity={0.5}
											/>
											<XAxis
												axisLine={false}
												tick={{
													fontSize: 9,
													fontFamily: "monospace",
													fill: "var(--color-muted-foreground)",
												}}
												tickLine={false}
												type="number"
											/>
											<YAxis
												axisLine={false}
												dataKey="name"
												tick={{
													fontSize: 9,
													fontFamily: "monospace",
													fill: "var(--color-muted-foreground)",
												}}
												tickLine={false}
												type="category"
												width={90}
											/>
											<ChartTooltip
												contentStyle={{
													background: "var(--color-card)",
													border: "1px solid var(--color-border)",
													borderRadius: 0,
													fontFamily: "monospace",
													fontSize: 11,
												}}
											/>
											<Bar dataKey="commits" radius={0}>
												{commitsByAuthor.map((entry, i) => (
													<Cell
														fill={CHART_COLORS[i % CHART_COLORS.length]}
														fillOpacity={0.8}
														key={`cell-author-${entry.name}`}
													/>
												))}
											</Bar>
										</BarChart>
									</ResponsiveContainer>
								</motion.div>
							)}

							{/* Dependency Overview */}
							<motion.div
								className="animate-fade-in-up border-border border-t p-6"
								style={{ animationDelay: "0.3s" }}
							>
								<h3 className="mb-6 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
									Dependency Overview
								</h3>
								<div className="grid grid-cols-2 gap-0 sm:grid-cols-4">
									<div className="border-border border-r p-6 text-center">
										<p className="font-(family-name:--font-display) text-3xl text-foreground">
											{graph?.metadata?.totalNodes ?? 0}
										</p>
										<p className="mt-1 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
											Total Files
										</p>
									</div>
									<div className="border-border border-r p-6 text-center">
										<p className="font-(family-name:--font-display) text-3xl text-accent">
											{graph?.metadata?.totalEdges ?? 0}
										</p>
										<p className="mt-1 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
											Dependencies
										</p>
									</div>
									<div className="border-border border-r p-6 text-center">
										<p className="font-(family-name:--font-display) text-3xl text-foreground">
											{graph?.metadata?.unresolvedImports ?? 0}
										</p>
										<p className="mt-1 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
											Unresolved
										</p>
									</div>
									<div className="p-6 text-center">
										<p className="font-(family-name:--font-display) text-3xl text-accent">
											{
												Object.keys(graph?.metadata?.languageBreakdown ?? {})
													.length
											}
										</p>
										<p className="mt-1 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
											Languages
										</p>
									</div>
								</div>
							</motion.div>

							{/* Derived Insights Charts */}
							<div className="grid gap-0 lg:grid-cols-2">
								{/* Directory Depth */}
								{directoryDepth.length > 0 && (
									<motion.div
										className="animate-fade-in-up border-border border-t border-r p-6"
										style={{ animationDelay: "0.35s" }}
									>
										<h3 className="mb-6 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
											Directory Depth Distribution
										</h3>
										<ResponsiveContainer height={200} width="100%">
											<BarChart data={directoryDepth}>
												<CartesianGrid
													stroke="var(--color-border)"
													strokeOpacity={0.3}
													vertical={false}
												/>
												<XAxis
													axisLine={{ stroke: "var(--color-border)" }}
													dataKey="depth"
													tick={{
														fill: "var(--color-muted-foreground)",
														fontSize: 10,
													}}
													tickLine={false}
												/>
												<YAxis
													axisLine={{ stroke: "var(--color-border)" }}
													tick={{
														fill: "var(--color-muted-foreground)",
														fontSize: 10,
													}}
													tickLine={false}
												/>
												<ChartTooltip
													contentStyle={{
														background: "var(--color-card)",
														border: "1px solid var(--color-border)",
														borderRadius: 0,
														fontFamily: "monospace",
														fontSize: 11,
													}}
													formatter={(value) => [`${value} files`, "Count"]}
													labelFormatter={(label) => `Depth ${label}`}
												/>
												<Bar
													dataKey="count"
													fill="var(--color-primary)"
													radius={[2, 2, 0, 0]}
												>
													{directoryDepth.map((entry, i) => (
														<Cell
															fill={CHART_COLORS[i % CHART_COLORS.length]}
															key={`cell-depth-${entry.depth}`}
														/>
													))}
												</Bar>
											</BarChart>
										</ResponsiveContainer>
									</motion.div>
								)}

								{/* Import Complexity */}
								{importComplexity.length > 0 && (
									<motion.div
										className="animate-fade-in-up border-border border-t p-6"
										style={{ animationDelay: "0.38s" }}
									>
										<h3 className="mb-6 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
											Import Complexity
										</h3>
										<ResponsiveContainer height={200} width="100%">
											<BarChart data={importComplexity}>
												<CartesianGrid
													stroke="var(--color-border)"
													strokeOpacity={0.3}
													vertical={false}
												/>
												<XAxis
													axisLine={{ stroke: "var(--color-border)" }}
													dataKey="range"
													tick={{
														fill: "var(--color-muted-foreground)",
														fontSize: 9,
													}}
													tickLine={false}
												/>
												<YAxis
													axisLine={{ stroke: "var(--color-border)" }}
													tick={{
														fill: "var(--color-muted-foreground)",
														fontSize: 10,
													}}
													tickLine={false}
												/>
												<ChartTooltip
													contentStyle={{
														background: "var(--color-card)",
														border: "1px solid var(--color-border)",
														borderRadius: 0,
														fontFamily: "monospace",
														fontSize: 11,
													}}
													formatter={(value) => [`${value} files`, "Count"]}
												/>
												<Bar
													dataKey="count"
													fill="var(--color-accent)"
													radius={[2, 2, 0, 0]}
												>
													{importComplexity.map((entry, i) => (
														<Cell
															fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]}
															key={`cell-imp-${entry.range}`}
														/>
													))}
												</Bar>
											</BarChart>
										</ResponsiveContainer>
									</motion.div>
								)}

								{/* LOC Distribution */}
								{locDistribution.length > 0 && (
									<motion.div
										className="animate-fade-in-up border-border border-t border-r p-6"
										style={{ animationDelay: "0.41s" }}
									>
										<h3 className="mb-6 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
											File Size Distribution
										</h3>
										<ResponsiveContainer height={200} width="100%">
											<BarChart data={locDistribution}>
												<CartesianGrid
													stroke="var(--color-border)"
													strokeOpacity={0.3}
													vertical={false}
												/>
												<XAxis
													axisLine={{ stroke: "var(--color-border)" }}
													dataKey="range"
													tick={{
														fill: "var(--color-muted-foreground)",
														fontSize: 9,
													}}
													tickLine={false}
												/>
												<YAxis
													axisLine={{ stroke: "var(--color-border)" }}
													tick={{
														fill: "var(--color-muted-foreground)",
														fontSize: 10,
													}}
													tickLine={false}
												/>
												<ChartTooltip
													contentStyle={{
														background: "var(--color-card)",
														border: "1px solid var(--color-border)",
														borderRadius: 0,
														fontFamily: "monospace",
														fontSize: 11,
													}}
													formatter={(value) => [`${value} files`, "Count"]}
												/>
												<Bar
													dataKey="count"
													fill="var(--color-primary)"
													radius={[2, 2, 0, 0]}
												>
													{locDistribution.map((entry, i) => (
														<Cell
															fill={CHART_COLORS[(i + 1) % CHART_COLORS.length]}
															key={`cell-loc-${entry.range}`}
														/>
													))}
												</Bar>
											</BarChart>
										</ResponsiveContainer>
									</motion.div>
								)}

								{/* Commit Heatmap */}
								{commitHeatmap.length > 0 && (
									<motion.div
										className="animate-fade-in-up border-border border-t p-6"
										style={{ animationDelay: "0.44s" }}
									>
										<h3 className="mb-6 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
											Commits by Day of Week
										</h3>
										<ResponsiveContainer height={200} width="100%">
											<BarChart data={commitHeatmap}>
												<CartesianGrid
													stroke="var(--color-border)"
													strokeOpacity={0.3}
													vertical={false}
												/>
												<XAxis
													axisLine={{ stroke: "var(--color-border)" }}
													dataKey="day"
													tick={{
														fill: "var(--color-muted-foreground)",
														fontSize: 10,
													}}
													tickLine={false}
												/>
												<YAxis
													axisLine={{ stroke: "var(--color-border)" }}
													tick={{
														fill: "var(--color-muted-foreground)",
														fontSize: 10,
													}}
													tickLine={false}
												/>
												<ChartTooltip
													contentStyle={{
														background: "var(--color-card)",
														border: "1px solid var(--color-border)",
														borderRadius: 0,
														fontFamily: "monospace",
														fontSize: 11,
													}}
													formatter={(value) => [`${value} commits`, "Count"]}
												/>
												<Bar dataKey="count" radius={[2, 2, 0, 0]}>
													{commitHeatmap.map((entry, i) => (
														<Cell
															fill={CHART_COLORS[(i + 3) % CHART_COLORS.length]}
															key={`cell-heat-${entry.day}`}
														/>
													))}
												</Bar>
											</BarChart>
										</ResponsiveContainer>
									</motion.div>
								)}
							</div>

							{/* Language LOC vs Files Scatter */}
							{languageLocVsFiles.length > 0 && (
								<motion.div
									className="animate-fade-in-up border-border border-t p-6"
									style={{ animationDelay: "0.47s" }}
								>
									<h3 className="mb-6 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
										Language: LOC vs Files
									</h3>
									<ResponsiveContainer height={280} width="100%">
										<ScatterChart
											margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
										>
											<CartesianGrid
												stroke="var(--color-border)"
												strokeDasharray="3 3"
											/>
											<XAxis
												axisLine={{ stroke: "var(--color-border)" }}
												dataKey="files"
												name="Files"
												tick={{
													fill: "var(--color-muted-foreground)",
													fontSize: 10,
												}}
												type="number"
											/>
											<YAxis
												axisLine={{ stroke: "var(--color-border)" }}
												dataKey="loc"
												name="LOC"
												tick={{
													fill: "var(--color-muted-foreground)",
													fontSize: 10,
												}}
												type="number"
											/>
											<ChartTooltip
												contentStyle={{
													background: "var(--color-card)",
													border: "1px solid var(--color-border)",
													borderRadius: 0,
													fontFamily: "monospace",
													fontSize: 11,
												}}
												formatter={(value, name) => [
													name === "files"
														? `${value} files`
														: `${Number(value).toLocaleString()} lines`,
													name === "files" ? "Files" : "LOC",
												]}
												labelFormatter={(label) => label}
											/>
											<Scatter data={languageLocVsFiles}>
												{languageLocVsFiles.map((entry, i) => (
													<Cell
														fill={CHART_COLORS[i % CHART_COLORS.length]}
														key={`cell-lang-${entry.language}`}
													/>
												))}
											</Scatter>
										</ScatterChart>
									</ResponsiveContainer>
								</motion.div>
							)}

							{/* File Extensions */}
							{extensionData.length > 0 && (
								<motion.div
									className="animate-fade-in-up border-border border-t p-6"
									style={{ animationDelay: "0.5s" }}
								>
									<h3 className="mb-6 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
										File Types
									</h3>
									<ResponsiveContainer height={200} width="100%">
										<PieChart>
											<Pie
												cx="50%"
												cy="50%"
												data={extensionData.slice(0, 8)}
												dataKey="value"
												innerRadius={40}
												label={({ name, percent = 0 }) =>
													`${name} ${(percent * 100).toFixed(0)}%`
												}
												labelLine={false}
												outerRadius={80}
												paddingAngle={2}
											>
												{extensionData.slice(0, 8).map((entry, i) => (
													<Cell
														fill={CHART_COLORS[i % CHART_COLORS.length]}
														key={`cell-ext-${entry.name}`}
													/>
												))}
											</Pie>
											<ChartTooltip
												contentStyle={{
													background: "var(--color-card)",
													border: "1px solid var(--color-border)",
													borderRadius: 0,
													fontFamily: "monospace",
													fontSize: 11,
												}}
												formatter={(value) => [`${value} files`, "Count"]}
											/>
										</PieChart>
									</ResponsiveContainer>
								</motion.div>
							)}
						</div>
					) : activeTab === "hotspots" ? (
						<motion.div variants={itemVariants}>
							<div className="mb-6 flex items-center justify-between">
								<h3 className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
									Hotspots
								</h3>
								<div className="flex gap-1.5">
									<button
										className={`tab-pill ${hotspotViewMode === "scatter" ? "active" : ""}`}
										onClick={() => setHotspotViewMode("scatter")}
										type="button"
									>
										<GitCommit className="h-3 w-3" />
										<span>Scatter</span>
									</button>
									<button
										className={`tab-pill ${hotspotViewMode === "table" ? "active" : ""}`}
										onClick={() => setHotspotViewMode("table")}
										type="button"
									>
										<Table2 className="h-3 w-3" />
										<span>Table</span>
									</button>
								</div>
							</div>

							{hotspotViewMode === "scatter" ? (
								<div className="border border-border p-6">
									{/* Header with filter */}
									<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
										<h4 className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
											Complexity vs. Connectivity
										</h4>
										{hotSpotData && hotSpotData.length > 0 && (
											<div className="flex flex-wrap items-center gap-2">
												<span className="font-mono text-[10px] text-muted-foreground">
													X:
												</span>
												<select
													className="border border-border bg-background px-2 py-1 font-mono text-foreground text-xs"
													onChange={(e) =>
														setChartConfig((c) => ({
															...c,
															xAxis: e.target.value as
																| "fanIn"
																| "fanOut"
																| "loc"
																| "score",
														}))
													}
													value={chartConfig.xAxis}
												>
													<option value="fanIn">Fan-in</option>
													<option value="fanOut">Fan-out</option>
													<option value="loc">LOC</option>
													<option value="score">Risk</option>
												</select>
												<span className="font-mono text-[10px] text-muted-foreground">
													Y:
												</span>
												<select
													className="border border-border bg-background px-2 py-1 font-mono text-foreground text-xs"
													onChange={(e) =>
														setChartConfig((c) => ({
															...c,
															yAxis: e.target.value as
																| "fanIn"
																| "fanOut"
																| "loc"
																| "score",
														}))
													}
													value={chartConfig.yAxis}
												>
													<option value="fanIn">Fan-in</option>
													<option value="fanOut">Fan-out</option>
													<option value="loc">LOC</option>
													<option value="score">Risk</option>
												</select>
												<span className="font-mono text-[10px] text-muted-foreground">
													Color:
												</span>
												<select
													className="border border-border bg-background px-2 py-1 font-mono text-foreground text-xs"
													onChange={(e) =>
														setChartConfig((c) => ({
															...c,
															colorBy: e.target.value as "risk" | "language",
														}))
													}
													value={chartConfig.colorBy}
												>
													<option value="risk">Risk</option>
													<option value="language">Language</option>
												</select>
												<span className="hidden font-mono text-[10px] text-muted-foreground uppercase tracking-widest sm:inline">
													Files Limit:
												</span>
												<div className="flex items-center gap-2">
													<input
														className="h-1 w-24 cursor-pointer appearance-none bg-border accent-accent hover:accent-accent/80"
														max={hotSpotData.length}
														min={5}
														onChange={(e) =>
															setScatterLimit(Number.parseInt(e.target.value))
														}
														step={5}
														type="range"
														value={scatterLimit}
													/>
													<span className="min-w-10 font-mono text-accent text-xs tabular-nums">
														{scatterLimit}
													</span>
												</div>
											</div>
										)}
									</div>

									{/* Chart */}
									<ResponsiveContainer height={420}>
										<ScatterChart
											margin={{ top: 30, right: 30, bottom: 60, left: 60 }}
										>
											{(() => {
												if (!hotSpotData || hotSpotData.length === 0)
													return null;

												const xKey = chartConfig.xAxis;
												const yKey = chartConfig.yAxis;

												const maxXValue = hotSpotData.reduce((max, d) => {
													const val = Number(d[xKey as keyof HotspotDataPoint]);
													return !Number.isNaN(val) ? Math.max(max, val) : max;
												}, 0);

												const maxYValue = hotSpotData.reduce((max, d) => {
													const val = Number(d[yKey as keyof HotspotDataPoint]);
													return !Number.isNaN(val) ? Math.max(max, val) : max;
												}, 0);

												const maxX = Math.max(maxXValue, 1) * 1.1;
												const maxY = Math.max(maxYValue, 1) * 1.1;

												const midX = maxX / 2;
												const midY = maxY / 2;

												return (
													<>
														<ReferenceArea
															fill="var(--color-destructive)"
															fillOpacity={0.05}
															x1={midX}
															x2={maxX}
															y1={midY}
															y2={maxY}
														>
															<Label
																fill="var(--color-destructive)"
																fillOpacity={0.5}
																fontFamily="IBM Plex Mono"
																fontSize={10}
																fontWeight={600}
																position="insideTopRight"
																value="HOTSPOTS"
															/>
														</ReferenceArea>

														<ReferenceArea
															fill="var(--color-primary)"
															fillOpacity={0.05}
															x1={0}
															x2={midX}
															y1={midY}
															y2={maxY}
														>
															<Label
																fill="var(--color-primary)"
																fillOpacity={0.5}
																fontFamily="IBM Plex Mono"
																fontSize={10}
																fontWeight={600}
																position="insideTopLeft"
																value="UTILITIES"
															/>
														</ReferenceArea>

														<ReferenceArea
															fill="var(--color-primary)"
															fillOpacity={0.05}
															x1={midX}
															x2={maxX}
															y1={0}
															y2={midY}
														>
															<Label
																fill="var(--color-primary)"
																fillOpacity={0.5}
																fontFamily="IBM Plex Mono"
																fontSize={10}
																fontWeight={600}
																position="insideBottomRight"
																value="DEPENDENTS"
															/>
														</ReferenceArea>

														<ReferenceArea
															fill="var(--color-accent)"
															fillOpacity={0.05}
															x1={0}
															x2={midX}
															y1={0}
															y2={midY}
														>
															<Label
																fill="var(--color-accent)"
																fillOpacity={0.5}
																fontFamily="IBM Plex Mono"
																fontSize={10}
																fontWeight={600}
																position="insideBottomLeft"
																value="ISOLATED"
															/>
														</ReferenceArea>

														<ReferenceLine
															stroke="var(--color-border)"
															strokeDasharray="3 3"
															x={midX}
														/>
														<ReferenceLine
															stroke="var(--color-border)"
															strokeDasharray="3 3"
															y={midY}
														/>
													</>
												);
											})()}
											<CartesianGrid
												stroke="var(--color-border)"
												strokeDasharray="3 3"
												vertical={true}
											/>
											<XAxis
												axisLine={{ stroke: "var(--color-border)" }}
												dataKey={chartConfig.xAxis}
												label={{
													value:
														chartConfig.xAxis === "fanIn"
															? "Fan-in (depended on)"
															: chartConfig.xAxis === "fanOut"
																? "Fan-out (imports)"
																: chartConfig.xAxis === "loc"
																	? "Lines of Code"
																	: "Risk Score",
													position: "bottom",
													offset: 40,
													fill: "var(--color-muted-foreground)",
													fontSize: 11,
													fontFamily: "IBM Plex Mono",
												}}
												name={chartConfig.xAxis}
												tick={{
													fill: "var(--color-muted-foreground)",
													fontSize: 10,
												}}
												tickLine={{ stroke: "var(--color-border)" }}
												type="number"
											/>
											<YAxis
												axisLine={{ stroke: "var(--color-border)" }}
												dataKey={chartConfig.yAxis}
												label={{
													value:
														chartConfig.yAxis === "fanIn"
															? "Fan-in (depended on)"
															: chartConfig.yAxis === "fanOut"
																? "Fan-out (imports)"
																: chartConfig.yAxis === "loc"
																	? "Lines of Code"
																	: "Risk Score",
													angle: -90,
													position: "insideLeft",
													offset: 50,
													fill: "var(--color-muted-foreground)",
													fontSize: 11,
													fontFamily: "IBM Plex Mono",
												}}
												name="Imports"
												tick={{
													fill: "var(--color-muted-foreground)",
													fontSize: 10,
												}}
												tickLine={{ stroke: "var(--color-border)" }}
												type="number"
											/>
											<ZAxis
												dataKey="loc"
												domain={[0, "auto"]}
												name="LOC"
												range={[80, 500]}
											/>
											<ChartTooltip
												content={({ active, payload }) => {
													if (active && payload?.length && payload[0]) {
														const data = payload[0].payload as HotspotDataPoint;
														const severity =
															data.score >= 8
																? "critical"
																: data.score >= 5
																	? "warning"
																	: "normal";
														const severityColor =
															severity === "critical"
																? "text-destructive"
																: severity === "warning"
																	? "text-accent"
																	: "text-foreground";
														const severityBorder =
															severity === "critical"
																? "border-destructive/30"
																: severity === "warning"
																	? "border-accent/30"
																	: "border-border";

														return (
															<div
																className={`border ${severityBorder} bg-card p-3 shadow-xl`}
																style={{ minWidth: 220 }}
															>
																<div className="mb-2 flex items-start justify-between gap-2">
																	<p className="truncate font-mono font-semibold text-foreground text-sm">
																		{data.path?.split("/").pop()}
																	</p>
																	<span
																		className={`shrink-0 font-mono text-[10px] uppercase ${severityColor}`}
																	>
																		{severity}
																	</span>
																</div>
																<p className="mb-3 truncate font-mono text-muted-foreground text-xs">
																	{data.path}
																</p>
																<div className="grid grid-cols-2 gap-2 text-xs">
																	<div className="border border-border p-2">
																		<div className="mb-0.5 font-mono text-[9px] text-muted-foreground uppercase">
																			Depended on by
																		</div>
																		<div className="font-mono text-foreground">
																			{data.fanIn} files
																		</div>
																	</div>
																	<div className="border border-border p-2">
																		<div className="mb-0.5 font-mono text-[9px] text-muted-foreground uppercase">
																			Depends on
																		</div>
																		<div className="font-mono text-foreground">
																			{data.fanOut} files
																		</div>
																	</div>
																	<div className="border border-border p-2">
																		<div className="mb-0.5 font-mono text-[9px] text-muted-foreground uppercase">
																			Lines of Code
																		</div>
																		<div className="font-mono text-foreground">
																			{data.loc?.toLocaleString()}
																		</div>
																	</div>
																	<div className="border border-border p-2">
																		<div className="mb-0.5 font-mono text-[9px] text-muted-foreground uppercase">
																			Risk Score
																		</div>
																		<div
																			className={`font-mono ${severityColor}`}
																		>
																			{data.score?.toFixed(2)}
																		</div>
																	</div>
																</div>
															</div>
														);
													}
													return null;
												}}
												cursor={{ strokeDasharray: "3 3" }}
											/>
											<Scatter
												data={slicedHotSpotData}
												shape={(props: {
													cx?: number;
													cy?: number;
													payload?: HotspotDataPoint;
												}) => {
													const { cx, cy, payload } = props;
													if (!cx || !cy || !payload) return null;

													const maxLoc = hotSpotData
														? Math.max(
																...hotSpotData.map((d) => d.loc || 0),
																1000,
															)
														: 5000;
													const normalizedLoc = Math.min(
														Math.sqrt(payload.loc || 1) / Math.sqrt(maxLoc),
														1,
													);
													const baseRadius = 4 + normalizedLoc * 20;

													const severity =
														payload.score >= 8
															? "critical"
															: payload.score >= 5
																? "warning"
																: "normal";

													const langColors: Record<string, string> = {
														typescript: "#3178c6",
														javascript: "#f7df1e",
														python: "#3776ab",
														go: "#00add8",
														rust: "#dea584",
														java: "#ed8b00",
														cpp: "#00599c",
														c: "#a8b9cc",
														jsx: "#61dafb",
														tsx: "#3178c6",
													};

													const fillColor =
														chartConfig.colorBy === "language"
															? langColors[payload.language?.toLowerCase()] ||
																"var(--color-muted-foreground)"
															: severity === "critical"
																? "var(--color-destructive)"
																: severity === "warning"
																	? "var(--color-accent)"
																	: "var(--color-primary)";

													const glowColor =
														chartConfig.colorBy === "language"
															? `${langColors[payload.language?.toLowerCase() as keyof typeof langColors] || "var(--color-muted-foreground)"}33`
															: severity === "critical"
																? "color-mix(in srgb, var(--color-destructive), transparent 80%)"
																: severity === "warning"
																	? "color-mix(in srgb, var(--color-accent), transparent 80%)"
																	: "color-mix(in srgb, var(--color-primary), transparent 80%)";

													return (
														<g>
															{(severity === "critical" ||
																chartConfig.colorBy === "language") && (
																<circle
																	cx={cx}
																	cy={cy}
																	fill={glowColor}
																	r={baseRadius + 4}
																/>
															)}
															<circle
																cx={cx}
																cy={cy}
																fill={fillColor}
																fillOpacity={0.7}
																r={baseRadius}
															/>
														</g>
													);
												}}
											/>
										</ScatterChart>
									</ResponsiveContainer>

									{/* Legend */}
									<div className="mt-4 flex flex-wrap items-center justify-center gap-6 border-border border-t pt-4">
										<div className="flex items-center gap-4">
											<span className="font-mono text-[10px] text-muted-foreground uppercase">
												Risk Level:
											</span>
											<div className="flex items-center gap-1.5">
												<div className="h-2 w-2 rounded-full bg-destructive" />
												<span className="font-mono text-muted-foreground text-xs">
													Critical
												</span>
											</div>
											<div className="flex items-center gap-1.5">
												<div className="h-2 w-2 rounded-full bg-accent" />
												<span className="font-mono text-muted-foreground text-xs">
													Warning
												</span>
											</div>
											<div className="flex items-center gap-1.5">
												<div className="h-2 w-2 rounded-full bg-primary" />
												<span className="font-mono text-muted-foreground text-xs">
													Normal
												</span>
											</div>
										</div>
										<div className="h-4 w-px bg-border" />
										<div className="flex items-center gap-2">
											<span className="text-muted-foreground text-xs">○</span>
											<span className="font-mono text-muted-foreground text-xs">
												Size = LOC
											</span>
										</div>
									</div>

									{/* Quadrant explanation */}
									<div className="mt-4 grid grid-cols-2 gap-2 text-[10px] sm:grid-cols-4">
										<div className="border border-destructive/20 p-2 text-center">
											<span className="font-mono font-semibold text-destructive uppercase">
												Hotspots
											</span>
											<span className="block font-mono text-muted-foreground">
												Many depend on, many imports
											</span>
										</div>
										<div className="border border-border p-2 text-center">
											<span className="font-mono font-semibold text-primary uppercase">
												Utilities
											</span>
											<span className="block font-mono text-muted-foreground">
												Few depend on, many imports
											</span>
										</div>
										<div className="border border-border p-2 text-center">
											<span className="font-mono font-semibold text-primary uppercase">
												Dependents
											</span>
											<span className="block font-mono text-muted-foreground">
												Many depend on, few imports
											</span>
										</div>
										<div className="border border-accent/20 p-2 text-center">
											<span className="font-mono font-semibold text-accent uppercase">
												Isolated
											</span>
											<span className="block font-mono text-muted-foreground">
												Few depend on, few imports
											</span>
										</div>
									</div>
								</div>
							) : (
								<div className="overflow-hidden border border-border">
									<table className="w-full font-mono text-xs">
										<thead>
											<tr className="border-border border-b bg-secondary/30">
												<th className="px-4 py-3 text-left text-[10px] text-muted-foreground uppercase tracking-wider">
													Rank
												</th>
												<th className="px-4 py-3 text-left text-[10px] text-muted-foreground uppercase tracking-wider">
													File
												</th>
												<th className="px-4 py-3 text-left text-[10px] text-muted-foreground uppercase tracking-wider">
													Language
												</th>
												<th className="px-4 py-3 text-right text-[10px] text-muted-foreground uppercase tracking-wider">
													Fan-in
												</th>
												<th className="px-4 py-3 text-right text-[10px] text-muted-foreground uppercase tracking-wider">
													Fan-out
												</th>
												<th className="px-4 py-3 text-right text-[10px] text-muted-foreground uppercase tracking-wider">
													LOC
												</th>
												<th className="px-4 py-3 text-right text-[10px] text-muted-foreground uppercase tracking-wider">
													Score
												</th>
												<th className="px-4 py-3 text-right text-[10px] text-muted-foreground uppercase tracking-wider">
													AI
												</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-border">
											{hotSpotData?.map((hotspot) => (
												<tr
													className="transition-colors hover:bg-secondary/20"
													key={hotspot.path}
												>
													<td className="px-4 py-2.5 text-accent tabular-nums">
														{hotspot.rank}
													</td>
													<td className="px-4 py-2.5 text-foreground">
														{hotspot.path}
													</td>
													<td className="px-4 py-2.5 text-muted-foreground">
														{hotspot.language}
													</td>
													<td className="px-4 py-2.5 text-right tabular-nums">
														{hotspot.fanIn}
													</td>
													<td className="px-4 py-2.5 text-right tabular-nums">
														{hotspot.fanOut}
													</td>
													<td className="px-4 py-2.5 text-right tabular-nums">
														{hotspot.loc}
													</td>
													<td className="px-4 py-2.5 text-right text-foreground tabular-nums">
														{hotspot.score.toFixed(3)}
													</td>
													<td className="px-4 py-2.5 text-right">
														{env.NEXT_PUBLIC_AI_ENABLED && (
															<HotspotAIExplainer
																fanIn={hotspot.fanIn}
																fanOut={hotspot.fanOut}
																filePath={hotspot.path}
																loc={hotspot.loc}
																score={hotspot.score}
															/>
														)}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}

							<Dialog
								onOpenChange={(open) => !open && setSelectedHotspotFile(null)}
								open={!!selectedHotspotFile}
							>
								<DialogContent className="flex max-h-[80vh] max-w-4xl flex-col overflow-hidden border-border bg-background p-0">
									<DialogHeader className="border-border border-b p-4">
										<div className="flex items-center justify-between">
											<DialogTitle className="flex items-center gap-2 font-mono text-sm">
												<FileCode className="h-4 w-4 text-muted-foreground" />
												{selectedHotspotFile?.split("/").pop()}
											</DialogTitle>
											<div className="flex items-center gap-2">
												<span className="border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground uppercase">
													{selectedHotspotFile
														?.split(".")
														.pop()
														?.toLowerCase() || "text"}
												</span>
												<Button
													className="h-7 bg-secondary px-2 text-muted-foreground hover:text-foreground"
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
														<Check className="h-3 w-3 text-emerald-500" />
													) : (
														<Copy className="h-3 w-3" />
													)}
												</Button>
											</div>
										</div>
									</DialogHeader>
									<div className="flex-1 overflow-auto bg-card">
										{isHotspotContentLoading ? (
											<div className="flex h-full flex-col items-center justify-center gap-4">
												<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
												<p className="font-mono text-muted-foreground text-xs">
													Fetching content...
												</p>
											</div>
										) : (
											<div className="flex">
												<div className="select-none border-border border-r bg-background py-4 text-right text-muted-foreground">
													{hotspotFileContent?.split("\n").map((line, i) => {
														const lineNum = i + 1;
														return (
															<div
																className="px-4 font-mono text-xs"
																key={`line-${lineNum}-${line.slice(0, 4)}`}
															>
																{lineNum}
															</div>
														);
													})}
												</div>
												<pre className="flex-1 whitespace-pre-wrap py-4 pr-4 pl-4 font-mono text-foreground text-xs leading-relaxed">
													<code>{hotspotFileContent}</code>
												</pre>
											</div>
										)}
									</div>
								</DialogContent>
							</Dialog>
						</motion.div>
					) : activeTab === "filetree" ? (
						<motion.div
							className="h-[calc(100vh-200px)]"
							variants={itemVariants}
						>
							<div className="h-full overflow-hidden border border-border">
								<FileTreeVisualizer
									fileTree={fileTree}
									hotspotData={
										new Map(
											(hotSpotData ?? []).map((h) => [
												h.path,
												{ score: h.score, loc: h.loc },
											]),
										)
									}
								/>
							</div>
						</motion.div>
					) : null}
				</div>

				{/* AI Insights Panel */}
				{env.NEXT_PUBLIC_AI_ENABLED && showAIPanel && (
					<aside className="hidden w-[360px] shrink-0 lg:block">
						<div className="sticky top-20">
							<AIInsightsPanel
								fileContent={hotspotFileContent ?? undefined}
								filePath={selectedHotspotFile ?? undefined}
								onClose={() => setShowAIPanel(false)}
							/>
						</div>
					</aside>
				)}
			</div>
		</motion.div>
	);
}

// AnalysisPageClient is exported and used by page.tsx
