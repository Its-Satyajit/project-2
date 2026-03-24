"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import {
	ChevronRightIcon,
	FileIcon,
	FolderIcon,
	SearchIcon,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import type { FileTreeItem } from "~/components/CollapsibleFileTree";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { createIndex, useFlexSearch } from "~/lib/flexsearch";
import { useDebounce } from "~/lib/useDebounce";
import { cn } from "~/lib/utils";
import { Input } from "../ui/input";

interface FlatNode {
	id: string; // full path
	name: string;
	depth: number;
	isDirectory: boolean;
	items?: FileTreeItem[];
}

interface VirtualizedFileTreeProps {
	fileTree: FileTreeItem[];
	repoId: string;
	owner: string;
	name: string;
	defaultBranch?: string | null;
	isPrivate?: boolean | null;
	onFileSelect?: (filePath: string) => void;
}

export function VirtualizedFileTree({
	fileTree,
	repoId,
	owner,
	name,
	defaultBranch,
	isPrivate,
	onFileSelect,
}: VirtualizedFileTreeProps) {
	const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
	const parentRef = React.useRef<HTMLDivElement>(null);

	const allPaths = useMemo(() => {
		const paths: string[] = [];

		const walk = (items: FileTreeItem[], parentPath: string) => {
			for (const item of items) {
				const currentPath = parentPath
					? `${parentPath}/${item.name}`
					: item.name;
				paths.push(currentPath);

				if ("items" in item && item.items) {
					walk(item.items, currentPath);
				}
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

	const [searchQuery, setSearchQuery] = useState("");
	const debouncedQuery = useDebounce(searchQuery, 350);

	const matchingIndices = useFlexSearch(debouncedQuery, index, allPaths);
	const hasSearch = debouncedQuery.trim().length > 0;

	const toggleFolder = (path: string) => {
		const newSet = new Set(expandedPaths);
		if (newSet.has(path)) {
			newSet.delete(path);
		} else {
			newSet.add(path);
		}
		setExpandedPaths(newSet);
	};

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

	// Flatten the tree based on expanded state (or search results)
	const visibleNodes = useMemo(() => {
		const nodes: FlatNode[] = [];

		const walk = (items: FileTreeItem[], depth: number, parentPath: string) => {
			// Sort items: directories first, then files, alphabetically within each group
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

				// If searching, only show paths in filteredPaths
				if (filteredPaths && !filteredPaths.has(currentPath)) {
					continue;
				}

				nodes.push({
					id: currentPath,
					name: item.name,
					depth,
					isDirectory,
					items: isDirectory ? item.items : undefined,
				});

				// When searching, auto-expand matching paths; otherwise use expandedPaths
				const shouldExpand = filteredPaths || expandedPaths.has(currentPath);
				if (isDirectory && shouldExpand && item.items) {
					walk(item.items, depth + 1, currentPath);
				}
			}
		};

		walk(fileTree, 0, "");
		return nodes;
	}, [fileTree, expandedPaths, filteredPaths]);

	const rowVirtualizer = useVirtualizer({
		count: visibleNodes.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 36, // height of each row
		overscan: 10,
	});

	return (
		<>
			<Card className="flex h-full flex-col border-none bg-transparent shadow-none">
				<CardHeader className="shrink-0 px-4 py-3">
					<CardTitle className="text-base text-white">
						Repository Explorer
					</CardTitle>
					<div className="relative mt-2">
						<SearchIcon className="absolute top-2 left-2 h-4 w-4 text-white/30" />
						<Input
							className="h-8 border-white/10 bg-white/5 pl-8 text-white placeholder:text-white/30"
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search files..."
							value={searchQuery}
						/>
					</div>
				</CardHeader>
				<CardContent className="relative flex-1 overflow-hidden p-0">
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
										<div
											className={cn(
												"group flex items-center px-2 hover:bg-white/5",
											)}
											style={{ paddingLeft: `${node.depth * 1.25}rem` }}
										>
											{node.isDirectory ? (
												<Button
													className="h-8 w-full justify-start gap-2 px-1 hover:bg-transparent"
													onClick={() => toggleFolder(node.id)}
													size="sm"
													variant="ghost"
												>
													<ChevronRightIcon
														className={cn(
															"h-4 w-4 text-white/40 transition-transform",
															expandedPaths.has(node.id) && "rotate-90",
														)}
													/>
													<FolderIcon className="h-4 w-4 fill-blue-500/20 text-blue-400" />
													<span className="truncate font-medium text-sm text-white/80">
														{node.name}
													</span>
												</Button>
											) : (
												<Button
													className="h-8 w-full justify-start gap-2 pr-1 pl-6 hover:bg-transparent"
													onClick={() => onFileSelect?.(node.id)}
													size="sm"
													variant="ghost"
												>
													<FileIcon className="h-4 w-4 text-white/40" />
													<span className="truncate font-normal text-sm text-white/60">
														{node.name}
													</span>
												</Button>
											)}
										</div>
									</div>
								);
							})}
						</div>
					</div>
					{visibleNodes.length === 0 && (
						<div className="absolute inset-0 flex items-center justify-center text-white/30">
							No files found.
						</div>
					)}
				</CardContent>
			</Card>
		</>
	);
}
