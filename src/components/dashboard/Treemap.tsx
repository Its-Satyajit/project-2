"use client";

import { useQuery } from "@tanstack/react-query";
import * as d3 from "d3";
import { Loader2 } from "lucide-react";
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

		const svg = container
			.append("svg")
			.attr("width", dimensions.width)
			.attr("height", dimensions.height)
			.attr("viewBox", [0, 0, dimensions.width, dimensions.height])
			.attr("style", "max-width: 100%; height: auto;");

		const treemap = d3
			.treemap<TreemapFile>()
			.size([dimensions.width, dimensions.height])
			.paddingOuter(3)
			.paddingTop(19)
			.paddingInner(2)
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
			.attr("fill", (d) => {
				const file = d.data;
				if (!file || file.isExternal) return "#e5e7eb";

				if (colorMode === "hotspot") {
					const score = file.hotspotScore;
					if (score === 0) return "#f3f4f6";
					const r = Math.round(255 - score * 155);
					const g = Math.round(230 - score * 180);
					const b = Math.round(100 - score * 80);
					return `rgb(${r},${g},${b})`;
				}

				return getLanguageColor(file.extension ?? "");
			})
			.attr("stroke", (d) => {
				const file = d.data;
				return file?.isExternal ? "#9ca3af" : "none";
			})
			.attr("stroke-width", (d) => {
				const file = d.data;
				return file?.isExternal ? 2 : 0;
			})
			.attr("stroke-dasharray", (d) => {
				const file = d.data;
				return file?.isExternal ? "4,4" : "none";
			})
			.style("cursor", "pointer")
			.on("click", (_, d) => {
				const file = d.data;
				if (file) onFileClick?.(file);
			})
			.append("title")
			.text((d) => {
				const file = d.data;
				if (!file) return "";
				return `${file.path}\n${(file.loc ?? 0).toLocaleString()} lines\nScore: ${(file.hotspotScore ?? 0).toFixed(3)}`;
			});

		nodes
			.filter((d) => d.y1 - d.y0 > 15)
			.append("text")
			.attr("x", 4)
			.attr("y", 14)
			.attr("fill", (d) => {
				const file = d.data;
				if (!file || file.isExternal) return "#6b7280";
				if (colorMode === "hotspot") return "#1f2937";
				return /^(js|ts|jsx|tsx)$/i.test(file.extension) ? "#fff" : "#1f2937";
			})
			.attr("font-size", "11px")
			.attr("font-family", "ui-monospace, SFMono-Regular, monospace")
			.text((d) => {
				const file = d.data;
				if (!file || !file.path) return "";
				const width = d.x1 - d.x0;
				const height = d.y1 - d.y0;
				if (width < 40 || height < 20) return "";
				const name = file.path.split("/").pop() ?? file.path;
				const maxChars = Math.floor(width / 7);
				return name.slice(0, maxChars);
			});
	}, [treemapData, dimensions, colorMode, onFileClick]);

	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="flex h-full items-center justify-center text-muted-foreground">
				Failed to load treemap data
			</div>
		);
	}

	if (data.totalFiles === 0) {
		return (
			<div className="flex h-full items-center justify-center text-muted-foreground">
				No files to display
			</div>
		);
	}

	return (
		<div
			className="h-full w-full overflow-hidden rounded-lg border bg-background"
			ref={containerRef}
		/>
	);
}
