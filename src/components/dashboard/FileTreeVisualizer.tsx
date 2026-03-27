"use client";

import {
	AlertTriangle,
	FileCode,
	FolderTree,
	Hash,
	Layers,
} from "lucide-react";
import { useTheme } from "next-themes";
import { memo, useCallback, useMemo, useState } from "react";
import { ResponsiveContainer, Tooltip, Treemap } from "recharts";
import type { FileTreeItem } from "~/lib/treeUtils";
import { cn } from "~/lib/utils";

interface FileTreeVisualizerProps {
	fileTree: FileTreeItem[];
	hotspotData?: Map<string, { score: number; loc: number }>;
	onFileClick?: (path: string) => void;
}

interface TreemapNode {
	name: string;        // full path — used as unique key by recharts
	displayName: string; // basename — used for rendering labels
	size: number;
	path: string;
	extension?: string;
	hotspotScore?: number;
	fill: string;
	isDirectory?: boolean;
}

// Architectural palette
const LANGUAGE_COLORS: Record<string, { light: string; dark: string }> = {
	ts: { light: "#1a1d2e", dark: "#e8e4dc" },
	tsx: { light: "#2a2d3e", dark: "#d8d4cc" },
	js: { light: "#3d5a99", dark: "#5a7ec2" },
	jsx: { light: "#3d5a99", dark: "#5a7ec2" },
	py: { light: "#c4953a", dark: "#d4a843" },
	go: { light: "#5a7d5a", dark: "#6b9e6b" },
	rs: { light: "#1a1d2e", dark: "#e8e4dc" },
	java: { light: "#6b6d7a", dark: "#7a7c88" },
	cpp: { light: "#7a7c88", dark: "#6b6d7a" },
	c: { light: "#7a7c88", dark: "#6b6d7a" },
	rb: { light: "#c4953a", dark: "#d4a843" },
	php: { light: "#8b5a2b", dark: "#a67240" },
	swift: { light: "#c4953a", dark: "#d4a843" },
	kt: { light: "#1a1d2e", dark: "#e8e4dc" },
	vue: { light: "#5a7d5a", dark: "#6b9e6b" },
	svelte: { light: "#c4953a", dark: "#d4a843" },
	css: { light: "#5a7ec2", dark: "#7a9ed2" },
	scss: { light: "#5a7ec2", dark: "#7a9ed2" },
	html: { light: "#3d5a99", dark: "#5a7ec2" },
	json: { light: "#6b6d7a", dark: "#7a7c88" },
	yaml: { light: "#6b6d7a", dark: "#7a7c88" },
	yml: { light: "#6b6d7a", dark: "#7a7c88" },
	md: { light: "#1a1d2e", dark: "#e8e4dc" },
	sql: { light: "#3d5a99", dark: "#5a7ec2" },
	env: { light: "#1a1d2e", dark: "#e8e4dc" },
	lock: { light: "#6b6d7a", dark: "#5a5c6a" },
	config: { light: "#6b6d7a", dark: "#7a7c88" },
	toml: { light: "#6b6d7a", dark: "#7a7c88" },
	sh: { light: "#1a1d2e", dark: "#e8e4dc" },
	bash: { light: "#1a1d2e", dark: "#e8e4dc" },
	dockerfile: { light: "#1a1d2e", dark: "#e8e4dc" },
};

const HOTSPOT_COLORS = {
	critical: { light: "#d64534", dark: "#e85d4a" },
	warning: { light: "#c4953a", dark: "#d4a843" },
	normal: { light: "#1a1d2e", dark: "#e8e4dc" },
	muted: { light: "#6b6d7a", dark: "#5a5c6a" },
};

// Cached color lookups
function getLanguageColor(ext: string, isDark: boolean): string {
	const colors = LANGUAGE_COLORS[ext.toLowerCase()];
	if (!colors) return isDark ? "#5a5c6a" : "#6b6d7a";
	return isDark ? colors.dark : colors.light;
}

function getHotspotColor(score: number, isDark: boolean): string {
	if (score >= 0.7)
		return isDark
			? HOTSPOT_COLORS.critical.dark
			: HOTSPOT_COLORS.critical.light;
	if (score >= 0.4)
		return isDark ? HOTSPOT_COLORS.warning.dark : HOTSPOT_COLORS.warning.light;
	if (score >= 0.2)
		return isDark ? HOTSPOT_COLORS.normal.dark : HOTSPOT_COLORS.normal.light;
	return isDark ? HOTSPOT_COLORS.muted.dark : HOTSPOT_COLORS.muted.light;
}

