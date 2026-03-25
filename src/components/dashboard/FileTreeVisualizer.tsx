"use client";

import {
	AlertTriangle,
	FileCode,
	FolderTree,
	Hash,
	Layers,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useMemo, useState } from "react";
import { ResponsiveContainer, Tooltip, Treemap } from "recharts";
import type { FileTreeItem } from "~/lib/treeUtils";
import { cn } from "~/lib/utils";

interface FileTreeVisualizerProps {
	fileTree: FileTreeItem[];
	hotspotData?: Map<string, { score: number; loc: number }>;
	onFileClick?: (path: string) => void;
}

interface TreemapNode {
	name: string;
	size: number;
	path: string;
	extension?: string;
	hotspotScore?: number;
	children?: TreemapNode[];
	fill: string;
	isDirectory?: boolean;
}

const LANGUAGE_COLORS: Record<string, string> = {
	ts: "#60a5fa",
	tsx: "#818cf8",
	js: "#facc15",
	jsx: "#fbbf24",
	py: "#4ade80",
	go: "#22d3ee",
	rs: "#fb923c",
	java: "#f97316",
	cpp: "#a78bfa",
	c: "#94a3b8",
	rb: "#f87171",
	php: "#c084fc",
	swift: "#f472b6",
	kt: "#a855f7",
	vue: "#34d399",
	svelte: "#fb923c",
	css: "#f472b6",
	scss: "#ec4899",
	html: "#fb923c",
	json: "#94a3b8",
	yaml: "#fb7185",
	yml: "#fb7185",
	md: "#60a5fa",
	sql: "#fbbf24",
	env: "#4ade80",
	lock: "#64748b",
	config: "#818cf8",
	toml: "#f97316",
	sh: "#4ade80",
	bash: "#4ade80",
	dockerfile: "#22d3ee",
};

const HOTSPOT_COLORS = {
	critical: "#ef4444",
	warning: "#f59e0b",
	normal: "#22c55e",
	muted: "#64748b",
};

function getLanguageColor(ext: string): string {
	return LANGUAGE_COLORS[ext.toLowerCase()] || "#64748b";
}

function getHotspotColor(score: number): string {
	if (score >= 0.7) return HOTSPOT_COLORS.critical;
	if (score >= 0.4) return HOTSPOT_COLORS.warning;
	if (score >= 0.2) return HOTSPOT_COLORS.normal;
	return HOTSPOT_COLORS.muted;
}

function getHotspotLevel(score: number): "critical" | "warning" | "normal" {
	if (score >= 0.7) return "critical";
	if (score >= 0.4) return "warning";
	return "normal";
}

function getFolderColor(depth: number): string {
	const colors = [
		"rgba(56, 189, 248, 0.5)",
		"rgba(56, 189, 248, 0.4)",
		"rgba(56, 189, 248, 0.3)",
		"rgba(56, 189, 248, 0.22)",
		"rgba(56, 189, 248, 0.16)",
	];
	return colors[Math.min(depth, colors.length - 1)] as string;
}

function countFiles(items: FileTreeItem[]): number {
	let count = 0;
	for (const item of items) {
		if ("items" in item && item.items) {
			count += countFiles(item.items);
		} else {
			count++;
		}
	}
	return count;
}

function countDirs(items: FileTreeItem[]): number {
	let count = 0;
	for (const item of items) {
		if ("items" in item && item.items) {
			count++;
			count += countDirs(item.items);
		}
	}
	return count;
}

function getTotalLoc(
	items: FileTreeItem[],
	hotspotData?: Map<string, { score: number; loc: number }>,
	parentPath = "",
): number {
	let total = 0;
	for (const item of items) {
		const currentPath = parentPath ? `${parentPath}/${item.name}` : item.name;
		if ("items" in item && item.items) {
			total += getTotalLoc(item.items, hotspotData, currentPath);
		} else {
			const info = hotspotData?.get(currentPath);
			total += info?.loc || 0;
		}
	}
	return total;
}

