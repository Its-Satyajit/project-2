import type {
	DependencyGraph,
	GraphEdge,
	GraphNode,
} from "./dependencyAnalysis";

export interface HotspotEntry {
	path: string;
	language: string;
	fanIn: number;
	fanOut: number;
	loc: number;
	score: number;
	rank: number;
}

export interface HotspotResult {
	hotspots: HotspotEntry[];
	processedAt: Date;
}

/**
 * Compute fan-in (number of incoming edges) for each node.
 */
function computeFanIn(
	nodes: GraphNode[],
	edges: GraphEdge[],
): Map<string, number> {
	const fanIn = new Map<string, number>();
	// Initialize all nodes with 0
	for (const node of nodes) {
		fanIn.set(node.id, 0);
	}
	// Count edges where target matches node.id
	for (const edge of edges) {
		const current = fanIn.get(edge.target) ?? 0;
		fanIn.set(edge.target, current + 1);
	}
	return fanIn;
}

/**
 * Normalize an array of numbers to 0-1 range using min-max scaling.
 * If all values are equal, returns 0.5 for each.
 */
function normalizeMetric(values: number[]): number[] {
	if (values.length === 0) return [];
	const min = Math.min(...values);
	const max = Math.max(...values);
	if (max === min) {
		// All values equal, return 0.5 for each
		return values.map(() => 0.5);
	}
	return values.map((v) => (v - min) / (max - min));
}

/**
 * Perform hotspot analysis on a dependency graph.
 * Returns top 50 hotspots sorted by composite score.
 */
export function performHotspotAnalysis(
	dependencyGraph: DependencyGraph,
): HotspotResult {
	const { nodes, edges } = dependencyGraph;
	const fanInMap = computeFanIn(nodes, edges);

	// Prepare arrays for normalization
	const fanInValues: number[] = [];
	const fanOutValues: number[] = [];
	const locValues: number[] = [];

	const nodeData = nodes.map((node) => {
		const fanIn = fanInMap.get(node.id) ?? 0;
		const fanOut = node.imports;
		const loc = node.loc ?? 0;
		fanInValues.push(fanIn);
		fanOutValues.push(fanOut);
		locValues.push(loc);
		return { node, fanIn, fanOut, loc };
	});

	// Normalize each metric
	const normFanIn = normalizeMetric(fanInValues);
	const normFanOut = normalizeMetric(fanOutValues);
	const normLoc = normalizeMetric(locValues);

	// Create hotspot entries with computed scores
	const hotspots: HotspotEntry[] = nodeData.map((data, i) => ({
		path: data.node.path,
		language: data.node.language,
		fanIn: data.fanIn,
		fanOut: data.fanOut,
		loc: data.loc,
		score:
			0.4 * (normFanIn[i] ?? 0) +
			0.2 * (normFanOut[i] ?? 0) +
			0.4 * (normLoc[i] ?? 0),
		rank: 0, // will be set after sorting
	}));

	// Sort by score descending
	hotspots.sort((a, b) => b.score - a.score);

	// Assign ranks and limit to top 50
	const top50 = hotspots.slice(0, 50).map((entry, index) => ({
		...entry,
		rank: index + 1,
	}));

	return {
		hotspots: top50,
		processedAt: new Date(),
	};
}
