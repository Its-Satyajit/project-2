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

const LANGUAGE_COLORS: Record<string, { light: string; dark: string }> = {
	ts: { light: "#3178c6", dark: "#60a5fa" },
	tsx: { light: "#235a97", dark: "#93c5fd" },
	js: { light: "#b45309", dark: "#facc15" },
	jsx: { light: "#92400e", dark: "#fbbf24" },
	py: { light: "#15803d", dark: "#4ade80" },
	go: { light: "#0891b2", dark: "#22d3ee" },
	rs: { light: "#b91c1c", dark: "#f87171" },
	java: { light: "#c2410c", dark: "#fb923c" },
	cpp: { light: "#4338ca", dark: "#818cf8" },
	c: { light: "#475569", dark: "#94a3b8" },
	rb: { light: "#be185d", dark: "#fb7185" },
	php: { light: "#7e22ce", dark: "#c084fc" },
	swift: { light: "#db2777", dark: "#f472b6" },
	kt: { light: "#6b21a8", dark: "#a855f7" },
	vue: { light: "#0f766e", dark: "#34d399" },
	svelte: { light: "#ea580c", dark: "#fb923c" },
	css: { light: "#be185d", dark: "#f472b6" },
	scss: { light: "#9d174d", dark: "#ec4899" },
	html: { light: "#c2410c", dark: "#fb923c" },
	json: { light: "#475569", dark: "#94a3b8" },
	yaml: { light: "#e11d48", dark: "#fda4af" },
	yml: { light: "#e11d48", dark: "#fda4af" },
	md: { light: "#1d4ed8", dark: "#60a5fa" },
	sql: { light: "#78350f", dark: "#fcd34d" },
	env: { light: "#166534", dark: "#4ade80" },
	lock: { light: "#334155", dark: "#64748b" },
	config: { light: "#3730a3", dark: "#818cf8" },
	toml: { light: "#9a3412", dark: "#fb923c" },
	sh: { light: "#166534", dark: "#4ade80" },
	bash: { light: "#166534", dark: "#4ade80" },
	dockerfile: { light: "#0e7490", dark: "#22d3ee" },
};

const HOTSPOT_COLORS = {
	critical: { light: "#dc2626", dark: "#f87171" },
	warning: { light: "#d97706", dark: "#fbbf24" },
	normal: { light: "#16a34a", dark: "#4ade80" },
	muted: { light: "#64748b", dark: "#94a3b8" },
};

function getLanguageColor(ext: string, isDark: boolean): string {
	const colors = LANGUAGE_COLORS[ext.toLowerCase()];
	if (!colors) return isDark ? "#64748b" : "#94a3b8";
	return isDark ? colors.dark : colors.light;
}

function getHotspotColor(score: number, isDark: boolean): string {
	if (score >= 0.7)
		return isDark ? HOTSPOT_COLORS.critical.dark : HOTSPOT_COLORS.critical.light;
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

function getFolderColor(depth: number, isDark: boolean): string {
	const darkColors = [
		"rgba(56, 189, 248, 0.35)",
		"rgba(56, 189, 248, 0.28)",
		"rgba(56, 189, 248, 0.22)",
		"rgba(56, 189, 248, 0.16)",
		"rgba(56, 189, 248, 0.12)",
	];
	const lightColors = [
		"rgba(2, 132, 199, 0.15)",
		"rgba(2, 132, 199, 0.12)",
		"rgba(2, 132, 199, 0.10)",
		"rgba(2, 132, 199, 0.08)",
		"rgba(2, 132, 199, 0.06)",
	];

	const colors = isDark ? darkColors : lightColors;
	return colors[Math.min(depth, colors.length - 1)] as string;
}

function getContrastColor(hexColor: string): string {
	if (!hexColor || hexColor.startsWith("rgba")) return "white";
	try {
		const r = parseInt(hexColor.slice(1, 3), 16);
		const g = parseInt(hexColor.slice(3, 5), 16);
		const b = parseInt(hexColor.slice(5, 7), 16);
		const yiq = (r * 299 + g * 587 + b * 114) / 1000;
		return yiq >= 145 ? "#111827" : "#ffffff";
	} catch (e) {
		return "white";
	}
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
	isDark: boolean,
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
				isDark,
				hotspotData,
				colorMode,
			);
			const totalSize = children.reduce((sum, child) => sum + child.size, 0);
			return {
				name: item.name,
				size: Math.max(totalSize, 1),
				path: currentPath,
				children,
				fill: getFolderColor(depth, isDark),
				isDirectory: true,
			};
		}

		const ext = item.name.split(".").pop()?.toLowerCase() || "";
		const hotspotInfo = hotspotData?.get(currentPath);
		const size = hotspotInfo?.loc || 1;

		let fill: string;
		if (colorMode === "hotspot" && hotspotInfo?.score) {
			fill = getHotspotColor(hotspotInfo.score, isDark);
		} else {
			fill = getLanguageColor(ext, isDark);
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
	isDark?: boolean;
}