function convertToTreemapData(
	items: FileTreeItem[],
	parentPath: string,
	depth: number,
	hotspotData?: Map<string, { score: number; loc: number }>,
	colorMode: "language" | "hotspot" = "language",
): TreemapNode[] {
	return items.map((item) => {
		const currentPath = parentPath ? `${parentPath}/${item.name}` : item.name;
		const isDirectory = "items" in item && item.items;

		if (isDirectory) {
			const children = convertToTreemapData(
				item.items,
				currentPath,
				depth + 1,
				hotspotData,
				colorMode,
			);
			const totalSize = children.reduce((sum, child) => sum + child.size, 0);
			return {
				name: item.name,
				size: Math.max(totalSize, 1),
				path: currentPath,
				children,
				fill: getFolderColor(depth),
				isDirectory: true,
			};
		}

		const ext = item.name.split(".").pop()?.toLowerCase() || "";
		const hotspotInfo = hotspotData?.get(currentPath);
		const size = hotspotInfo?.loc || 1;

		let fill: string;
		if (colorMode === "hotspot" && hotspotInfo?.score) {
			fill = getHotspotColor(hotspotInfo.score);
		} else {
			fill = getLanguageColor(ext);
		}

		return {
			name: item.name,
			size,
			path: currentPath,
			extension: ext,
			hotspotScore: hotspotInfo?.score,
			fill,
			isDirectory: false,
		};
	});
}

interface CustomContentProps {
	x?: number;
	y?: number;
	width?: number;
	height?: number;
	name?: string;
	extension?: string;
	fill?: string;
	isDirectory?: boolean;
	hotspotScore?: number;
}

function CustomContent(props: CustomContentProps) {
	const {
		x = 0,
		y = 0,
		width = 0,
		height = 0,
		name,
		extension,
		fill,
		isDirectory,
		hotspotScore,
	} = props;

	if (width < 4 || height < 4) return null;

	const isVerySmall = width < 35 || height < 20;
	const isSmall = width < 55 || height < 28;
	const showExt = width > 70 && height > 38 && !isDirectory;
	const displayName = String(name || "");
	const maxChars = Math.floor(width / 7);
	const truncatedName =
		displayName.length > maxChars
			? `${displayName.slice(0, maxChars - 2)}..`
			: displayName;

	const hotspotBorder =
		hotspotScore && hotspotScore >= 0.7
			? "rgba(239, 68, 68, 0.8)"
			: hotspotScore && hotspotScore >= 0.4
				? "rgba(245, 158, 11, 0.6)"
				: "transparent";

	return (
		<g>
			{/* Main rectangle with gradient overlay */}
			<rect
				fill={fill || "#475569"}
				height={height}
				rx={4}
				ry={4}
				stroke={hotspotBorder}
				strokeWidth={hotspotBorder !== "transparent" ? 2 : 0.5}
				style={{
					cursor: isDirectory ? "default" : "pointer",
					transition: "opacity 0.1s",
				}}
				width={width}
				x={x}
				y={y}
			/>

			{/* Top highlight gradient */}
			{!isVerySmall && (
				<rect
					fill="url(#topHighlight)"
					height={Math.min(height * 0.35, 10)}
					rx={4}
					ry={4}
					style={{ pointerEvents: "none" }}
					width={width}
					x={x}
					y={y}
				/>
			)}

			{/* Folder icon for directories */}
			{isDirectory && !isSmall && width > 80 && (
				<text
					dominantBaseline="middle"
					fill="rgba(255, 255, 255, 0.4)"
					fontSize={12}
					style={{ pointerEvents: "none" }}
					textAnchor="middle"
					x={x + width / 2}
					y={y + height / 2 - (showExt ? 6 : 2)}
				>
					📁
				</text>
			)}

			{/* Label */}
			{!isSmall && !isDirectory && (
				<text
					dominantBaseline="middle"
					fill="rgba(255, 255, 255, 0.95)"
					fontFamily="ui-monospace, SFMono-Regular, monospace"
					fontSize={height > 45 ? 11 : 10}
					fontWeight={500}
					style={{
						pointerEvents: "none",
						textShadow: "0 1px 2px rgba(0,0,0,0.3)",
					}}
					textAnchor="middle"
					x={x + width / 2}
					y={y + height / 2 - (showExt ? 4 : 0)}
				>
					{truncatedName}
				</text>
			)}

			{/* Extension badge */}
			{showExt && extension && (
				<text
					dominantBaseline="middle"
					fill="rgba(255, 255, 255, 0.55)"
					fontFamily="ui-monospace, SFMono-Regular, monospace"
					fontSize={9}
					fontWeight={600}
					letterSpacing="0.08em"
					style={{ pointerEvents: "none" }}
					textAnchor="middle"
					x={x + width / 2}
					y={y + height / 2 + 10}
				>
					{extension.toUpperCase()}
				</text>
			)}

			{/* Small size indicator for tiny blocks */}
			{isVerySmall && !isDirectory && width > 20 && height > 14 && (
				<rect
					fill="rgba(255,255,255,0.2)"
					height={Math.min(height - 4, 4)}
					rx={2}
					style={{ pointerEvents: "none" }}
					width={Math.min(width - 4, 6)}
					x={x + 2}
					y={y + 2}
				/>
			)}
		</g>
	);
}

// SVG gradient definition embedded in component

