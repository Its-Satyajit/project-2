"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import {
	ChevronRight,
	Expand,
	FolderOpen,
	Minimize2,
	Search,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import type { FileTreeItem } from "~/components/CollapsibleFileTree";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { createIndex, useFlexSearch } from "~/lib/flexsearch";
import { useDebounce } from "~/lib/useDebounce";
import { cn } from "~/lib/utils";

interface FlatNode {
	id: string;
	name: string;
	depth: number;
	isDirectory: boolean;
	items?: FileTreeItem[];
	extension?: string;
	hotspotScore?: number;
	loc?: number;
}

interface VirtualizedFileTreeProps {
	fileTree: FileTreeItem[];
	repoId: string;
	owner: string;
	name: string;
	defaultBranch?: string | null;
	isPrivate?: boolean | null;
	onFileSelect?: (filePath: string) => void;
	hotspotData?: Map<string, { score: number; loc: number }>;
	selectedFile?: string | null;
}

const FILE_ICONS: Record<string, { icon: string; color: string }> = {
	ts: { icon: "TS", color: "text-blue-400 bg-blue-500/20" },
	tsx: { icon: "TX", color: "text-blue-400 bg-blue-500/20" },
	js: { icon: "JS", color: "text-yellow-400 bg-yellow-500/20" },
	jsx: { icon: "JX", color: "text-yellow-400 bg-yellow-500/20" },
	py: { icon: "PY", color: "text-emerald-400 bg-emerald-500/20" },
	go: { icon: "GO", color: "text-cyan-400 bg-cyan-500/20" },
	rs: { icon: "RS", color: "text-orange-400 bg-orange-500/20" },
	java: { icon: "JV", color: "text-orange-500 bg-orange-500/20" },
	cpp: { icon: "C+", color: "text-blue-500 bg-blue-500/20" },
	c: { icon: "C", color: "text-gray-400 bg-gray-500/20" },
	rb: { icon: "RB", color: "text-red-400 bg-red-500/20" },
	php: { icon: "PH", color: "text-indigo-400 bg-indigo-500/20" },
	swift: { icon: "SW", color: "text-orange-400 bg-orange-500/20" },
	kt: { icon: "KT", color: "text-purple-400 bg-purple-500/20" },
	vue: { icon: "VU", color: "text-emerald-400 bg-emerald-500/20" },
	svelte: { icon: "SV", color: "text-orange-400 bg-orange-500/20" },
	css: { icon: "CS", color: "text-purple-400 bg-purple-500/20" },
	scss: { icon: "SC", color: "text-pink-400 bg-pink-500/20" },
	html: { icon: "HT", color: "text-orange-400 bg-orange-500/20" },
	json: { icon: "JS", color: "text-yellow-400 bg-yellow-500/20" },
	yaml: { icon: "YA", color: "text-red-400 bg-red-500/20" },
	yml: { icon: "YA", color: "text-red-400 bg-red-500/20" },
	md: { icon: "MD", color: "text-blue-300 bg-blue-500/20" },
	sql: { icon: "SQ", color: "text-amber-400 bg-amber-500/20" },
	prisma: { icon: "PR", color: "text-indigo-400 bg-indigo-500/20" },
	toml: { icon: "TO", color: "text-gray-400 bg-gray-500/20" },
	sh: { icon: "SH", color: "text-green-400 bg-green-500/20" },
	bash: { icon: "SH", color: "text-green-400 bg-green-500/20" },
	dockerfile: { icon: "DK", color: "text-blue-400 bg-blue-500/20" },
	env: { icon: "EN", color: "text-green-400 bg-green-500/20" },
	lock: { icon: "LK", color: "text-gray-500 bg-gray-500/20" },
	config: { icon: "CF", color: "text-gray-400 bg-gray-500/20" },
	test: { icon: "TE", color: "text-emerald-400 bg-emerald-500/20" },
	spec: { icon: "SP", color: "text-emerald-400 bg-emerald-500/20" },
};