function getHotspotLevel(score: number): "critical" | "warning" | "normal" {
	if (score >= 0.7) return "critical";
	if (score >= 0.4) return "warning";
	return "normal";
}

function getContrastColor(hexColor: string): string {
	if (!hexColor || hexColor.startsWith("rgba")) return "#1a1d2e";
	try {
		const r = parseInt(hexColor.slice(1, 3), 16);
		const g = parseInt(hexColor.slice(3, 5), 16);
		const b = parseInt(hexColor.slice(5, 7), 16);
		const yiq = (r * 299 + g * 587 + b * 114) / 1000;
		return yiq >= 145 ? "#1a1d2e" : "#e8e4dc";
	} catch {
		return "#1a1d2e";
	}
}

// Flatten tree to list for better performance - avoid nested structure
function flattenTree(
	items: FileTreeItem[],
	parentPath: string,
	depth: number,
	maxDepth: number,
	result: { item: FileTreeItem; path: string; depth: number }[],
): void {
	if (depth > maxDepth) return;

	for (const item of items) {
		const currentPath = parentPath ? `${parentPath}/${item.name}` : item.name;
		result.push({ item, path: currentPath, depth });

		if ("items" in item && item.items && item.items.length > 0) {
			if (result.length < 5000) {
				flattenTree(item.items, currentPath, depth + 1, maxDepth, result);
			}
		}
	}
}

function convertToTreemapDataFlat(
	items: FileTreeItem[],
	isDark: boolean,
	hotspotData?: Map<string, { score: number; loc: number }>,
	colorMode: "language" | "hotspot" = "language",
): {
	flatData: TreemapNode[];
	stats: { files: number; dirs: number; totalLoc: number };
} {
	const flatItems: { item: FileTreeItem; path: string; depth: number }[] = [];
	flattenTree(items, "", 0, 6, flatItems); // Up to 6 levels deep

	const flatData: TreemapNode[] = [];
	let files = 0;
	let dirs = 0;
	let totalLoc = 0;

	for (const { item, path, depth } of flatItems) {
		const isDirectory = "items" in item && item.items;

		if (isDirectory) {
			dirs++;
			flatData.push({
				name: path || item.name,      // unique full path as recharts key
				displayName: item.name,        // basename for display
				size: 1, // Will be recalculated by Recharts
				path,
				fill: `rgba(${isDark ? "232,228,220" : "26,29,46"}, ${0.08 - depth * 0.02})`,
				isDirectory: true,
			});
		} else {
			files++;
			const ext = item.name.split(".").pop()?.toLowerCase() || "";
			const hotspotInfo = hotspotData?.get(path);
			const size = hotspotInfo?.loc || 1;
			totalLoc += size;

			let fill: string;
			if (colorMode === "hotspot" && hotspotInfo?.score) {
				fill = getHotspotColor(hotspotInfo.score, isDark);
			} else {
				fill = getLanguageColor(ext, isDark);
			}

			flatData.push({
				name: path,                    // unique full path as recharts key
				displayName: item.name,        // basename for display
				size,
				path,
				extension: ext,
				hotspotScore: hotspotInfo?.score,
				fill,
				isDirectory: false,
			});
		}
	}

	return { flatData, stats: { files, dirs, totalLoc } };
}