interface TooltipPayloadItem {
	payload: TreemapNode;
}

function CustomTooltip({
	active,
	payload,
}: {
	active?: boolean;
	payload?: TooltipPayloadItem[];
}) {
	if (!active || !payload || !payload[0]) return null;

	const data = payload[0].payload;
	const hotspotLevel = data.hotspotScore
		? getHotspotLevel(data.hotspotScore)
		: null;

	return (
		<div className="min-w-[220px] rounded-xl border border-white/10 bg-gray-900/95 px-0 shadow-2xl backdrop-blur-xl">
			{/* Header */}
			<div className="border-white/10 border-b px-4 py-3">
				<div className="flex items-center gap-2.5">
					{data.isDirectory ? (
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20">
							<FolderTree className="h-4 w-4 text-sky-400" />
						</div>
					) : (
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
							<FileCode className="h-4 w-4 text-white/70" />
						</div>
					)}
					<div className="min-w-0 flex-1">
						<p className="truncate font-semibold text-sm text-white">
							{data.name}
						</p>
						<p className="mt-0.5 truncate text-white/40 text-xs">{data.path}</p>
					</div>
				</div>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-2 gap-px bg-white/5 p-3">
				<div className="rounded-lg bg-gray-900/80 px-3 py-2.5">
					<div className="flex items-center gap-1.5 text-white/40 text-xs">
						<Hash className="h-3 w-3" />
						<span>Lines</span>
					</div>
					<p className="mt-1 font-mono font-semibold text-sm text-white">
						{data.size.toLocaleString()}
					</p>
				</div>

				{data.extension && !data.isDirectory && (
					<div className="rounded-lg bg-gray-900/80 px-3 py-2.5">
						<div className="flex items-center gap-1.5 text-white/40 text-xs">
							<Layers className="h-3 w-3" />
							<span>Type</span>
						</div>
						<div className="mt-1">
							<span
								className="inline-block rounded-md px-2 py-0.5 font-mono font-semibold text-xs uppercase"
								style={{
									backgroundColor: `${getLanguageColor(data.extension)}25`,
									color: getLanguageColor(data.extension),
									border: `1px solid ${getLanguageColor(data.extension)}40`,
								}}
							>
								{data.extension}
							</span>
						</div>
					</div>
				)}

				{data.hotspotScore !== undefined && !data.isDirectory && (
					<div
						className={cn(
							"col-span-2 rounded-lg px-3 py-2.5",
							hotspotLevel === "critical" && "bg-red-500/10",
							hotspotLevel === "warning" && "bg-amber-500/10",
							hotspotLevel === "normal" && "bg-emerald-500/10",
						)}
					>
						<div className="flex items-center justify-between">
							<span className="flex items-center gap-1.5 text-white/60 text-xs">
								<AlertTriangle
									className={cn(
										"h-3.5 w-3.5",
										hotspotLevel === "critical" && "text-red-400",
										hotspotLevel === "warning" && "text-amber-400",
										hotspotLevel === "normal" && "text-emerald-400",
									)}
								/>
								Hotspot Score
							</span>
							<span
								className={cn(
									"font-bold font-mono text-sm",
									hotspotLevel === "critical" && "text-red-400",
									hotspotLevel === "warning" && "text-amber-400",
									hotspotLevel === "normal" && "text-emerald-400",
								)}
							>
								{data.hotspotScore.toFixed(3)}
							</span>
						</div>
						<div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
							<div
								className={cn(
									"h-full rounded-full transition-all",
									hotspotLevel === "critical" && "bg-red-500",
									hotspotLevel === "warning" && "bg-amber-500",
									hotspotLevel === "normal" && "bg-emerald-500",
								)}
								style={{ width: `${Math.min(data.hotspotScore * 100, 100)}%` }}
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

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
	const [hoveredNode, setHoveredNode] = useState<string | null>(null);

	const fileCount = useMemo(() => countFiles(fileTree), [fileTree]);
	const dirCount = useMemo(() => countDirs(fileTree), [fileTree]);
	const totalLoc = useMemo(
		() => getTotalLoc(fileTree, hotspotData),
		[fileTree, hotspotData],
	);

	const treemapData = useMemo(() => {
		return convertToTreemapData(fileTree, "", 0, hotspotData, colorMode);
	}, [fileTree, hotspotData, colorMode]);

	if (fileTree.length === 0) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
				<div className="rounded-2xl bg-muted/30 p-4">
					<FolderTree className="h-12 w-12 opacity-30" />
				</div>
				<div className="text-center">
					<p className="font-medium text-foreground text-sm">
						No files to visualize
					</p>
					<p className="mt-1 text-xs">
						Repository analysis may still be in progress
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			{/* SVG Gradient Definitions */}
			<svg aria-hidden="true" className="absolute h-0 w-0">
				<defs>
					<linearGradient id="topHighlight" x1="0" x2="0" y1="0" y2="1">
						<stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
						<stop offset="100%" stopColor="rgba(255,255,255,0)" />
					</linearGradient>
				</defs>
			</svg>

			{/* Header */}
			<div className="shrink-0 border-border/50 border-b bg-gradient-to-r from-muted/30 to-muted/10 px-5 py-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/15">
							<FolderTree className="h-4 w-4 text-sky-400" />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<span className="font-semibold text-foreground text-sm">
									File Structure
								</span>
							</div>
							<div className="mt-0.5 flex items-center gap-3 text-muted-foreground text-xs">
								<span>{fileCount} files</span>
								<span className="text-border">·</span>
								<span>{dirCount} folders</span>
								{totalLoc > 0 && (
									<>
										<span className="text-border">·</span>
										<span>{totalLoc.toLocaleString()} LOC</span>
									</>
								)}
							</div>
						</div>
					</div>

					{/* Mode toggle */}
					<div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1">
						<button
							className={cn(
								"flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium text-xs transition-all duration-150",
								colorMode === "language"
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground",
							)}
							onClick={() => setColorMode("language")}
							type="button"
						>
							<span className="h-2 w-2 rounded-full bg-blue-500" />
							Language
						</button>
						<button
							className={cn(
								"flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium text-xs transition-all duration-150",
								colorMode === "hotspot"
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground",
							)}
							onClick={() => setColorMode("hotspot")}
							type="button"
						>
							<span className="h-2 w-2 rounded-full bg-amber-500" />
							Hotspot
						</button>
					</div>
				</div>
			</div>

			{/* Treemap */}
			<div className="relative flex-1 p-4">
				<ResponsiveContainer height="100%" width="100%">
					<Treemap
						aspectRatio={4 / 3}
						content={<CustomContent />}
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						data={treemapData as any}
						dataKey="size"
						isAnimationActive={false}
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						onClick={(node: any) => {
							if (node?.path && !node.isDirectory && onFileClick) {
								setHoveredNode(node.path);
								onFileClick(node.path);
								setTimeout(() => setHoveredNode(null), 300);
							}
						}}
						stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}
					>
						<Tooltip
							content={<CustomTooltip />}
							cursor={false}
							wrapperStyle={{ zIndex: 100 }}
						/>
					</Treemap>
				</ResponsiveContainer>
			</div>

			{/* Legend */}
			<div className="shrink-0 border-border/50 border-t bg-gradient-to-r from-muted/20 to-muted/5 px-5 py-2.5">
				<div className="flex items-center justify-between">
					<span className="text-muted-foreground text-xs">
						Click a file to inspect source
					</span>
					<div className="flex items-center gap-5">
						{colorMode === "hotspot" ? (
							<>
								<span className="flex items-center gap-2">
									<span className="h-3 w-3 rounded-sm bg-red-500 shadow-red-500/20 shadow-sm" />
									<span className="text-muted-foreground text-xs">
										Critical (≥0.7)
									</span>
								</span>
								<span className="flex items-center gap-2">
									<span className="h-3 w-3 rounded-sm bg-amber-500 shadow-amber-500/20 shadow-sm" />
									<span className="text-muted-foreground text-xs">
										Warning (≥0.4)
									</span>
								</span>
								<span className="flex items-center gap-2">
									<span className="h-3 w-3 rounded-sm bg-emerald-500 shadow-emerald-500/20 shadow-sm" />
									<span className="text-muted-foreground text-xs">Normal</span>
								</span>
							</>
						) : (
							<>
								<span className="flex items-center gap-2">
									<span className="h-3 w-3 rounded-sm bg-[#60a5fa] shadow-blue-500/20 shadow-sm" />
									<span className="text-muted-foreground text-xs">
										TypeScript
									</span>
								</span>
								<span className="flex items-center gap-2">
									<span className="h-3 w-3 rounded-sm bg-[#facc15] shadow-sm shadow-yellow-500/20" />
									<span className="text-muted-foreground text-xs">
										JavaScript
									</span>
								</span>
								<span className="flex items-center gap-2">
									<span className="h-3 w-3 rounded-sm bg-[#4ade80] shadow-green-500/20 shadow-sm" />
									<span className="text-muted-foreground text-xs">Python</span>
								</span>
								<span className="flex items-center gap-2">
									<span className="h-3 w-3 rounded-sm bg-sky-500/50" />
									<span className="text-muted-foreground text-xs">Folders</span>
								</span>
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