function getFileIcon(filename: string): { icon: string; color: string } {
	const ext = filename.split(".").pop()?.toLowerCase() || "";
	const name = filename.toLowerCase();

	// Check for special filenames
	if (name === "dockerfile")
		return (
			FILE_ICONS.dockerfile || {
				icon: "DK",
				color: "text-blue-400 bg-blue-500/20",
			}
		);
	if (
		name.endsWith(".test.ts") ||
		name.endsWith(".test.tsx") ||
		name.endsWith(".test.js")
	)
		return (
			FILE_ICONS.test || {
				icon: "TE",
				color: "text-emerald-400 bg-emerald-500/20",
			}
		);
	if (name.endsWith(".spec.ts") || name.endsWith(".spec.tsx"))
		return (
			FILE_ICONS.spec || {
				icon: "SP",
				color: "text-emerald-400 bg-emerald-500/20",
			}
		);
	if (name.endsWith(".lock"))
		return (
			FILE_ICONS.lock || { icon: "LK", color: "text-gray-500 bg-gray-500/20" }
		);
	if (name.includes(".env"))
		return (
			FILE_ICONS.env || { icon: "EN", color: "text-green-400 bg-green-500/20" }
		);
	if (name.includes("config") || name.includes(".config."))
		return (
			FILE_ICONS.config || { icon: "CF", color: "text-gray-400 bg-gray-500/20" }
		);

	return (
		FILE_ICONS[ext] || {
			icon: ext.slice(0, 2).toUpperCase() || "?",
			color: "text-gray-400 bg-gray-500/20",
		}
	);
}

function getHotspotColor(score: number): string {
	if (score >= 0.7) return "text-destructive";
	if (score >= 0.4) return "text-primary";
	if (score >= 0.2) return "text-accent";
	return "text-muted-foreground";
}

function getHotspotBg(score: number): string {
	if (score >= 0.7) return "bg-destructive/10 border-destructive/30";
	if (score >= 0.4) return "bg-primary/10 border-primary/30";
	if (score >= 0.2) return "bg-accent/10 border-accent/30";
	return "bg-transparent border-transparent";
}

function formatLoc(loc: number | undefined): string {
	if (!loc || loc === 0) return "";
	if (loc >= 1000) return `${(loc / 1000).toFixed(1)}k`;
	return loc.toString();
}

