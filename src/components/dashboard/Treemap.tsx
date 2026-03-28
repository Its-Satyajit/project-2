"use client";

import { useQuery } from "@tanstack/react-query";
import * as d3 from "d3";
import { motion } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import { useTheme } from "~/components/ThemeProvider";
import { api } from "~/lib/eden";

interface TreemapFile {
	id: string;
	path: string;
	loc: number;
	extension: string;
	hotspotScore: number;
	fanIn: number;
	fanOut: number;
	isExternal: boolean;
	_color?: string;
}

interface TreemapData {
	files: TreemapFile[];
	totalFiles: number;
	totalLoc: number;
}

interface TreemapProps {
	repoId: string;
	colorBy?: "language" | "hotspot" | "fanIn" | "fanOut";
	colorMode?: "language" | "hotspot" | "fanIn" | "fanOut";
	sizeBy?: "loc" | "fanIn" | "fanOut";
	maxFiles?: number;
	onFileClick?: (file: TreemapFile) => void;
}

interface TreemapNode extends d3.HierarchyRectangularNode<TreemapFile> {
	data: TreemapFile;
}

// Architectural palette - warm, muted, intentional
const LANGUAGE_COLORS: Record<string, string> = {
	ts: "#1a1d2e",
	tsx: "#2a2d3e",
	js: "#3d5a99",
	jsx: "#3d5a99",
	py: "#c4953a",
	go: "#5a7d5a",
	rs: "#1a1d2e",
	java: "#6b6d7a",
	cpp: "#7a7c88",
	c: "#7a7c88",
	rb: "#c4953a",
	php: "#8b5a2b",
	swift: "#c4953a",
	kt: "#1a1d2e",
	vue: "#5a7d5a",
	svelte: "#c4953a",
	css: "#5a7ec2",
	scss: "#5a7ec2",
	html: "#3d5a99",
	json: "#6b6d7a",
	yaml: "#6b6d7a",
	yml: "#6b6d7a",
	md: "#1a1d2e",
	sql: "#3d5a99",
	prisma: "#1a1d2e",
};

function getLanguageColor(ext: string): string {
	return LANGUAGE_COLORS[ext.toLowerCase()] || "#6b6d7a";
}

function getScoreColor(score: number, maxScore: number): string {
	if (score === 0) return "#6b6d7a";
	const normalized = score / maxScore;

	if (normalized > 0.7) return "#d64534"; // Vermillion
	if (normalized > 0.4) return "#c4953a"; // Ochre
	if (normalized > 0.2) return "#1a1d2e"; // Navy
	return "#6b6d7a"; // Muted
}

function getFanColor(value: number, maxValue: number): string {
	if (value === 0) return "#6b6d7a";
	const normalized = Math.min(value / maxValue, 1);

	// Interpolate between muted and foreground
	const r = Math.round(107 + (26 - 107) * normalized);
	const g = Math.round(109 + (29 - 109) * normalized);
	const b = Math.round(122 + (46 - 122) * normalized);
	return `rgb(${r}, ${g}, ${b})`;
}