// Memoized custom content component
const CustomContent = memo(function CustomContent(props: {
	x?: number;
	y?: number;
	width?: number;
	height?: number;
	name?: string;
	displayName?: string;
	extension?: string;
	fill?: string;
	isDirectory?: boolean;
	hotspotScore?: number;
}) {
	const {
		x = 0,
		y = 0,
		width = 0,
		height = 0,
		name,
		displayName: rawDisplayName,
		extension,
		fill = "#6b6d7a",
		isDirectory,
		hotspotScore,
	} = props;

	if (width < 3 || height < 3) return null;

	const isSmall = width < 40 || height < 22;
	const showExt = width > 55 && height > 30 && !isDirectory;
	const displayName = String(rawDisplayName || name || "");
	const maxChars = Math.floor(width / 6);
	const truncatedName =
		displayName.length > maxChars
			? `${displayName.slice(0, Math.max(0, maxChars - 1))}…`
			: displayName;

	const contrastColor = getContrastColor(fill);
	const strokeColor =
		hotspotScore && hotspotScore >= 0.4
			? hotspotScore >= 0.7
				? "#d64534"
				: "#c4953a"
			: "rgba(0,0,0,0.1)";

	return (
		<g>
			<rect
				fill={fill}
				height={height}
				rx={0}
				ry={0}
				stroke={strokeColor}
				strokeWidth={hotspotScore && hotspotScore >= 0.4 ? 1.5 : 0.5}
				width={width}
				x={x}
				y={y}
			/>

			{/* Extension badge */}
			{showExt && extension && (
				<text
					fill={contrastColor}
					fontFamily="IBM Plex Mono, monospace"
					fontSize={8}
					opacity={0.5}
					style={{ pointerEvents: "none" }}
					x={x + 4}
					y={y + height - 5}
				>
					{extension.toUpperCase()}
				</text>
			)}

			{/* Label */}
			{!isSmall && !isDirectory && (
				<text
					dominantBaseline="middle"
					fill={contrastColor}
					fontFamily="IBM Plex Mono, monospace"
					fontSize={height > 40 ? 9 : 8}
					fontWeight={500}
					style={{ pointerEvents: "none" }}
					textAnchor="middle"
					x={x + width / 2}
					y={y + height / 2 - (showExt ? 3 : 0)}
				>
					{truncatedName}
				</text>
			)}

			{/* Indicator for very small blocks */}
			{isSmall && !isDirectory && width > 6 && height > 4 && (
				<rect
					fill={contrastColor}
					height={2}
					opacity={0.3}
					width={Math.min(width - 4, 3)}
					x={x + 2}
					y={y + 2}
				/>
			)}
		</g>
	);
});