export function VirtualizedFileTree({
	fileTree,
	repoId: _repoId,
	owner: _owner,
	name: _name,
	defaultBranch: _defaultBranch,
	isPrivate: _isPrivate,
	onFileSelect,
	hotspotData,
	selectedFile,
}: VirtualizedFileTreeProps) {
	const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
	const parentRef = React.useRef<HTMLDivElement>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const debouncedQuery = useDebounce(searchQuery, 350);

	const allPaths = useMemo(() => {
		const paths: string[] = [];
		const walk = (items: FileTreeItem[], parentPath: string) => {
			for (const item of items) {
				const currentPath = parentPath
					? `${parentPath}/${item.name}`
					: item.name;
				paths.push(currentPath);
				if ("items" in item && item.items) walk(item.items, currentPath);
			}
		};
		walk(fileTree, "");
		return paths;
	}, [fileTree]);

	const index = useMemo(() => {
		const idx = createIndex({ tokenize: "forward" });
		for (let i = 0; i < allPaths.length; i++) {
			const path = allPaths[i];
			if (path) idx.add(i, path);
		}
		return idx;
	}, [allPaths]);

	const matchingIndices = useFlexSearch(debouncedQuery, index, allPaths);
	const hasSearch = debouncedQuery.trim().length > 0;

	const toggleFolder = (path: string) => {
		setExpandedPaths((prev) => {
			const next = new Set(prev);
			if (next.has(path)) next.delete(path);
			else next.add(path);
			return next;
		});
	};

	const expandAll = () => {
		setExpandedPaths(
			new Set(
				allPaths.filter((_, i) => {
					const node = visibleNodes[i];
					return node?.isDirectory;
				}),
			),
		);
	};

	const collapseAll = () => setExpandedPaths(new Set());

	const filteredPaths = useMemo(() => {
		if (!hasSearch) return null;
		const pathsToShow = new Set<string>();
		for (const path of matchingIndices) {
			pathsToShow.add(path);
			const parts = path.split("/");
			let currentPath = "";
			for (const part of parts.slice(0, -1)) {
				currentPath = currentPath ? `${currentPath}/${part}` : part;
				pathsToShow.add(currentPath);
			}
		}
		return pathsToShow;
	}, [matchingIndices, hasSearch]);

	const visibleNodes = useMemo(() => {
		const nodes: FlatNode[] = [];
		const walk = (items: FileTreeItem[], depth: number, parentPath: string) => {
			const sortedItems = [...items].sort((a, b) => {
				const aIsDir = "items" in a;
				const bIsDir = "items" in b;
				if (aIsDir && !bIsDir) return -1;
				if (!aIsDir && bIsDir) return 1;
				return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
			});

			for (const item of sortedItems) {
				const currentPath = parentPath
					? `${parentPath}/${item.name}`
					: item.name;
				const isDirectory = "items" in item;

				if (filteredPaths && !filteredPaths.has(currentPath)) continue;

				const extension = isDirectory
					? undefined
					: item.name.split(".").pop()?.toLowerCase() || "";
				const hotspotInfo = hotspotData?.get(currentPath);

				nodes.push({
					id: currentPath,
					name: item.name,
					depth,
					isDirectory,
					items: isDirectory ? item.items : undefined,
					extension,
					hotspotScore: hotspotInfo?.score,
					loc: hotspotInfo?.loc,
				});

				const shouldExpand = filteredPaths || expandedPaths.has(currentPath);
				if (isDirectory && shouldExpand && item.items) {
					walk(item.items, depth + 1, currentPath);
				}
			}
		};
		walk(fileTree, 0, "");
		return nodes;
	}, [fileTree, expandedPaths, filteredPaths, hotspotData]);

	const rowVirtualizer = useVirtualizer({
		count: visibleNodes.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 32,
		overscan: 15,
	});

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="shrink-0 border-border border-b bg-muted/30 px-3 py-2">
				<div className="flex items-center justify-between">
					<span className="font-medium font-mono text-foreground text-sm tracking-tight">
						Files
					</span>
					<div className="flex items-center gap-1">
						<Button
							className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
							onClick={expandAll}
							size="sm"
							title="Expand all"
							variant="ghost"
						>
							<Expand className="h-3.5 w-3.5" />
						</Button>
						<Button
							className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
							onClick={collapseAll}
							size="sm"
							title="Collapse all"
							variant="ghost"
						>
							<Minimize2 className="h-3.5 w-3.5" />
						</Button>
					</div>
				</div>

				{/* Search */}
				<div className="relative mt-2">
					<Search className="absolute top-1.5 left-2 h-3.5 w-3.5 text-muted-foreground" />
					<Input
						className="h-7 border-border bg-background pl-7 font-mono text-xs placeholder:text-muted-foreground"
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search files..."
						value={searchQuery}
					/>
					{hasSearch && (
						<span className="absolute top-1.5 right-2 font-mono text-[10px] text-muted-foreground">
							{matchingIndices.length} matches
						</span>
					)}
				</div>
			</div>

			{/* File Tree */}
			<div className="relative flex-1 overflow-hidden">
				<div className="absolute inset-0 overflow-auto" ref={parentRef}>
					<div
						style={{
							height: `${rowVirtualizer.getTotalSize()}px`,
							width: "100%",
							position: "relative",
						}}
					>
						{rowVirtualizer.getVirtualItems().map((virtualRow) => {
							const node = visibleNodes[virtualRow.index];
							if (!node) return null;

							const fileIcon = node.isDirectory ? null : getFileIcon(node.name);
							const isSelected = selectedFile === node.id;
							const hotspotColor = node.hotspotScore
								? getHotspotColor(node.hotspotScore)
								: "";
							const hotspotBg = node.hotspotScore
								? getHotspotBg(node.hotspotScore)
								: "";

							return (
								<div
									key={virtualRow.key}
									style={{
										position: "absolute",
										top: 0,
										left: 0,
										width: "100%",
										height: `${virtualRow.size}px`,
										transform: `translateY(${virtualRow.start}px)`,
									}}
								>
									<button
										className={cn(
											"group flex h-8 w-full cursor-pointer items-center gap-1.5 border-transparent border-l-2 px-2 text-left transition-colors",
											isSelected
												? "border-primary bg-primary/10"
												: "hover:bg-muted/50",
											hotspotBg && !isSelected && hotspotBg,
										)}
										onClick={() => {
											if (node.isDirectory) toggleFolder(node.id);
											else onFileSelect?.(node.id);
										}}
										style={{ paddingLeft: `${node.depth * 16 + 8}px` }}
										type="button"
									>
										{/* Tree lines */}
										{node.depth > 0 && (
											<div
												className="absolute top-0 h-full border-border border-l"
												style={{ left: `${(node.depth - 1) * 16 + 16}px` }}
											/>
										)}

										{/* Expand/Collapse icon */}
										{node.isDirectory ? (
											<ChevronRight
												className={cn(
													"h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-150",
													expandedPaths.has(node.id) && "rotate-90",
												)}
											/>
										) : (
											<div className="h-3.5 w-3.5" />
										)}

										{/* File/Folder icon */}
										{node.isDirectory ? (
											expandedPaths.has(node.id) ? (
												<FolderOpen className="h-4 w-4 shrink-0 text-primary" />
											) : (
												<FolderOpen className="h-4 w-4 shrink-0 text-primary/70" />
											)
										) : (
											<div
												className={cn(
													"flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] font-bold font-mono text-[7px]",
													fileIcon?.color,
												)}
											>
												{fileIcon?.icon}
											</div>
										)}

										{/* Name */}
										<span
											className={cn(
												"truncate text-sm",
												node.isDirectory
													? "font-medium text-foreground/90"
													: "font-normal text-foreground/70",
												isSelected && "font-medium text-primary",
											)}
										>
											{node.name}
										</span>

										{/* Spacer */}
										<div className="flex-1" />

										{/* LOC badge */}
										{node.loc && node.loc > 0 && (
											<span className="font-mono text-[10px] text-muted-foreground/60">
												{formatLoc(node.loc)}
											</span>
										)}

										{/* Hotspot indicator */}
										{node.hotspotScore !== undefined &&
											node.hotspotScore > 0 && (
												<span
													className={cn(
														"ml-1 rounded px-1 py-0.5 font-medium font-mono text-[9px]",
														hotspotColor,
														hotspotBg,
														"border",
													)}
												>
													{node.hotspotScore.toFixed(2)}
												</span>
											)}
									</button>
								</div>
							);
						})}
					</div>

					{visibleNodes.length === 0 && (
						<div className="absolute inset-0 flex items-center justify-center">
							<div className="text-center">
								<p className="font-mono text-muted-foreground text-sm">
									{hasSearch ? "No matching files" : "No files"}
								</p>
								{hasSearch && (
									<p className="mt-1 font-mono text-muted-foreground text-xs">
										Try a different search term
									</p>
								)}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Footer */}
			<div className="shrink-0 border-border border-t bg-muted/30 px-3 py-1.5">
				<div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
					<span>{visibleNodes.length} items</span>
					{hotspotData && hotspotData.size > 0 && (
						<div className="flex items-center gap-2">
							<span className="flex items-center gap-1">
								<span className="h-2 w-2 rounded-full bg-destructive" />
								Critical
							</span>
							<span className="flex items-center gap-1">
								<span className="h-2 w-2 rounded-full bg-primary" />
								Warning
							</span>
							<span className="flex items-center gap-1">
								<span className="h-2 w-2 rounded-full bg-accent" />
								Normal
							</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
