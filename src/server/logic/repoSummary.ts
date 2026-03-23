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

export interface AnalysisData {
	totalFiles: number | null;
	totalDirectories: number | null;
	totalLines: number | null;
	fileTypeBreakdownJson: Record<string, number> | null;
	dependencyGraphJson: {
		nodes: Array<{
			id: string;
			path: string;
			language: string;
			imports: number;
			loc?: number;
		}>;
		edges: Array<{
			source: string;
			target: string;
		}>;
		metadata: {
			totalNodes: number;
			totalEdges: number;
			languageBreakdown: Record<string, number>;
			unresolvedImports: number;
		};
	} | null;
	hotSpotDataJson: Array<{
		path: string;
		language: string;
		fanIn: number;
		fanOut: number;
		loc: number;
		score: number;
		rank: number;
	}> | null;
	fileTreeJson: FileTreeItem[] | null;
}

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
	if (analysis.dependencyGraphJson?.nodes) {
		for (const node of analysis.dependencyGraphJson.nodes) {
			languageCounts[node.language] = (languageCounts[node.language] || 0) + 1;
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

	if (analysis.fileTreeJson) {
		traverseTree(analysis.fileTreeJson, 0, "");
	}

	// Dependencies
	const dependencyStats = {
		totalNodes: analysis.dependencyGraphJson?.metadata.totalNodes ?? 0,
		totalEdges: analysis.dependencyGraphJson?.metadata.totalEdges ?? 0,
		mostDependedUpon: [] as Array<{ path: string; fanIn: number }>,
		mostDependent: [] as Array<{ path: string; fanOut: number }>,
	};

	if (analysis.dependencyGraphJson?.nodes) {
		// Compute fan-in from edges
		const fanInMap: Record<string, number> = {};
		analysis.dependencyGraphJson.nodes.forEach((node) => {
			fanInMap[node.id] = 0;
		});
		analysis.dependencyGraphJson.edges.forEach((edge) => {
			fanInMap[edge.target] = (fanInMap[edge.target] ?? 0) + 1;
		});

		// Create array with fan-in and fan-out
		const nodesWithStats = analysis.dependencyGraphJson.nodes.map((node) => ({
			path: node.path,
			fanIn: fanInMap[node.id] ?? 0,
			fanOut: node.imports,
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
	if (analysis.hotSpotDataJson) {
		hotspots.topHotspots = analysis.hotSpotDataJson
			.slice(0, 10)
			.map(({ path, score, rank }) => ({ path, score, rank }));
	}

	// File types from fileTypeBreakdownJson
	const fileTypes = {
		topExtensions: [] as Array<{ extension: string; count: number }>,
	};
	if (analysis.fileTypeBreakdownJson) {
		fileTypes.topExtensions = Object.entries(analysis.fileTypeBreakdownJson)
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
