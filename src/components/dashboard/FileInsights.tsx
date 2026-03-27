"use client";

import { FileCode, FileText, Settings, TestTube } from "lucide-react";
import { motion } from "motion/react";
import React, { useMemo } from "react";

interface FileInsightsProps {
	fileTypeBreakdown: Record<string, number>;
	totalFiles: number;
}

// File type categories
const CODE_EXTENSIONS = new Set([
	"ts",
	"tsx",
	"js",
	"jsx",
	"py",
	"go",
	"rs",
	"java",
	"cpp",
	"c",
	"rb",
	"php",
	"swift",
	"kt",
	"vue",
	"svelte",
	"css",
	"scss",
	"html",
	"sql",
	"sh",
	"bash",
]);

const TEST_EXTENSIONS = new Set([
	"test.ts",
	"test.tsx",
	"test.js",
	"spec.ts",
	"spec.tsx",
	"test.py",
	"spec.py",
]);

const CONFIG_EXTENSIONS = new Set([
	"json",
	"yaml",
	"yml",
	"toml",
	"ini",
	"env",
	"config",
	"rc",
]);

const DOC_EXTENSIONS = new Set(["md", "txt", "rst"]);

interface CategoryData {
	name: string;
	count: number;
	percentage: number;
	icon: React.ComponentType<{ className?: string }>;
	color: string;
}

export const FileInsights = React.memo(function FileInsights({
	fileTypeBreakdown,
	totalFiles,
}: FileInsightsProps) {
	const insights = useMemo(() => {
		if (!fileTypeBreakdown || totalFiles === 0) {
			return {
				categories: [],
				dominantType: "N/A",
				topFiles: [],
			};
		}

		// Categorize files
		let codeCount = 0;
		let testCount = 0;
		let configCount = 0;
		let docCount = 0;
		let otherCount = 0;

		for (const [ext, count] of Object.entries(fileTypeBreakdown)) {
			const lowerExt = ext.toLowerCase();

			if (CODE_EXTENSIONS.has(lowerExt)) {
				codeCount += count;
			} else if (TEST_EXTENSIONS.has(lowerExt)) {
				testCount += count;
			} else if (CONFIG_EXTENSIONS.has(lowerExt)) {
				configCount += count;
			} else if (DOC_EXTENSIONS.has(lowerExt)) {
				docCount += count;
			} else {
				otherCount += count;
			}
		}

		const categories: CategoryData[] = [
			{
				name: "Source Code",
				count: codeCount,
				percentage: (codeCount / totalFiles) * 100,
				icon: FileCode,
				color: "bg-primary",
			},
			{
				name: "Tests",
				count: testCount,
				percentage: (testCount / totalFiles) * 100,
				icon: TestTube,
				color: "bg-emerald-500",
			},
			{
				name: "Config",
				count: configCount,
				percentage: (configCount / totalFiles) * 100,
				icon: Settings,
				color: "bg-amber-500",
			},
			{
				name: "Documentation",
				count: docCount,
				percentage: (docCount / totalFiles) * 100,
				icon: FileText,
				color: "bg-blue-500",
			},
		].filter((c) => c.count > 0);

		// Find dominant file type
		const sortedTypes = Object.entries(fileTypeBreakdown).sort(
			([, a], [, b]) => b - a,
		);
		const dominantType = sortedTypes[0]?.[0] || "N/A";

		// Top 5 file types
		const topFiles = sortedTypes.slice(0, 5).map(([ext, count]) => ({
			ext,
			count,
			percentage: (count / totalFiles) * 100,
		}));

		return {
			categories,
			dominantType,
			topFiles,
		};
	}, [fileTypeBreakdown, totalFiles]);

	// Compute code-to-config ratio
	const codeToConfigRatio = useMemo(() => {
		const codeFiles =
			insights.categories.find((c) => c.name === "Source Code")?.count || 0;
		const configFiles =
			insights.categories.find((c) => c.name === "Config")?.count || 0;
		if (configFiles === 0) return "∞";
		return (codeFiles / configFiles).toFixed(1);
	}, [insights.categories]);

	// Test coverage ratio (tests / code)
	const testRatio = useMemo(() => {
		const codeFiles =
			insights.categories.find((c) => c.name === "Source Code")?.count || 0;
		const testFiles =
			insights.categories.find((c) => c.name === "Tests")?.count || 0;
		if (codeFiles === 0) return "0%";
		return `${((testFiles / codeFiles) * 100).toFixed(0)}%`;
	}, [insights.categories]);

	return (
		<motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 10 }}>
			{/* Header */}
			<div className="mb-4 flex items-center justify-between">
				<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
					File Composition
				</span>
				<span className="font-mono text-muted-foreground text-xs">
					{totalFiles} files
				</span>
			</div>

			{/* Category breakdown */}
			<div className="mb-4 space-y-2">
				{insights.categories.map((cat, index) => (
					<motion.div
						animate={{ opacity: 1, x: 0 }}
						className="flex items-center gap-3"
						initial={{ opacity: 0, x: -10 }}
						key={cat.name}
						transition={{ delay: index * 0.05 }}
					>
						<cat.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
						<div className="flex-1">
							<div className="mb-1 flex items-center justify-between">
								<span className="font-mono text-foreground text-xs">
									{cat.name}
								</span>
								<span className="font-mono text-muted-foreground text-xs tabular-nums">
									{cat.count} ({cat.percentage.toFixed(0)}%)
								</span>
							</div>
							<div className="h-1 w-full bg-border">
								<motion.div
									animate={{ width: `${cat.percentage}%` }}
									className={`h-full ${cat.color}`}
									initial={{ width: 0 }}
									transition={{ delay: index * 0.1, duration: 0.4 }}
								/>
							</div>
						</div>
					</motion.div>
				))}
			</div>

			{/* Computed metrics */}
			<div className="grid grid-cols-2 gap-3">
				<div className="border border-border p-3">
					<span className="mb-1 block font-mono text-[9px] text-muted-foreground uppercase">
						Code:Config Ratio
					</span>
					<span className="font-(family-name:--font-display) text-foreground text-lg">
						{codeToConfigRatio}:1
					</span>
				</div>
				<div className="border border-border p-3">
					<span className="mb-1 block font-mono text-[9px] text-muted-foreground uppercase">
						Test Coverage Ratio
					</span>
					<span className="font-(family-name:--font-display) text-foreground text-lg">
						{testRatio}
					</span>
				</div>
			</div>

			{/* Top file types */}
			<div className="mt-4 border-border border-t pt-3">
				<span className="mb-2 block font-mono text-[9px] text-muted-foreground uppercase">
					Most Common Types
				</span>
				<div className="flex flex-wrap gap-1.5">
					{insights.topFiles.map((file) => (
						<span
							className="border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
							key={file.ext}
						>
							.{file.ext}
							<span className="ml-1 text-foreground">{file.count}</span>
						</span>
					))}
				</div>
			</div>
		</motion.div>
	);
});
