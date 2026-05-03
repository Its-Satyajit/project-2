import type { FileTreeItem } from "~/lib/treeUtils";

export interface RepoSummary {
	basic: {
		totalFiles: number;
		totalDirectories: number;
		totalLines: number;
	};
	languages: {
		primaryLanguage: string;
		topLanguages: Array<{ name: string; percentage: number }>;
	};
	structure: {
		maxDepth: number;
		topLevelDirectories: string[];
	};
	dependencies: {
		totalNodes: number;
		totalEdges: number;
		mostDependedUpon: Array<{ path: string; fanIn: number }>;
		mostDependent: Array<{ path: string; fanOut: number }>;
	};
	hotspots: {
		topHotspots: Array<{ path: string; score: number; rank: number }>;
	};
	fileTypes: {
		topExtensions: Array<{ extension: string; count: number }>;
	};
}

import type { AnalysisData } from "../types/analysis";

export function computeRepoSummary(analysis: AnalysisData): RepoSummary {
	// Basic stats
	const basic = {
		totalFiles: analysis.totalFiles ?? 0,
		totalDirectories: analysis.totalDirectories ?? 0,
		totalLines: analysis.totalLines ?? 0,
	};

	// Language breakdown from dependency graph nodes
	const languageCounts: Record<string, number> = {};
	let totalLanguageFiles = 0;
	if (analysis.dependencyGraph?.nodes) {
		for (const node of analysis.dependencyGraph.nodes) {
			const lang = "language" in node ? (node as any).language : "unknown";
			languageCounts[lang] = (languageCounts[lang] || 0) + 1;
			totalLanguageFiles++;
		}
	}

	// Sort languages by count descending
	const languageEntries = Object.entries(languageCounts)
		.sort(([, a], [, b]) => b - a)
		.slice(0, 5);

	const primaryLanguage = languageEntries[0]?.[0] ?? "unknown";
	const topLanguages = languageEntries.map(([name, count]) => ({
		name,
		percentage: totalLanguageFiles > 0 ? (count / totalLanguageFiles) * 100 : 0,
	}));

	// Structure from file tree
	let maxDepth = 0;
	const topLevelDirectories: string[] = [];

	function traverseTree(
		items: FileTreeItem[],
		depth: number,
		parentPath: string,
	) {
		for (const item of items) {
			const currentPath = parentPath ? `${parentPath}/${item.name}` : item.name;
			if (depth === 0 && "items" in item) {
				topLevelDirectories.push(item.name);
			}
			if (depth > maxDepth) {
				maxDepth = depth;
			}
			if ("items" in item && item.items) {
				traverseTree(item.items, depth + 1, currentPath);
			}
		}
	}

	if (analysis.fileTree) {
		traverseTree(analysis.fileTree, 0, "");
	}

	// Dependencies
	const dependencyStats = {
		totalNodes: analysis.dependencyGraph?.nodes?.length ?? 0,
		totalEdges: analysis.dependencyGraph?.edges?.length ?? 0,
		mostDependedUpon: [] as Array<{ path: string; fanIn: number }>,
		mostDependent: [] as Array<{ path: string; fanOut: number }>,
	};

	if (analysis.dependencyGraph?.nodes) {
		// Compute fan-in from edges
		const fanInMap: Record<string, number> = {};
		analysis.dependencyGraph.nodes.forEach((node) => {
			fanInMap[node.path] = 0;
		});
		analysis.dependencyGraph.edges.forEach((edge) => {
			fanInMap[edge.target] = (fanInMap[edge.target] ?? 0) + 1;
		});

		// Create array with fan-in and fan-out
		const nodesWithStats = analysis.dependencyGraph.nodes.map((node) => ({
			path: node.path,
			fanIn: fanInMap[node.path] ?? 0,
			fanOut: node.fanOut ?? 0,
		}));

		// Sort by fan-in descending for mostDependedUpon
		dependencyStats.mostDependedUpon = [...nodesWithStats]
			.sort((a, b) => b.fanIn - a.fanIn)
			.slice(0, 10)
			.map(({ path, fanIn }) => ({ path, fanIn }));

		// Sort by fan-out descending for mostDependent
		dependencyStats.mostDependent = [...nodesWithStats]
			.sort((a, b) => b.fanOut - a.fanOut)
			.slice(0, 10)
			.map(({ path, fanOut }) => ({ path, fanOut }));
	}

	// Hotspots
	const hotspots = {
		topHotspots: [] as Array<{ path: string; score: number; rank: number }>,
	};
	if (analysis.hotSpotData) {
		hotspots.topHotspots = analysis.hotSpotData
			.slice(0, 10)
			.map(({ path, score }, index) => ({ path, score, rank: index + 1 }));
	}

	// File types from fileTypeBreakdown
	const fileTypes = {
		topExtensions: [] as Array<{ extension: string; count: number }>,
	};
	if (analysis.fileTypeBreakdown) {
		fileTypes.topExtensions = Object.entries(analysis.fileTypeBreakdown)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 10)
			.map(([extension, count]) => ({ extension, count }));
	}

	return {
		basic,
		languages: { primaryLanguage, topLanguages },
		structure: { maxDepth, topLevelDirectories },
		dependencies: dependencyStats,
		hotspots,
		fileTypes,
	};
}
