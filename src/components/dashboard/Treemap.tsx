"use client";

import { useQuery } from "@tanstack/react-query";
import * as d3 from "d3";
import { motion } from "motion/react";
import { useTheme } from "next-themes";
import { useCallback, useMemo, useState } from "react";
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

const LANGUAGE_COLORS: Record<string, string> = {
	ts: "#fafafa", // Neutral 50
	tsx: "#f5f5f5", // Neutral 100
	js: "#e5e5e5", // Neutral 200
	jsx: "#e5e5e5",
	py: "#fbbf24", // Amber 400
	go: "#f59e0b", // Amber 500
	rs: "#fafafa",
	java: "#d4d4d4",
	cpp: "#a3a3a3",
	c: "#a3a3a3",
	rb: "#fbbf24",
	php: "#f59e0b",
	swift: "#fcd34d",
	kt: "#fafafa",
	vue: "#e5e5e5",
	svelte: "#fbbf24",
	css: "#a3a3a3",
	scss: "#d4d4d4",
	html: "#f5f5f5",
	json: "#525252",
	yaml: "#525252",
	yml: "#525252",
	md: "#ffffff",
	sql: "#f5f5f5",
	prisma: "#171717",
};

function getLanguageColor(ext: string): string {
	return LANGUAGE_COLORS[ext.toLowerCase()] || "#94a3b8";
}

function getScoreColor(score: number, maxScore: number): string {
	if (score === 0) return "var(--color-muted-foreground)";
	const normalized = score / maxScore;

	if (normalized > 0.7) return "#dc2626"; // Critical Red
	if (normalized > 0.4) return "#d97706"; // Warning Amber
	if (normalized > 0.2) return "#fafafa"; // Normal Neutral
	return "#737373"; // Muted Slate
}

function getFanColor(value: number, maxValue: number): string {
	if (value === 0) return "var(--color-muted)";
	const normalized = Math.min(value / maxValue, 1);

	// Interpolate between secondary and primary
	return `color-mix(in oklch, var(--color-primary) ${normalized * 100}%, var(--color-secondary))`;
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
			.paddingOuter(3)
			.paddingTop(20)
			.paddingInner(2)
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
					<div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
					<span className="font-mono text-muted-foreground text-xs">
						Loading treemap...
					</span>
				</div>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="flex flex-col items-center gap-2">
					<div className="font-mono text-destructive text-xs">Failed to load</div>
					<button
						className="text-muted-foreground text-xs hover:text-foreground"
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
				<span className="font-mono text-muted-foreground text-sm">
					No files to display
				</span>
			</div>
		);
	}

	return (
		<div
			className="relative h-full w-full overflow-hidden rounded-lg bg-card"
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
					const showLabel = width > 50 && height > 20;
					const showPath = width > 100 && height > 35;

					return (
						<motion.g
							animate={{ opacity: 1, scale: 1 }}
							initial={{ opacity: 0, scale: 0.9 }}
							key={file.id || file.path}
							onClick={() => onFileClick?.(file)}
							onKeyDown={(e) => e.key === "Enter" && onFileClick?.(file)}
							onMouseEnter={(e) => handleMouseMove(e, file)}
							onMouseLeave={() => setHoveredFile(null)}
							role="button"
							tabIndex={0}
							transition={{ delay: i * 0.002, duration: 0.2 }}
						>
							<rect
								className="cursor-pointer transition-opacity hover:opacity-80"
								fill={file._color || "#374151"}
								height={Math.max(0, height)}
								rx={4}
								ry={4}
								stroke={isDark ? "#09090b" : "#ffffff"}
								strokeWidth={1}
								style={{ opacity: hoveredFile?.path === file.path ? 1 : 0.85 }}
								width={Math.max(0, width)}
								x={node.x0}
								y={node.y0}
							/>
							{showLabel && (
								<text
									fill={isDark ? "#ffffff" : "#000000"}
									fontFamily="ui-monospace, SFMono-Regular, monospace"
									fontSize={10}
									fontWeight={500}
									style={{ pointerEvents: "none" }}
									x={node.x0 + 6}
									y={node.y0 + 14}
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
									fill={isDark ? "#a1a1aa" : "#52525b"}
									fontFamily="ui-monospace, SFMono-Regular, monospace"
									fontSize={9}
									style={{ pointerEvents: "none" }}
									x={node.x0 + 6}
									y={node.y0 + 26}
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
					className="pointer-events-none fixed z-50 rounded-lg border border-border bg-card/95 px-4 py-3 shadow-xl backdrop-blur-sm"
					style={{
						left: tooltipPos.x + 15,
						top: tooltipPos.y + 15,
						maxWidth: 320,
					}}
				>
					<div className="mb-2 truncate font-mono font-semibold text-sm">
						{hoveredFile.path}
					</div>
					<div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
						<div className="text-muted-foreground">Lines</div>
						<div className="font-medium font-mono">
							{(hoveredFile.loc || 0).toLocaleString()}
						</div>

						<div className="text-muted-foreground">Hotspot</div>
						<div className="font-medium font-mono">
							{(hoveredFile.hotspotScore || 0).toFixed(3)}
						</div>

						<div className="text-muted-foreground">Fan-in</div>
						<div className="font-medium font-mono">
							{hoveredFile.fanIn || 0}
						</div>

						<div className="text-muted-foreground">Fan-out</div>
						<div className="font-medium font-mono">
							{hoveredFile.fanOut || 0}
						</div>

						<div className="text-muted-foreground">Language</div>
						<div className="font-medium font-mono uppercase">
							{hoveredFile.extension}
						</div>
					</div>
				</div>
			)}

			<div className="absolute right-3 bottom-3 flex gap-3 rounded-md bg-card/80 px-3 py-2 font-mono text-[10px] backdrop-blur-sm">
				<span className="text-muted-foreground">
					{processedData?.files.length || 0} files
				</span>
				<span className="text-muted-foreground">|</span>
				<span className="text-muted-foreground">
					{(data.totalLoc || 0).toLocaleString()} LOC
				</span>
			</div>
		</div>
	);
}
