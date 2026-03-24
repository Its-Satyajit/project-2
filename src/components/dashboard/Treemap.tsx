"use client";

import { useQuery } from "@tanstack/react-query";
import * as d3 from "d3";
import { Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "~/lib/eden";
import { getLanguageColor } from "~/lib/languageColors";

interface TreemapFile {
	id: string;
	path: string;
	loc: number;
	extension: string;
	hotspotScore: number;
	fanIn: number;
	fanOut: number;
	isExternal: boolean;
}

interface TreemapData {
	files: TreemapFile[];
	totalFiles: number;
	totalLoc: number;
}

interface TreemapProps {
	repoId: string;
	colorMode: "language" | "hotspot";
	onFileClick?: (file: TreemapFile) => void;
}

interface TreemapNode extends d3.HierarchyRectangularNode<TreemapFile> {
	data: TreemapFile;
}

export function Treemap({ repoId, colorMode, onFileClick }: TreemapProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
	const { resolvedTheme } = useTheme();
	const isDark = resolvedTheme === "dark";

	const { data, isLoading, error } = useQuery<TreemapData>({
		queryKey: ["treemap", repoId],
		queryFn: async () => {
			const res = await api.dashboard({ repoId: repoId as any }).treemap.get();
			if (res.error) {
				throw new Error(String(res.error));
			}
			return res.data as TreemapData;
		},
		enabled: !!repoId,
	});

	useEffect(() => {
		if (!containerRef.current) return;

		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const { width, height } = entry.contentRect;
				setDimensions({ width, height });
			}
		});

		observer.observe(containerRef.current);
		return () => observer.disconnect();
	}, []);

	const treemapData = useMemo(() => {
		if (!data?.files || data.files.length === 0) return null;

		const files = data.files
			.filter((f) => f.loc > 0)
			.sort((a, b) => b.loc - a.loc)
			.slice(0, 2000);

		const root = d3
			.hierarchy<TreemapFile>({
				name: "root",
				children: files,
			} as TreemapFile & { name: string; children?: TreemapFile[] })
			.sum((d) => d.loc)
			.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

		return root;
	}, [data]);

	useEffect(() => {
		if (!treemapData || dimensions.width === 0 || dimensions.height === 0)
			return;

		const container = d3.select(containerRef.current);
		container.selectAll("svg").remove();
		container.selectAll(".tooltip").remove();

		// Create a tooltip div
		const tooltip = container
			.append("div")
			.attr("class", "tooltip")
			.style("position", "absolute")
			.style("visibility", "hidden")
			.style(
				"background-color",
				isDark ? "rgba(20,20,20,0.95)" : "rgba(255,255,255,0.95)",
			)
			.style("color", isDark ? "#e5e7eb" : "#1f2937")
			.style("padding", "10px 14px")
			.style("border-radius", "8px")
			.style("font-family", "ui-monospace, SFMono-Regular, monospace")
			.style("font-size", "12px")
			.style("border", `1px solid ${isDark ? "#333" : "#e5e7eb"}`)
			.style(
				"box-shadow",
				"0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
			)
			.style("pointer-events", "none")
			.style("z-index", "10")
			.style("backdrop-filter", "blur(8px)");

		const svg = container
			.append("svg")
			.attr("width", dimensions.width)
			.attr("height", dimensions.height)
			.attr("viewBox", [0, 0, dimensions.width, dimensions.height])
			.attr("style", "max-width: 100%; height: auto;");

		const treemap = d3
			.treemap<TreemapFile>()
			.size([dimensions.width, dimensions.height])
			.paddingOuter(4)
			.paddingTop(4)
			.paddingInner(3)
			.round(true);

		const root = treemap(treemapData);

		const nodes = svg
			.selectAll("g")
			.data(root.descendants() as TreemapNode[])
			.join("g")
			.attr("transform", (d) => `translate(${d.x0},${d.y0})`);

		nodes
			.append("rect")
			.attr("width", (d) => Math.max(0, d.x1 - d.x0))
			.attr("height", (d) => Math.max(0, d.y1 - d.y0))
			.attr("rx", 4)
			.attr("ry", 4)
			.attr("fill", (d) => {
				const file = d.data;
				if (!file || file.isExternal) return isDark ? "#27272a" : "#e5e7eb";

				if (colorMode === "hotspot") {
					const score = file.hotspotScore;
					if (score === 0) return isDark ? "#18181b" : "#f3f4f6";
					// use d3 interpolator for better heatmap color, offset slightly so low scores aren't completely white/black
					return d3.interpolateYlOrRd(score * 0.8 + 0.1);
				}

				return getLanguageColor(file.extension ?? "");
			})
			.attr("stroke", isDark ? "#09090b" : "#ffffff")
			.attr("stroke-width", 1)
			.attr("opacity", 0.85)
			.style("cursor", "pointer")
			.style("transition", "opacity 0.2s ease, stroke-width 0.2s ease")
			.on("mouseover", function (event, d) {
				d3.select(this)
					.attr("opacity", 1)
					.attr("stroke-width", 2)
					.attr("stroke", isDark ? "#ffffff" : "#000000");

				const file = d.data;
				if (file) {
					tooltip
						.html(
							`
							<div style="font-weight: 600; margin-bottom: 8px; overflow-wrap: break-word; max-width: 250px; color: ${isDark ? "#fff" : "#000"}">
								${file.path}
							</div>
							<div style="display: flex; justify-content: space-between; gap: 24px; margin-bottom: 4px;">
								<span style="color: ${isDark ? "#a1a1aa" : "#52525b"}">Lines</span>
								<span style="font-weight: 500; font-family: ui-monospace, SFMono-Regular, monospace;">${(file.loc ?? 0).toLocaleString()}</span>
							</div>
							<div style="display: flex; justify-content: space-between; gap: 24px;">
								<span style="color: ${isDark ? "#a1a1aa" : "#52525b"}">Hotspot Score</span>
								<span style="font-weight: 500; font-family: ui-monospace, SFMono-Regular, monospace; color: ${isDark ? "#fbbf24" : "#d97706"}">${(file.hotspotScore ?? 0).toFixed(3)}</span>
							</div>
						`,
						)
						.style("visibility", "visible");
				}
			})
			.on("mousemove", (event) => {
				// Prevent tooltip from overflowing the right side of the screen
				const tooltipNode = tooltip.node();
				const tooltipWidth = tooltipNode
					? (tooltipNode as HTMLElement).offsetWidth
					: 0;
				let left = event.pageX + 15;
				if (left + tooltipWidth > window.innerWidth) {
					left = event.pageX - tooltipWidth - 15;
				}

				tooltip
					.style("top", `${event.pageY + 15}px`)
					.style("left", `${left}px`);
			})
			.on("mouseout", function () {
				d3.select(this)
					.attr("opacity", 0.85)
					.attr("stroke-width", 1)
					.attr("stroke", isDark ? "#09090b" : "#ffffff");
				tooltip.style("visibility", "hidden");
			})
			.on("click", (_, d) => {
				const file = d.data;
				if (file) onFileClick?.(file);
			});

		// Calculate brightness to determine text color
		const getContrastYIQ = (hexcolor: string) => {
			if (!hexcolor) return isDark ? "#ffffff" : "#000000";
			// Handle rgb()
			if (hexcolor.startsWith("rgb")) {
				const [r, g, b] = hexcolor.match(/\d+/g) || [0, 0, 0];
				const yiq =
					(Number(r) * 299 + Number(g) * 587 + Number(b) * 114) / 1000;
				return yiq >= 128 ? "#000000" : "#ffffff";
			}
			hexcolor = hexcolor.replace("#", "");
			if (hexcolor.length === 3) {
				hexcolor = hexcolor
					.split("")
					.map((c) => c + c)
					.join("");
			}
			if (hexcolor.length !== 6) return isDark ? "#ffffff" : "#000000";
			const r = parseInt(hexcolor.substr(0, 2), 16);
			const g = parseInt(hexcolor.substr(2, 2), 16);
			const b = parseInt(hexcolor.substr(4, 2), 16);
			const yiq = (r * 299 + g * 587 + b * 114) / 1000;
			return yiq >= 128 ? "#000000" : "#ffffff";
		};

		nodes
			.filter((d) => d.y1 - d.y0 > 24 && d.x1 - d.x0 > 40)
			.append("text")
			.attr("x", 6)
			.attr("y", 18)
			.attr("fill", (d) => {
				const file = d.data;
				if (!file || file.isExternal) return isDark ? "#9ca3af" : "#4b5563";
				if (colorMode === "hotspot") {
					const score = file.hotspotScore;
					if (score === 0) return isDark ? "#71717a" : "#9ca3af";
					const color = d3.interpolateYlOrRd(score * 0.8 + 0.1);
					return getContrastYIQ(color);
				}
				const color = getLanguageColor(file.extension ?? "");
				return getContrastYIQ(color);
			})
			.attr("font-size", "11px")
			.attr("font-weight", "500")
			.attr("font-family", "ui-monospace, SFMono-Regular, monospace")
			.style("pointer-events", "none")
			.text((d) => {
				const file = d.data;
				if (!file || !file.path) return "";
				const width = d.x1 - d.x0;
				const name = file.path.split("/").pop() ?? file.path;
				const maxChars = Math.floor(width / 7);
				return name.length > maxChars
					? name.slice(0, maxChars - 1) + "…"
					: name;
			});
	}, [treemapData, dimensions, colorMode, onFileClick, isDark]);

	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="flex h-full items-center justify-center font-mono text-muted-foreground text-sm">
				Failed to load treemap data
			</div>
		);
	}

	if (data.totalFiles === 0) {
		return (
			<div className="flex h-full items-center justify-center font-mono text-muted-foreground text-sm">
				No files to display
			</div>
		);
	}

	return (
		<div
			className="relative h-full w-full overflow-hidden rounded-lg border border-border bg-card shadow-sm"
			ref={containerRef}
		/>
	);
}