export function Treemap({
	repoId,
	colorBy: colorByProp,
	colorMode,
	sizeBy: sizeByProp,
	maxFiles = 500,
	onFileClick,
}: TreemapProps) {
	const effectiveColorBy = colorByProp || colorMode || "language";
	const effectiveSizeBy = sizeByProp || "loc";
	const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
	const [hoveredFile, setHoveredFile] = useState<TreemapFile | null>(null);
	const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
	const { resolvedTheme } = useTheme();
	const isDark = resolvedTheme === "dark";

	const { data, isLoading, error } = useQuery<TreemapData>({
		queryKey: ["treemap", repoId, maxFiles],
		queryFn: async () => {
			const res = await api.dashboard({ repoId: repoId || "" }).treemap.get();
			if (res.error) throw new Error(String(res.error));
			return res.data as TreemapData;
		},
		enabled: !!repoId,
	});

	const containerRef = useCallback((node: HTMLDivElement | null) => {
		if (node) {
			const observer = new ResizeObserver((entries) => {
				for (const entry of entries) {
					setDimensions({
						width: entry.contentRect.width,
						height: entry.contentRect.height,
					});
				}
			});
			observer.observe(node);
			return () => observer.disconnect();
		}
	}, []);

	const processedData = useMemo(() => {
		if (!data?.files) return null;

		const maxLoc = Math.max(...data.files.map((f) => f.loc || 1));
		const maxFanIn = Math.max(...data.files.map((f) => f.fanIn || 0));
		const maxFanOut = Math.max(...data.files.map((f) => f.fanOut || 0));
		const maxScore = Math.max(...data.files.map((f) => f.hotspotScore || 0));

		const files = data.files
			.filter((f) => f.loc > 0)
			.sort(
				(a, b) =>
					((b[effectiveSizeBy as keyof TreemapFile] as number) || 0) -
					((a[effectiveSizeBy as keyof TreemapFile] as number) || 0),
			)
			.slice(0, maxFiles)
			.map((f) => ({
				...f,
				_color:
					effectiveColorBy === "language"
						? getLanguageColor(f.extension || "")
						: effectiveColorBy === "hotspot"
							? getScoreColor(f.hotspotScore, maxScore)
							: effectiveColorBy === "fanIn"
								? getFanColor(f.fanIn, maxFanIn)
								: getFanColor(f.fanOut, maxFanOut),
			}));

		return { files, maxLoc, maxFanIn, maxFanOut, maxScore };
	}, [data, effectiveColorBy, effectiveSizeBy, maxFiles]);

	const treemapLayout = useMemo(() => {
		if (!processedData || dimensions.width === 0 || dimensions.height === 0)
			return null;

		const { files } = processedData;

		const root = d3
			.hierarchy<TreemapFile & { _color?: string }>({
				name: "root",
				children: files,
			} as TreemapFile & { name: string; children?: TreemapFile[] })
			.sum((d) => d.loc || 0)
			.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

		const treemap = d3
			.treemap<TreemapFile & { _color?: string }>()
			.size([dimensions.width, dimensions.height])
			.paddingOuter(2)
			.paddingTop(16)
			.paddingInner(1)
			.round(true);

		return treemap(root);
	}, [processedData, dimensions]);

	const nodes = useMemo(() => {
		if (!treemapLayout) return [];
		return treemapLayout
			.descendants()
			.filter((d) => d.depth === 1) as TreemapNode[];
	}, [treemapLayout]);

	const handleMouseMove = (e: React.MouseEvent, file: TreemapFile) => {
		setHoveredFile(file);
		setTooltipPos({ x: e.clientX, y: e.clientY });
	};

	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="flex flex-col items-center gap-3">
					<div className="h-6 w-6 animate-spin border-2 border-border border-t-foreground" />
					<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
						Loading
					</span>
				</div>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="flex flex-col items-center gap-2">
					<div className="font-mono text-destructive text-xs">
						Failed to load
					</div>
					<button
						className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider hover:text-foreground"
						onClick={() => window.location.reload()}
						type="button"
					>
						Retry
					</button>
				</div>
			</div>
		);
	}

	if (data.totalFiles === 0) {
		return (
			<div className="flex h-full items-center justify-center">
				<span className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
					No files
				</span>
			</div>
		);
	}

	return (
		<div
			className="relative h-full w-full overflow-hidden border border-border"
			ref={containerRef}
		>
			<svg
				aria-label="File treemap visualization"
				className="block"
				height={dimensions.height}
				width={dimensions.width}
			>
				{nodes.map((node, i) => {
					const width = node.x1 - node.x0;
					const height = node.y1 - node.y0;
					const file = node.data;
					const showLabel = width > 40 && height > 18;
					const showPath = width > 80 && height > 30;

					return (
						<motion.g
							animate={{ opacity: 1 }}
							initial={{ opacity: 0 }}
							key={file.id || file.path}
							onClick={() => onFileClick?.(file)}
							onKeyDown={(e) => e.key === "Enter" && onFileClick?.(file)}
							onMouseEnter={(e) => handleMouseMove(e, file)}
							onMouseLeave={() => setHoveredFile(null)}
							role="button"
							tabIndex={0}
							transition={{ delay: i * 0.001, duration: 0.15 }}
						>
							<rect
								className="cursor-pointer transition-opacity hover:opacity-100"
								fill={file._color || "#6b6d7a"}
								height={Math.max(0, height)}
								rx={0}
								ry={0}
								stroke="var(--color-border)"
								strokeWidth={0.5}
								style={{ opacity: hoveredFile?.path === file.path ? 1 : 0.8 }}
								width={Math.max(0, width)}
								x={node.x0}
								y={node.y0}
							/>
							{showLabel && (
								<text
									fill={isDark ? "#e8e4dc" : "#1a1d2e"}
									fontFamily="IBM Plex Mono, monospace"
									fontSize={9}
									fontWeight={500}
									style={{ pointerEvents: "none" }}
									x={node.x0 + 4}
									y={node.y0 + 12}
								>
									{(() => {
										const name = file.path.split("/").pop() || file.path;
										const maxChars = Math.floor(width / 6);
										return name.length > maxChars
											? name.slice(0, maxChars - 1) + "…"
											: name;
									})()}
								</text>
							)}
							{showPath && (
								<text
									fill={isDark ? "#7a7c88" : "#6b6d7a"}
									fontFamily="IBM Plex Mono, monospace"
									fontSize={8}
									style={{ pointerEvents: "none" }}
									x={node.x0 + 4}
									y={node.y0 + 22}
								>
									{(() => {
										const parts = file.path.split("/");
										if (parts.length <= 2) return "";
										const path = parts.slice(0, -1).join("/");
										const maxChars = Math.floor(width / 5);
										return path.length > maxChars
											? "…" + path.slice(-maxChars + 1)
											: path;
									})()}
								</text>
							)}
						</motion.g>
					);
				})}
			</svg>

			{hoveredFile && (
				<div
					className="pointer-events-none fixed z-50 border border-border bg-background px-3 py-2"
					style={{
						left: tooltipPos.x + 12,
						top: tooltipPos.y + 12,
						maxWidth: 250,
					}}
				>
					<div className="mb-1.5 truncate font-mono text-foreground text-xs">
						{hoveredFile.path}
					</div>
					<div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[10px]">
						<div className="text-muted-foreground">Lines</div>
						<div className="text-foreground tabular-nums">
							{(hoveredFile.loc || 0).toLocaleString()}
						</div>
						<div className="text-muted-foreground">Hotspot</div>
						<div className="text-foreground tabular-nums">
							{(hoveredFile.hotspotScore || 0).toFixed(3)}
						</div>
						<div className="text-muted-foreground">Fan-in</div>
						<div className="text-foreground tabular-nums">
							{hoveredFile.fanIn || 0}
						</div>
						<div className="text-muted-foreground">Fan-out</div>
						<div className="text-foreground tabular-nums">
							{hoveredFile.fanOut || 0}
						</div>
						<div className="text-muted-foreground">Type</div>
						<div className="text-foreground uppercase">
							{hoveredFile.extension}
						</div>
					</div>
				</div>
			)}

			<div className="absolute right-2 bottom-2 flex gap-2 border border-border bg-background px-2 py-1 font-mono text-[9px]">
				<span className="text-muted-foreground">
					{processedData?.files.length || 0} files
				</span>
				<span className="text-border">·</span>
				<span className="text-muted-foreground">
					{(data.totalLoc || 0).toLocaleString()} LOC
				</span>
			</div>
		</div>
	);
}
