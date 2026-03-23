"use client";

import { useQuery } from "@tanstack/react-query";
import {
	ArrowLeft,
	ArrowLeftFromLine,
	ArrowRight,
	Check,
	Copy,
	FileCode,
	Loader2,
	Search,
	X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import {
	Bar,
	BarChart,
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { FilterBar, type FilterState } from "~/components/dashboard/FilterBar";
import { Treemap } from "~/components/dashboard/Treemap";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Skeleton } from "~/components/ui/skeleton";
import { useRepoStatus } from "~/hooks/useRepoStatus";
import { api } from "~/lib/eden";

type Node = {
	id: string;
	path: string;
	language: string;
	imports: number;
	loc?: number;
};

const COLORS = [
	"#3b82f6",
	"#10b981",
	"#f59e0b",
	"#ef4444",
	"#8b5cf6",
	"#ec4899",
	"#06b6d4",
	"#84cc16",
	"#f97316",
	"#6366f1",
];

function DependenciesContent() {
	const params = useParams();
	const router = useRouter();
	const repoId = params.repoId as string;

	const { data: status, isLoading, error } = useRepoStatus(repoId);

	const [searchQuery, setSearchQuery] = useState("");
	const [selectedNode, setSelectedNode] = useState<Node | null>(null);
	const [activeTab, setActiveTab] = useState<
		"files" | "charts" | "treemap" | "hotspots"
	>("files");
	const [selectedHotspotFile, setSelectedHotspotFile] = useState<string | null>(
		null,
	);
	const [copied, setCopied] = useState(false);
	const [treemapColorMode, setTreemapColorMode] = useState<
		"language" | "hotspot"
	>("language");
	const [filters, setFilters] = useState<FilterState>({
		selectedExtensions: [],
		showHotspotsOnly: false,
		hotspotThreshold: 0,
	});

	const graph = status?.analysis?.dependencyGraph;
	const hotSpotData = status?.analysis?.hotSpotData;
	const { metadata } = status ?? {};

	// Get all unique extensions from the file tree
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

				// For private repos, use server API
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
				// Text search
				if (query && !node.path.toLowerCase().includes(query)) return false;

				// Extension filter
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
			<div className="flex h-screen items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (error || !status) {
		return (
			<div className="flex h-screen flex-col items-center justify-center gap-4">
				<p className="text-red-500">Failed to load repository status</p>
				<button
					className="text-muted-foreground text-sm hover:text-foreground"
					onClick={() => router.push("/")}
					type="button"
				>
					Go back home
				</button>
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
		<div className="min-h-screen bg-background">
			<div className="border-b p-4">
				<div className="mx-auto max-w-7xl">
					<div className="mb-4 flex items-center justify-between">
						<div>
							<button
								className="mb-2 flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground"
								onClick={() => router.push(`/dashboard/${repoId}`)}
								type="button"
							>
								<ArrowLeft className="h-4 w-4" />
								Back to Dashboard
							</button>
							<h1 className="font-bold text-xl">
								{metadata?.fullName ?? "..."}
							</h1>
							<p className="text-muted-foreground text-sm">
								Dependency Analysis
							</p>
						</div>
						<div className="flex gap-6 text-sm">
							<div className="rounded-lg border bg-card p-4 text-center">
								<p className="font-bold text-2xl">
									{graph?.metadata.totalNodes ?? 0}
								</p>
								<p className="text-muted-foreground text-xs">Files</p>
							</div>
							<div className="rounded-lg border bg-card p-4 text-center">
								<p className="font-bold text-2xl">
									{graph?.metadata.totalEdges ?? 0}
								</p>
								<p className="text-muted-foreground text-xs">Connections</p>
							</div>
							<div className="rounded-lg border bg-card p-4 text-center">
								<p className="font-bold text-2xl">
									{Object.keys(graph?.metadata.languageBreakdown ?? {}).length}
								</p>
								<p className="text-muted-foreground text-xs">Languages</p>
							</div>
						</div>
					</div>

					<div className="flex gap-2">
						<button
							className={`rounded-lg px-4 py-2 font-medium text-sm transition-colors ${
								activeTab === "files"
									? "bg-primary text-primary-foreground"
									: "bg-muted text-muted-foreground hover:text-foreground"
							}`}
							onClick={() => setActiveTab("files")}
							type="button"
						>
							File Explorer
						</button>
						<button
							className={`rounded-lg px-4 py-2 font-medium text-sm transition-colors ${
								activeTab === "charts"
									? "bg-primary text-primary-foreground"
									: "bg-muted text-muted-foreground hover:text-foreground"
							}`}
							onClick={() => setActiveTab("charts")}
							type="button"
						>
							Charts
						</button>
						<button
							className={`rounded-lg px-4 py-2 font-medium text-sm transition-colors ${
								activeTab === "treemap"
									? "bg-primary text-primary-foreground"
									: "bg-muted text-muted-foreground hover:text-foreground"
							}`}
							onClick={() => setActiveTab("treemap")}
							type="button"
						>
							Treemap
						</button>
						<button
							className={`rounded-lg px-4 py-2 font-medium text-sm transition-colors ${
								activeTab === "hotspots"
									? "bg-primary text-primary-foreground"
									: "bg-muted text-muted-foreground hover:text-foreground"
							}`}
							onClick={() => setActiveTab("hotspots")}
							type="button"
						>
							Hotspots
						</button>
					</div>
				</div>
			</div>

			{activeTab === "files" ? (
				<div className="flex h-[calc(100vh-180px)]">
					<div className="w-1/2 overflow-auto border-r">
						<div className="sticky top-0 z-10 border-b bg-background p-4">
							<div className="relative">
								<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<input
									className="w-full rounded-md border bg-background py-2 pr-4 pl-9 text-sm"
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder="Search files..."
									type="text"
									value={searchQuery}
								/>
								{searchQuery && (
									<button
										className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
										onClick={() => setSearchQuery("")}
										type="button"
									>
										<X className="h-4 w-4" />
									</button>
								)}
							</div>
						</div>

						<FilterBar
							availableExtensions={allExtensions}
							onFilterChange={setFilters}
						/>

						<div className="p-2">
							{filteredNodes.map((node) => {
								const isSelected = selectedNode?.id === node.id;
								const { imports, importedBy } = getConnections(node.id);

								return (
									<button
										className={`mb-1 w-full rounded-lg p-3 text-left transition-colors ${
											isSelected
												? "bg-primary/10 ring-1 ring-primary"
												: "hover:bg-muted"
										}`}
										key={node.id}
										onClick={() => setSelectedNode(isSelected ? null : node)}
										type="button"
									>
										<div className="flex items-start justify-between gap-2">
											<div className="min-w-0 flex-1">
												<p className="truncate font-mono text-sm">
													{node.path}
												</p>
												<div className="mt-1 flex items-center gap-2">
													<span className="rounded bg-blue-100 px-1.5 py-0.5 text-blue-700 text-xs dark:bg-blue-900 dark:text-blue-300">
														{node.language}
													</span>
													<span className="text-muted-foreground text-xs">
														{node.loc} lines
													</span>
												</div>
											</div>
											<div className="flex gap-2 text-xs">
												{importedBy.length > 0 && (
													<span className="flex items-center gap-1 rounded bg-orange-100 px-1.5 py-0.5 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
														<ArrowLeftFromLine className="h-3 w-3" />
														{importedBy.length}
													</span>
												)}
												{imports.length > 0 && (
													<span className="flex items-center gap-1 rounded bg-green-100 px-1.5 py-0.5 text-green-700 dark:bg-green-900 dark:text-green-300">
														{imports.length}
														<ArrowRight className="h-3 w-3" />
													</span>
												)}
											</div>
										</div>
									</button>
								);
							})}

							{filteredNodes.length === 0 && (
								<div className="p-8 text-center text-muted-foreground">
									No files found
								</div>
							)}
						</div>
					</div>

					<div className="w-1/2 overflow-auto p-6">
						{selectedNode ? (
							<div>
								<div className="mb-6">
									<h2 className="mb-2 font-mono font-semibold text-lg">
										{selectedNode.path}
									</h2>
									<div className="flex gap-4 text-muted-foreground text-sm">
										<span>{selectedNode.language}</span>
										<span>{selectedNode.loc} lines</span>
										<span>{selectedNode.imports} imports</span>
									</div>
								</div>

								{connections && connections.imports.length > 0 && (
									<div className="mb-6">
										<h3 className="mb-3 flex items-center gap-2 font-medium text-green-700 text-sm dark:text-green-400">
											<ArrowRight className="h-4 w-4" />
											Imports ({connections.imports.length})
										</h3>
										<div className="space-y-2">
											{connections.imports.map((n) => (
												<button
													className="flex w-full items-center gap-2 rounded-lg bg-green-50 p-3 text-left transition-colors hover:bg-green-100 dark:bg-green-950 dark:hover:bg-green-900"
													key={n.id}
													onClick={() => setSelectedNode(n)}
													type="button"
												>
													<FileCode className="h-4 w-4 text-green-600 dark:text-green-400" />
													<span className="flex-1 truncate font-mono text-sm">
														{n.path}
													</span>
												</button>
											))}
										</div>
									</div>
								)}

								{connections && connections.importedBy.length > 0 && (
									<div>
										<h3 className="mb-3 flex items-center gap-2 font-medium text-orange-700 text-sm dark:text-orange-400">
											<ArrowLeftFromLine className="h-4 w-4" />
											Imported By ({connections.importedBy.length})
										</h3>
										<div className="space-y-2">
											{connections.importedBy.map((n) => (
												<button
													className="flex w-full items-center gap-2 rounded-lg bg-orange-50 p-3 text-left transition-colors hover:bg-orange-100 dark:bg-orange-950 dark:hover:bg-orange-900"
													key={n.id}
													onClick={() => setSelectedNode(n)}
													type="button"
												>
													<FileCode className="h-4 w-4 text-orange-600 dark:text-orange-400" />
													<span className="flex-1 truncate font-mono text-sm">
														{n.path}
													</span>
												</button>
											))}
										</div>
									</div>
								)}

								{connections &&
									connections.imports.length === 0 &&
									connections.importedBy.length === 0 && (
										<div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
											<FileCode className="mx-auto mb-2 h-8 w-8 opacity-50" />
											<p>No internal connections found</p>
											<p className="text-sm">
												This file only imports external packages
											</p>
										</div>
									)}
							</div>
						) : (
							<div className="flex h-full flex-col items-center justify-center text-muted-foreground">
								<FileCode className="mb-4 h-16 w-16 opacity-20" />
								<p className="text-lg">Select a file</p>
								<p className="text-sm">
									Click on a file to see its connections
								</p>
							</div>
						)}
					</div>
				</div>
			) : activeTab === "charts" ? (
				<div className="mx-auto max-w-7xl p-6">
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
						<div className="rounded-lg border bg-card p-4">
							<h3 className="mb-4 font-semibold">Top Imported Files</h3>
							<ResponsiveContainer height={300}>
								<BarChart data={topImportedFiles} layout="vertical">
									<XAxis type="number" />
									<YAxis
										dataKey="name"
										tick={{ fontSize: 11 }}
										type="category"
										width={100}
									/>
									<Tooltip
										content={({ active, payload }) => {
											if (active && payload && payload.length) {
												return (
													<div className="rounded-lg border bg-background p-2 shadow-lg">
														<p className="font-mono text-sm">
															{payload[0].payload.path}
														</p>
														<p className="text-muted-foreground text-xs">
															{payload[0].value} imports
														</p>
													</div>
												);
											}
											return null;
										}}
									/>
									<Bar dataKey="imports" fill="#3b82f6" radius={[0, 4, 4, 0]} />
								</BarChart>
							</ResponsiveContainer>
						</div>

						<div className="rounded-lg border bg-card p-4">
							<h3 className="mb-4 font-semibold">Language Distribution</h3>
							<ResponsiveContainer height={300}>
								<PieChart>
									<Pie
										cx="50%"
										cy="50%"
										data={languageData}
										dataKey="value"
										innerRadius={60}
										label={({ name, percent }) =>
											`${name} (${(percent * 100).toFixed(0)}%)`
										}
										outerRadius={100}
										paddingAngle={2}
									>
										{languageData.map((entry, index) => (
											<Cell
												fill={COLORS[index % COLORS.length]}
												key={`cell-${entry.name}`}
											/>
										))}
									</Pie>
									<Tooltip />
								</PieChart>
							</ResponsiveContainer>
						</div>

						<div className="rounded-lg border bg-card p-4">
							<h3 className="mb-4 font-semibold">Files by Language</h3>
							<ResponsiveContainer height={300}>
								<BarChart data={filesByLanguage}>
									<XAxis dataKey="name" tick={{ fontSize: 11 }} />
									<YAxis />
									<Tooltip />
									<Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]}>
										{filesByLanguage.map((entry, index) => (
											<Cell
												fill={COLORS[index % COLORS.length]}
												key={`cell-${entry.name}`}
											/>
										))}
									</Bar>
								</BarChart>
							</ResponsiveContainer>
						</div>

						<div className="rounded-lg border bg-card p-4">
							<h3 className="mb-4 font-semibold">Lines of Code by Language</h3>
							<ResponsiveContainer height={300}>
								<BarChart data={locByLanguage}>
									<XAxis dataKey="name" tick={{ fontSize: 11 }} />
									<YAxis />
									<Tooltip
										content={({ active, payload }) => {
											if (active && payload && payload.length) {
												return (
													<div className="rounded-lg border bg-background p-2 shadow-lg">
														<p className="font-medium text-sm">
															{payload[0].payload.name}
														</p>
														<p className="text-muted-foreground text-xs">
															{Number(payload[0].value).toLocaleString()} lines
														</p>
													</div>
												);
											}
											return null;
										}}
									/>
									<Bar dataKey="loc" fill="#f59e0b" radius={[4, 4, 0, 0]}>
										{locByLanguage.map((entry, index) => (
											<Cell
												fill={COLORS[index % COLORS.length]}
												key={`cell-${entry.name}`}
											/>
										))}
									</Bar>
								</BarChart>
							</ResponsiveContainer>
						</div>
					</div>

					<div className="mt-6 rounded-lg border bg-card p-4">
						<h3 className="mb-4 font-semibold">Dependency Overview</h3>
						<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
							<div className="rounded-lg bg-blue-50 p-4 text-center dark:bg-blue-950">
								<p className="font-bold text-2xl text-blue-600 dark:text-blue-400">
									{graph?.metadata.totalNodes ?? 0}
								</p>
								<p className="text-muted-foreground text-sm">Total Files</p>
							</div>
							<div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-950">
								<p className="font-bold text-2xl text-green-600 dark:text-green-400">
									{graph?.metadata.totalEdges ?? 0}
								</p>
								<p className="text-muted-foreground text-sm">Dependencies</p>
							</div>
							<div className="rounded-lg bg-orange-50 p-4 text-center dark:bg-orange-950">
								<p className="font-bold text-2xl text-orange-600 dark:text-orange-400">
									{graph?.metadata.unresolvedImports ?? 0}
								</p>
								<p className="text-muted-foreground text-sm">Unresolved</p>
							</div>
							<div className="rounded-lg bg-purple-50 p-4 text-center dark:bg-purple-950">
								<p className="font-bold text-2xl text-purple-600 dark:text-purple-400">
									{Object.keys(graph?.metadata.languageBreakdown ?? {}).length}
								</p>
								<p className="text-muted-foreground text-sm">Languages</p>
							</div>
						</div>
					</div>
				</div>
			) : activeTab === "treemap" ? (
				<div className="mx-auto max-w-7xl p-6">
					<div className="mb-4 flex items-center justify-between">
						<h3 className="font-semibold">File Treemap</h3>
						<div className="flex gap-2">
							<button
								className={`rounded-lg px-3 py-1.5 font-medium text-xs transition-colors ${
									treemapColorMode === "language"
										? "bg-primary text-primary-foreground"
										: "bg-muted text-muted-foreground hover:text-foreground"
								}`}
								onClick={() => setTreemapColorMode("language")}
								type="button"
							>
								By Language
							</button>
							<button
								className={`rounded-lg px-3 py-1.5 font-medium text-xs transition-colors ${
									treemapColorMode === "hotspot"
										? "bg-primary text-primary-foreground"
										: "bg-muted text-muted-foreground hover:text-foreground"
								}`}
								onClick={() => setTreemapColorMode("hotspot")}
								type="button"
							>
								By Hotspot
							</button>
						</div>
					</div>
					<div className="h-[calc(100vh-240px)]">
						<Treemap
							colorMode={treemapColorMode}
							onFileClick={(file) => setSelectedHotspotFile(file.path)}
							repoId={repoId}
						/>
					</div>
				</div>
			) : (
				<div className="mx-auto max-w-7xl p-6">
					<h3 className="mb-4 font-semibold">Hotspots</h3>
					{isLoading ? (
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b">
										<th className="px-4 py-2 text-left">Rank</th>
										<th className="px-4 py-2 text-left">File</th>
										<th className="px-4 py-2 text-left">Language</th>
										<th className="px-4 py-2 text-right">Fan-in</th>
										<th className="px-4 py-2 text-right">Fan-out</th>
										<th className="px-4 py-2 text-right">LOC</th>
										<th className="px-4 py-2 text-right">Score</th>
									</tr>
								</thead>
								<tbody>
									{Array.from({ length: 5 }).map((_, i) => (
										<tr className="border-b" key={i}>
											<td className="px-4 py-2">
												<Skeleton className="h-4 w-8" />
											</td>
											<td className="px-4 py-2">
												<Skeleton className="h-4 w-48" />
											</td>
											<td className="px-4 py-2">
												<Skeleton className="h-4 w-16" />
											</td>
											<td className="px-4 py-2">
												<Skeleton className="ml-auto h-4 w-12" />
											</td>
											<td className="px-4 py-2">
												<Skeleton className="ml-auto h-4 w-12" />
											</td>
											<td className="px-4 py-2">
												<Skeleton className="ml-auto h-4 w-12" />
											</td>
											<td className="px-4 py-2">
												<Skeleton className="ml-auto h-4 w-16" />
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : hotSpotData && hotSpotData.length > 0 ? (
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b">
										<th className="px-4 py-2 text-left">Rank</th>
										<th className="px-4 py-2 text-left">File</th>
										<th className="px-4 py-2 text-left">Language</th>
										<th className="px-4 py-2 text-right">Fan-in</th>
										<th className="px-4 py-2 text-right">Fan-out</th>
										<th className="px-4 py-2 text-right">LOC</th>
										<th className="px-4 py-2 text-right">Score</th>
									</tr>
								</thead>
								<tbody>
									{hotSpotData.map((hotspot) => (
										<tr
											className="cursor-pointer border-b hover:bg-muted/50"
											key={hotspot.path}
											onClick={() => setSelectedHotspotFile(hotspot.path)}
										>
											<td className="px-4 py-2 font-mono">{hotspot.rank}</td>
											<td className="px-4 py-2 font-mono">{hotspot.path}</td>
											<td className="px-4 py-2">
												<span className="rounded bg-blue-100 px-1.5 py-0.5 text-blue-700 text-xs dark:bg-blue-900 dark:text-blue-300">
													{hotspot.language}
												</span>
											</td>
											<td className="px-4 py-2 text-right">{hotspot.fanIn}</td>
											<td className="px-4 py-2 text-right">{hotspot.fanOut}</td>
											<td className="px-4 py-2 text-right">{hotspot.loc}</td>
											<td className="px-4 py-2 text-right font-mono">
												{hotspot.score.toFixed(3)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<div className="p-8 text-center text-muted-foreground">
							No hotspot data available.
						</div>
					)}

					{/* File viewer dialog for hotspot files */}
					<Dialog
						onOpenChange={(open) => !open && setSelectedHotspotFile(null)}
						open={!!selectedHotspotFile}
					>
						<DialogContent className="flex max-h-[80vh] max-w-4xl flex-col overflow-hidden p-0">
							<DialogHeader className="border-b p-4">
								<div className="flex items-center justify-between">
									<DialogTitle className="flex items-center gap-2 font-mono text-base">
										<FileCode className="h-4 w-4" />
										{selectedHotspotFile?.split("/").pop()}
									</DialogTitle>
									<div className="flex items-center gap-2">
										<span className="rounded bg-blue-100 px-2 py-0.5 text-blue-700 text-xs dark:bg-blue-900 dark:text-blue-300">
											{selectedHotspotFile?.split(".").pop()?.toLowerCase() ||
												"text"}
										</span>
										<Button
											className="h-8 px-2"
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
												<Check className="h-4 w-4 text-green-500" />
											) : (
												<Copy className="h-4 w-4" />
											)}
										</Button>
									</div>
								</div>
							</DialogHeader>
							<div className="flex-1 overflow-auto bg-slate-950">
								{isHotspotContentLoading ? (
									<div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
										<Loader2 className="h-8 w-8 animate-spin" />
										<p className="text-sm">Fetching content...</p>
									</div>
								) : (
									<div className="flex">
										{/* Line numbers */}
										<div className="select-none border-slate-800 border-r bg-slate-950 py-4 text-right text-slate-500">
											{hotspotFileContent?.split("\n").map((_, i) => (
												<div
													className="px-4 font-mono text-xs"
													key={`line-${i}`}
												>
													{i + 1}
												</div>
											))}
										</div>
										{/* Code content */}
										<pre className="flex-1 whitespace-pre-wrap py-4 pr-4 pl-4 font-mono text-slate-50 text-sm">
											<code>{hotspotFileContent}</code>
										</pre>
									</div>
								)}
							</div>
						</DialogContent>
					</Dialog>
				</div>
			)}
		</div>
	);
}

function LoadingFallback() {
	return (
		<div className="flex h-screen items-center justify-center">
			<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
		</div>
	);
}

export default function DependenciesPage() {
	return (
		<Suspense fallback={<LoadingFallback />}>
			<DependenciesContent />
		</Suspense>
	);
}