// Memoized tooltip
const CustomTooltip = memo(function CustomTooltip({
	active,
	payload,
	isDark,
}: {
	active?: boolean;
	payload?: { payload: TreemapNode }[];
	isDark: boolean;
}) {
	if (!active || !payload?.[0]) return null;

	const data = payload[0].payload;
	const hotspotLevel = data.hotspotScore
		? getHotspotLevel(data.hotspotScore)
		: null;

	return (
		<div className="min-w-[180px] border border-border bg-background">
			<div className="border-border border-b px-3 py-2">
				<div className="flex items-center gap-2">
					{data.isDirectory ? (
						<FolderTree className="h-3 w-3 text-muted-foreground" />
					) : (
						<FileCode className="h-3 w-3 text-muted-foreground" />
					)}
					<span className="truncate font-mono text-foreground text-xs">
						{data.displayName || data.name}
					</span>
				</div>
			</div>
			<div className="grid grid-cols-2 gap-px bg-border">
				<div className="bg-background px-3 py-1.5">
					<div className="font-mono text-[8px] text-muted-foreground uppercase">
						LOC
					</div>
					<div className="font-mono text-foreground text-xs tabular-nums">
						{data.size.toLocaleString()}
					</div>
				</div>
				{data.extension && !data.isDirectory && (
					<div className="bg-background px-3 py-1.5">
						<div className="font-mono text-[8px] text-muted-foreground uppercase">
							Type
						</div>
						<div className="font-mono text-foreground text-xs uppercase">
							{data.extension}
						</div>
					</div>
				)}
				{data.hotspotScore !== undefined && !data.isDirectory && (
					<div className="col-span-2 bg-background px-3 py-1.5">
						<div className="flex items-center justify-between">
							<span className="font-mono text-[8px] text-muted-foreground uppercase">
								Risk
							</span>
							<span
								className={cn(
									"font-mono text-xs tabular-nums",
									hotspotLevel === "critical" && "text-destructive",
									hotspotLevel === "warning" && "text-accent",
									hotspotLevel === "normal" && "text-foreground",
								)}
							>
								{(data.hotspotScore * 10).toFixed(2)}/10
							</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
});

export function FileTreeVisualizer({
	fileTree,
	hotspotData,
	onFileClick,
}: FileTreeVisualizerProps) {
	const { resolvedTheme } = useTheme();
	const isDark = resolvedTheme === "dark";
	const [colorMode, setColorMode] = useState<"language" | "hotspot">(
		"language",
	);

	// Memoize the data conversion
	const { treemapData, stats } = useMemo(() => {
		if (fileTree.length === 0)
			return { treemapData: [], stats: { files: 0, dirs: 0, totalLoc: 0 } };

		const { flatData, stats } = convertToTreemapDataFlat(
			fileTree,
			isDark,
			hotspotData,
			colorMode,
		);

		return { treemapData: flatData, stats };
	}, [fileTree, isDark, hotspotData, colorMode]);

	// Memoize click handler
	const handleClick = useCallback(
		(node: any) => {
			if (node?.path && !node.isDirectory && onFileClick) {
				onFileClick(node.path);
			}
		},
		[onFileClick],
	);

	// Memoize toggle handlers
	const handleLanguageMode = useCallback(() => setColorMode("language"), []);
	const handleHotspotMode = useCallback(() => setColorMode("hotspot"), []);

	if (fileTree.length === 0) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
				<FolderTree className="h-8 w-8 opacity-20" />
				<p className="font-mono text-xs uppercase tracking-wider">No files</p>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="shrink-0 border-border border-b px-4 py-2.5">
				<div className="flex items-center justify-between">
					<div>
						<span className="font-mono text-foreground text-xs">
							File Structure
						</span>
						<div className="mt-0.5 flex items-center gap-2 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
							<span>{stats.files} files</span>
							<span className="text-border">·</span>
							<span>{stats.dirs} folders</span>
						</div>
					</div>

					{/* Mode toggle */}
					<div className="flex border border-border">
						<button
							className={cn(
								"px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors",
								colorMode === "language"
									? "bg-foreground text-background"
									: "text-muted-foreground hover:text-foreground",
							)}
							onClick={handleLanguageMode}
							type="button"
						>
							Language
						</button>
						<button
							className={cn(
								"border-border border-l px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors",
								colorMode === "hotspot"
									? "bg-foreground text-background"
									: "text-muted-foreground hover:text-foreground",
							)}
							onClick={handleHotspotMode}
							type="button"
						>
							Hotspot
						</button>
					</div>
				</div>
			</div>

			{/* Treemap */}
			<div className="relative flex-1">
				<ResponsiveContainer height="100%" width="100%">
					<Treemap
						aspectRatio={1.5}
						content={<CustomContent />}
						data={treemapData as any}
						dataKey="size"
						isAnimationActive={false}
						onClick={handleClick}
						stroke="var(--color-border)"
					>
						<Tooltip
							content={<CustomTooltip isDark={isDark} />}
							cursor={false}
							wrapperStyle={{ zIndex: 100 }}
						/>
					</Treemap>
				</ResponsiveContainer>
			</div>

			{/* Footer legend */}
			<div className="shrink-0 border-border border-t px-4 py-2">
				<div className="flex items-center justify-between">
					<span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
						Click to view
					</span>
					<div className="flex items-center gap-3">
						{colorMode === "hotspot" ? (
							<>
								<div className="flex items-center gap-1">
									<span className="h-1.5 w-1.5 bg-destructive" />
									<span className="font-mono text-[8px] text-muted-foreground uppercase">
										Critical
									</span>
								</div>
								<div className="flex items-center gap-1">
									<span className="h-1.5 w-1.5 bg-accent" />
									<span className="font-mono text-[8px] text-muted-foreground uppercase">
										Warning
									</span>
								</div>
							</>
						) : (
							<>
								<div className="flex items-center gap-1">
									<span
										className="h-1.5 w-1.5"
										style={{ backgroundColor: getLanguageColor("ts", isDark) }}
									/>
									<span className="font-mono text-[8px] text-muted-foreground uppercase">
										TS
									</span>
								</div>
								<div className="flex items-center gap-1">
									<span
										className="h-1.5 w-1.5"
										style={{ backgroundColor: getLanguageColor("js", isDark) }}
									/>
									<span className="font-mono text-[8px] text-muted-foreground uppercase">
										JS
									</span>
								</div>
								<div className="flex items-center gap-1">
									<span
										className="h-1.5 w-1.5"
										style={{ backgroundColor: getLanguageColor("py", isDark) }}
									/>
									<span className="font-mono text-[8px] text-muted-foreground uppercase">
										PY
									</span>
								</div>
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