function CustomContent(props: CustomContentProps) {
	const {
		x = 0,
		y = 0,
		width = 0,
		height = 0,
		name,
		extension,
		fill = "#475569",
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
			? `${displayName.slice(0, Math.max(0, maxChars - 2))}..`
			: displayName;

	const contrastColor = getContrastColor(fill);
	const secondaryColor =
		contrastColor === "white"
			? "rgba(255, 255, 255, 0.6)"
			: "rgba(0, 0, 0, 0.5)";

	const hotspotBorder =
		hotspotScore && hotspotScore >= 0.7
			? "rgba(239, 68, 68, 0.9)"
			: hotspotScore && hotspotScore >= 0.4
				? "rgba(245, 158, 11, 0.8)"
				: "rgba(0,0,0,0.15)";

	return (
		<g>
			{/* Main rectangle with premium border */}
			<rect
				fill={fill}
				height={height}
				rx={6}
				ry={6}
				stroke={hotspotBorder}
				strokeWidth={hotspotScore && hotspotScore >= 0.4 ? 2.5 : 1}
				style={{
					cursor: isDirectory ? "default" : "pointer",
				}}
				width={width}
				x={x}
				y={y}
			/>

			{/* Subtle linear gradient overlay for 3D effect */}
			<rect
				fill="url(#nodeGradient)"
				height={height}
				pointerEvents="none"
				rx={6}
				ry={6}
				width={width}
				x={x}
				y={y}
			/>

			{/* Glossy top highlight */}
			{!isVerySmall && height > 15 && (
				<rect
					fill="rgba(255,255,255,0.08)"
					height={2}
					pointerEvents="none"
					rx={1}
					width={Math.max(0, width - 12)}
					x={x + 6}
					y={y + 3}
				/>
			)}

			{/* Folder icon for directories */}
			{isDirectory && !isSmall && width > 40 && (
				<text
					dominantBaseline="middle"
					fill={contrastColor}
					fontSize={14}
					opacity={0.35}
					style={{ pointerEvents: "none" }}
					textAnchor="middle"
					x={x + width / 2}
					y={y + height / 2 - (showExt ? 6 : 0)}
				>
					📁
				</text>
			)}

			{/* Label */}
			{!isSmall && !isDirectory && (
				<text
					dominantBaseline="middle"
					fill={contrastColor}
					fontFamily="var(--font-mono-display), ui-monospace, monospace"
					fontSize={height > 45 ? 11 : 10}
					fontWeight={600}
					style={{
						pointerEvents: "none",
						textShadow:
							contrastColor === "white"
								? "0 1px 2px rgba(0,0,0,0.3)"
								: "none",
					}}
					textAnchor="middle"
					x={x + width / 2}
					y={y + height / 2 - (showExt ? 6 : 0)}
				>
					{truncatedName}
				</text>
			)}

			{/* Extension badge */}
			{showExt && extension && (
				<text
					dominantBaseline="middle"
					fill={secondaryColor}
					fontFamily="var(--font-data), ui-monospace, monospace"
					fontSize={9}
					fontWeight={700}
					letterSpacing="0.05em"
					style={{ pointerEvents: "none" }}
					textAnchor="middle"
					x={x + width / 2}
					y={y + height / 2 + 10}
				>
					{extension.toUpperCase()}
				</text>
			)}

			{/* Indicator for small blocks */}
			{isVerySmall && !isDirectory && width > 12 && height > 8 && (
				<rect
					fill={contrastColor}
					height={2}
					opacity={0.3}
					pointerEvents="none"
					rx={1}
					width={Math.min(width - 8, 4)}
					x={x + 4}
					y={y + 4}
				/>
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
	isDark,
}: {
	active?: boolean;
	payload?: TooltipPayloadItem[];
	isDark: boolean;
}) {
	if (!active || !payload || !payload[0]) return null;

	const data = payload[0].payload;
	const hotspotLevel = data.hotspotScore
		? getHotspotLevel(data.hotspotScore)
		: null;

	return (
		<div
			className={cn(
				"min-w-[240px] rounded-xl border px-0 shadow-2xl backdrop-blur-xl transition-all duration-200",
				isDark
					? "border-white/10 bg-gray-900/95"
					: "border-gray-200 bg-white/95 text-gray-900",
			)}
		>
			{/* Header */}
			<div
				className={cn(
					"border-b px-4 py-3",
					isDark ? "border-white/10" : "border-gray-100",
				)}
			>
				<div className="flex items-center gap-3">
					<div
						className={cn(
							"flex h-8 w-8 items-center justify-center rounded-lg",
							data.isDirectory
								? isDark
									? "bg-sky-500/20"
									: "bg-sky-100"
								: isDark
									? "bg-white/10"
									: "bg-gray-100",
						)}
					>
						{data.isDirectory ? (
							<FolderTree
								className={cn("h-4.5 w-4.5", isDark ? "text-sky-400" : "text-sky-600")}
							/>
						) : (
							<FileCode
								className={cn(
									"h-4.5 w-4.5",
									isDark ? "text-white/70" : "text-gray-600",
								)}
							/>
						)}
					</div>
					<div className="min-w-0 flex-1">
						<p
							className={cn(
								"truncate font-bold text-sm",
								isDark ? "text-white" : "text-gray-900",
							)}
						>
							{data.name}
						</p>
						<p
							className={cn(
								"mt-0.5 truncate font-mono text-[10px] uppercase tracking-wider",
								isDark ? "text-white/40" : "text-gray-500",
							)}
						>
							{data.path}
						</p>
					</div>
				</div>
			</div>

			{/* Stats */}
			<div
				className={cn(
					"grid grid-cols-2 gap-px p-3",
					isDark ? "bg-white/5" : "bg-gray-100",
				)}
			>
				<div
					className={cn(
						"rounded-lg px-3 py-2.5",
						isDark ? "bg-gray-900/80" : "bg-white",
					)}
				>
					<div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase tracking-wider">
						<Hash className="h-3 w-3" />
						<span>LOC</span>
					</div>
					<p
						className={cn(
							"mt-1 font-mono font-bold text-sm",
							isDark ? "text-white" : "text-gray-900",
						)}
					>
						{data.size.toLocaleString()}
					</p>
				</div>

				{data.extension && !data.isDirectory && (
					<div
						className={cn(
							"rounded-lg px-3 py-2.5",
							isDark ? "bg-gray-900/80" : "bg-white",
						)}
					>
						<div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase tracking-wider">
							<Layers className="h-3 w-3" />
							<span>Type</span>
						</div>
						<div className="mt-1">
							<span
								className="inline-block rounded-md px-2 py-0.5 font-mono font-bold text-[10px] uppercase"
								style={{
									backgroundColor: `${getLanguageColor(data.extension, isDark)}20`,
									color: getLanguageColor(data.extension, isDark),
									border: `1px solid ${getLanguageColor(data.extension, isDark)}40`,
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
							"col-span-2 mt-2 rounded-lg px-3 py-3",
							hotspotLevel === "critical" &&
								(isDark ? "bg-red-500/10" : "bg-red-50"),
							hotspotLevel === "warning" &&
								(isDark ? "bg-amber-500/10" : "bg-amber-50"),
							hotspotLevel === "normal" &&
								(isDark ? "bg-emerald-500/10" : "bg-emerald-50"),
						)}
					>
						<div className="flex items-center justify-between">
							<span
								className={cn(
									"flex items-center gap-1.5 font-semibold text-[10px] uppercase tracking-wider",
									isDark ? "text-white/60" : "text-gray-600",
								)}
							>
								<AlertTriangle
									className={cn(
										"h-3.5 w-3.5",
										hotspotLevel === "critical" && "text-red-500",
										hotspotLevel === "warning" && "text-amber-500",
										hotspotLevel === "normal" && "text-emerald-500",
									)}
								/>
								Hotspot Risk
							</span>
							<span
								className={cn(
									"font-bold font-mono text-sm",
									hotspotLevel === "critical" && "text-red-500",
									hotspotLevel === "warning" && "text-amber-500",
									hotspotLevel === "normal" && "text-emerald-500",
								)}
							>
								{(data.hotspotScore * 10).toFixed(2)}/10
							</span>
						</div>
						<div
							className={cn(
								"mt-2 h-1.5 overflow-hidden rounded-full",
								isDark ? "bg-white/10" : "bg-gray-200",
							)}
						>
							<div
								className={cn(
									"h-full rounded-full transition-all duration-500",
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

	const fileCount = useMemo(() => countFiles(fileTree), [fileTree]);
	const dirCount = useMemo(() => countDirs(fileTree), [fileTree]);
	const totalLoc = useMemo(
		() => getTotalLoc(fileTree, hotspotData),
		[fileTree, hotspotData],
	);

	const treemapData = useMemo(() => {
		return convertToTreemapData(fileTree, "", 0, isDark, hotspotData, colorMode);
	}, [fileTree, isDark, hotspotData, colorMode]);

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
			{/* SVG Support Definitions */}
			<svg aria-hidden="true" className="absolute h-0 w-0">
				<defs>
					<linearGradient id="nodeGradient" x1="0" x2="1" y1="0" y2="1">
						<stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
						<stop offset="100%" stopColor="rgba(0,0,0,0.05)" />
					</linearGradient>
					<filter id="innerGlow" x="-20%" y="-20%" width="140%" height="140%">
						<feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
						<feOffset dx="0" dy="0" />
						<feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" />
						<feColorMatrix type="matrix" values="0 0 0 0 1   0 0 0 0 1   0 0 0 0 1  0 0 0 0.1 0" />
					</filter>
				</defs>
			</svg>

			{/* Header */}
			<div
				className={cn(
					"shrink-0 border-b px-5 py-3",
					isDark
						? "border-white/5 bg-gray-900/40"
						: "border-gray-100 bg-gray-50/80",
				)}
			>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div
							className={cn(
								"flex h-9 w-9 items-center justify-center rounded-xl shadow-sm",
								isDark ? "bg-sky-500/15" : "bg-sky-500/10",
							)}
						>
							<FolderTree className="h-4.5 w-4.5 text-sky-500" />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<span className="font-bold text-foreground text-sm tracking-tight">
									File Structure
								</span>
							</div>
							<div className="mt-0.5 flex items-center gap-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wider opacity-70">
								<span>{fileCount} Files</span>
								<span className="h-1 w-1 rounded-full bg-border" />
								<span>{dirCount} Folders</span>
								{totalLoc > 0 && (
									<>
										<span className="h-1 w-1 rounded-full bg-border" />
										<span>{totalLoc.toLocaleString()} LOC</span>
									</>
								)}
							</div>
						</div>
					</div>

					{/* Mode toggle */}
					<div
						className={cn(
							"flex items-center gap-1 rounded-xl p-1",
							isDark ? "bg-white/5" : "bg-gray-200/50",
						)}
					>
						<button
							className={cn(
								"flex items-center gap-2 rounded-lg px-4 py-2 font-bold text-[11px] uppercase tracking-widest transition-all duration-200",
								colorMode === "language"
									? isDark
										? "bg-white/10 text-white shadow-lg shadow-black/20"
										: "bg-white text-gray-900 shadow-md"
									: "text-muted-foreground hover:text-foreground",
							)}
							onClick={() => setColorMode("language")}
							type="button"
						>
							<span className="h-2 w-2 rounded-full bg-blue-500 shadow-blue-500/40 shadow-sm" />
							Language
						</button>
						<button
							className={cn(
								"flex items-center gap-2 rounded-lg px-4 py-2 font-bold text-[11px] uppercase tracking-widest transition-all duration-200",
								colorMode === "hotspot"
									? isDark
										? "bg-white/10 text-white shadow-lg shadow-black/20"
										: "bg-white text-gray-900 shadow-md"
									: "text-muted-foreground hover:text-foreground",
							)}
							onClick={() => setColorMode("hotspot")}
							type="button"
						>
							<span className="h-2 w-2 rounded-full bg-amber-500 shadow-amber-500/40 shadow-sm" />
							Hotspot
						</button>
					</div>
				</div>
			</div>

			{/* Treemap */}
			<div className="relative flex-1 bg-mesh/5 p-4">
				<ResponsiveContainer height="100%" width="100%">
					<Treemap
						aspectRatio={1.5}
						content={<CustomContent isDark={isDark} />}
						data={treemapData as any}
						dataKey="size"
						isAnimationActive={false}
						onClick={(node: any) => {
							if (node?.path && !node.isDirectory && onFileClick) {
								onFileClick(node.path);
							}
						}}
						stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)"}
					>
						<Tooltip
							content={<CustomTooltip isDark={isDark} />}
							cursor={false}
							wrapperStyle={{ zIndex: 100 }}
						/>
					</Treemap>
				</ResponsiveContainer>
			</div>

			{/* Footer Legend */}
			<div
				className={cn(
					"shrink-0 border-t px-6 py-3.5",
					isDark
						? "border-white/5 bg-gray-900/60"
						: "border-gray-100 bg-gray-50/50",
				)}
			>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 text-muted-foreground text-[11px] font-medium uppercase tracking-wider opacity-60">
						<Hash className="h-3.5 w-3.5" />
						<span>Interactive Map — Select file to view source</span>
					</div>
					<div className="flex items-center gap-6">
						{colorMode === "hotspot" ? (
							<>
								<div className="flex items-center gap-2">
									<span
										className="h-3 w-3 rounded-full shadow-sm"
										style={{
											backgroundColor: isDark
												? HOTSPOT_COLORS.critical.dark
												: HOTSPOT_COLORS.critical.light,
										}}
									/>
									<span className="font-bold text-muted-foreground text-[10px] uppercase tracking-widest">
										Critical
									</span>
								</div>
								<div className="flex items-center gap-2">
									<span
										className="h-3 w-3 rounded-full shadow-sm"
										style={{
											backgroundColor: isDark
												? HOTSPOT_COLORS.warning.dark
												: HOTSPOT_COLORS.warning.light,
										}}
									/>
									<span className="font-bold text-muted-foreground text-[10px] uppercase tracking-widest">
										Warning
									</span>
								</div>
								<div className="flex items-center gap-2">
									<span
										className="h-3 w-3 rounded-full shadow-sm"
										style={{
											backgroundColor: isDark
												? HOTSPOT_COLORS.normal.dark
												: HOTSPOT_COLORS.normal.light,
										}}
									/>
									<span className="font-bold text-muted-foreground text-[10px] uppercase tracking-widest">
										Normal
									</span>
								</div>
							</>
						) : (
							<>
								<div className="flex items-center gap-2">
									<span
										className="h-3 w-3 rounded-full shadow-sm"
										style={{ backgroundColor: getLanguageColor("ts", isDark) }}
									/>
									<span className="font-bold text-muted-foreground text-[10px] uppercase tracking-widest">
										TS/TSX
									</span>
								</div>
								<div className="flex items-center gap-2">
									<span
										className="h-3 w-3 rounded-full shadow-sm"
										style={{ backgroundColor: getLanguageColor("js", isDark) }}
									/>
									<span className="font-bold text-muted-foreground text-[10px] uppercase tracking-widest">
										JS/JSX
									</span>
								</div>
								<div className="flex items-center gap-2">
									<span
										className="h-3 w-3 rounded-full shadow-sm"
										style={{ backgroundColor: getLanguageColor("py", isDark) }}
									/>
									<span className="font-bold text-muted-foreground text-[10px] uppercase tracking-widest">
										Python
									</span>
								</div>
								<div className="flex items-center gap-2 opacity-50">
									<span className="h-3 w-3 rounded-full bg-sky-500" />
									<span className="font-bold text-muted-foreground text-[10px] uppercase tracking-widest">
										Folders
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
