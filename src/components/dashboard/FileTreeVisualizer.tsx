"use client";

import { AlertTriangle, FileCode, FolderTree } from "lucide-react";
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
	ts: "#3b82f6",
	tsx: "#3b82f6",
	js: "#eab308",
	jsx: "#eab308",
	py: "#22c55e",
	go: "#06b6d4",
	rs: "#f97316",
	java: "#f97316",
	cpp: "#6366f1",
	c: "#64748b",
	rb: "#ef4444",
	php: "#8b5cf6",
	swift: "#f43f5e",
	kt: "#a855f7",
	vue: "#10b981",
	svelte: "#f97316",
	css: "#ec4899",
	html: "#f97316",
	json: "#64748b",
	yaml: "#e11d48",
	md: "#3b82f6",
	sql: "#f59e0b",
	env: "#22c55e",
	lock: "#475569",
	config: "#6366f1",
};

const HOTSPOT_COLORS = {
	critical: "#ef4444",
	warning: "#f59e0b",
	normal: "#22c55e",
	muted: "#475569",
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
	const idx = Math.min(depth, 4);
	return [
		"rgba(59,130,246,0.35)",
		"rgba(59,130,246,0.28)",
		"rgba(59,130,246,0.22)",
		"rgba(59,130,246,0.18)",
		"rgba(59,130,246,0.15)",
	][idx] as string;
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
	depth?: number;
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

	const isSmall = width < 50 || height < 25;
	const showExt = width > 60 && height > 35 && !isDirectory;
	const displayName = String(name || "");
	const truncatedName =
		displayName.length > width / 6.5
			? `${displayName.slice(0, Math.floor(width / 6.5) - 2)}..`
			: displayName;

	const hotspotBorder =
		hotspotScore && hotspotScore >= 0.7
			? "rgba(239, 68, 68, 0.6)"
			: hotspotScore && hotspotScore >= 0.4
				? "rgba(245, 158, 11, 0.4)"
				: "transparent";

	return (
		<g>
			{/* Main rectangle */}
			<rect
				fill={fill || "#475569"}
				height={height}
				rx={3}
				ry={3}
				stroke={hotspotBorder}
				strokeWidth={hotspotBorder !== "transparent" ? 2 : 1}
				style={{ cursor: isDirectory ? "default" : "pointer" }}
				width={width}
				x={x}
				y={y}
			/>

			{/* Inner highlight for depth */}
			{!isDirectory && width > 30 && height > 20 && (
				<rect
					fill="rgba(255, 255, 255, 0.08)"
					height={Math.min(height * 0.4, 12)}
					rx={2}
					ry={2}
					style={{ pointerEvents: "none" }}
					width={width - 4}
					x={x + 2}
					y={y + 2}
				/>
			)}

			{/* Label */}
			{!isSmall && (
				<text
					dominantBaseline="middle"
					fill="rgba(255, 255, 255, 0.95)"
					fontFamily="ui-monospace, SFMono-Regular, monospace"
					fontSize={isDirectory ? 10 : 11}
					fontWeight={isDirectory ? 600 : 400}
					style={{ pointerEvents: "none" }}
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
					fill="rgba(255, 255, 255, 0.6)"
					fontFamily="ui-monospace, SFMono-Regular, monospace"
					fontSize={8}
					fontWeight={500}
					letterSpacing="0.05em"
					style={{ pointerEvents: "none" }}
					textAnchor="middle"
					x={x + width / 2}
					y={y + height / 2 + 10}
				>
					{extension.toUpperCase()}
				</text>
			)}
		</g>
	);
}

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
		<div className="min-w-[200px] rounded-lg border border-border/50 bg-card/95 px-0 shadow-2xl backdrop-blur-md">
			{/* Header */}
			<div className="border-border/50 border-b px-3 py-2">
				<div className="flex items-center gap-2">
					{data.isDirectory ? (
						<FolderTree className="h-3.5 w-3.5 text-sky-400" />
					) : (
						<FileCode className="h-3.5 w-3.5 text-muted-foreground" />
					)}
					<span className="truncate font-medium font-mono text-foreground text-sm">
						{data.name}
					</span>
				</div>
				<p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
					{data.path}
				</p>
			</div>

			{/* Stats */}
			<div className="space-y-1.5 px-3 py-2">
				<div className="flex items-center justify-between">
					<span className="text-muted-foreground text-xs">Size</span>
					<span className="font-medium font-mono text-foreground text-xs">
						{data.size.toLocaleString()} LOC
					</span>
				</div>

				{data.extension && !data.isDirectory && (
					<div className="flex items-center justify-between">
						<span className="text-muted-foreground text-xs">Type</span>
						<span
							className="rounded px-1.5 py-0.5 font-mono text-[10px] uppercase"
							style={{
								backgroundColor: `${getLanguageColor(data.extension)}20`,
								color: getLanguageColor(data.extension),
							}}
						>
							{data.extension}
						</span>
					</div>
				)}

				{data.hotspotScore !== undefined && !data.isDirectory && (
					<div className="flex items-center justify-between">
						<span className="flex items-center gap-1.5 text-muted-foreground text-xs">
							<AlertTriangle
								className={cn(
									"h-3 w-3",
									hotspotLevel === "critical" && "text-rose-400",
									hotspotLevel === "warning" && "text-amber-400",
									hotspotLevel === "normal" && "text-emerald-400",
								)}
							/>
							Hotspot
						</span>
						<span
							className={cn(
								"font-mono font-semibold text-xs",
								hotspotLevel === "critical" && "text-rose-400",
								hotspotLevel === "warning" && "text-amber-400",
								hotspotLevel === "normal" && "text-emerald-400",
							)}
						>
							{data.hotspotScore.toFixed(3)}
						</span>
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

	const fileCount = useMemo(() => countFiles(fileTree), [fileTree]);

	const treemapData = useMemo(() => {
		return convertToTreemapData(fileTree, "", 0, hotspotData, colorMode);
	}, [fileTree, hotspotData, colorMode]);

	if (fileTree.length === 0) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
				<FolderTree className="h-12 w-12 opacity-20" />
				<p className="font-mono text-sm">No files to visualize</p>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="shrink-0 border-border/50 border-b bg-muted/20 px-4 py-2.5">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<FolderTree className="h-4 w-4 text-sky-400" />
						<span className="font-mono font-semibold text-foreground text-sm">
							File Structure
						</span>
						<span className="font-mono text-muted-foreground text-xs">
							({fileCount} files)
						</span>
					</div>

					{/* Mode toggle */}
					<div className="flex items-center gap-0.5 rounded-lg bg-muted/50 p-0.5">
						<button
							className={cn(
								"flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-xs transition-all duration-150",
								colorMode === "language"
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground",
							)}
							onClick={() => setColorMode("language")}
							type="button"
						>
							<span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
							Language
						</button>
						<button
							className={cn(
								"flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-xs transition-all duration-150",
								colorMode === "hotspot"
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground",
							)}
							onClick={() => setColorMode("hotspot")}
							type="button"
						>
							<span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
							Hotspot
						</button>
					</div>
				</div>
			</div>

			{/* Treemap */}
			<div className="relative flex-1 p-3">
				<ResponsiveContainer height="100%" width="100%">
					{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
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
								onFileClick(node.path);
							}
						}}
						stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}
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
			<div className="shrink-0 border-border/50 border-t bg-muted/20 px-4 py-2">
				<div className="flex items-center justify-between">
					<span className="font-mono text-[10px] text-muted-foreground">
						Click a file to inspect
					</span>
					<div className="flex items-center gap-4">
						{colorMode === "hotspot" ? (
							<>
								<span className="flex items-center gap-1.5">
									<span className="h-2.5 w-2.5 rounded-sm bg-rose-500 ring-1 ring-rose-500/20" />
									<span className="font-mono text-[10px] text-muted-foreground">
										Critical
									</span>
								</span>
								<span className="flex items-center gap-1.5">
									<span className="h-2.5 w-2.5 rounded-sm bg-amber-500 ring-1 ring-amber-500/20" />
									<span className="font-mono text-[10px] text-muted-foreground">
										Warning
									</span>
								</span>
								<span className="flex items-center gap-1.5">
									<span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 ring-1 ring-emerald-500/20" />
									<span className="font-mono text-[10px] text-muted-foreground">
										Normal
									</span>
								</span>
							</>
						) : (
							<>
								<span className="flex items-center gap-1.5">
									<span className="h-2.5 w-2.5 rounded-sm bg-[#3b82f6] ring-1 ring-blue-500/20" />
									<span className="font-mono text-[10px] text-muted-foreground">
										TS/TSX
									</span>
								</span>
								<span className="flex items-center gap-1.5">
									<span className="h-2.5 w-2.5 rounded-sm bg-[#eab308] ring-1 ring-yellow-500/20" />
									<span className="font-mono text-[10px] text-muted-foreground">
										JS/JSX
									</span>
								</span>
								<span className="flex items-center gap-1.5">
									<span className="h-2.5 w-2.5 rounded-sm bg-[#22c55e] ring-1 ring-green-500/20" />
									<span className="font-mono text-[10px] text-muted-foreground">
										Python
									</span>
								</span>
								<span className="flex items-center gap-1.5">
									<span className="h-2.5 w-2.5 rounded-sm bg-[#64748b] ring-1 ring-slate-500/20" />
									<span className="font-mono text-[10px] text-muted-foreground">
										Other
									</span>
								</span>
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
