import { describe, expect, it } from "vitest";
import type { DependencyGraph } from "../dependencyAnalysis";
import { performHotspotAnalysis } from "../hotspotAnalysis";

describe("performHotspotAnalysis", () => {
	it("should return empty hotspots for empty graph", () => {
		const graph: DependencyGraph = {
			nodes: [],
			edges: [],
			metadata: {
				totalNodes: 0,
				totalEdges: 0,
				languageBreakdown: {},
				unresolvedImports: 0,
			},
		};
		const result = performHotspotAnalysis(graph);
		expect(result.hotspots).toHaveLength(0);
	});

	it("should calculate hotspot scores correctly", () => {
		const graph: DependencyGraph = {
			nodes: [
				{
					id: "src/utils.ts",
					path: "src/utils.ts",
					language: "typescript",
					imports: 2,
					loc: 100,
				},
				{
					id: "src/api.ts",
					path: "src/api.ts",
					language: "typescript",
					imports: 1,
					loc: 50,
				},
			],
			edges: [{ source: "src/api.ts", target: "src/utils.ts" }],
			metadata: {
				totalNodes: 2,
				totalEdges: 1,
				languageBreakdown: { typescript: 2 },
				unresolvedImports: 0,
			},
		};
		const result = performHotspotAnalysis(graph);
		expect(result.hotspots).toHaveLength(2);

		// The file with more fan-in should have higher score
		const utilsHotspot = result.hotspots.find((h) => h.path === "src/utils.ts");
		const apiHotspot = result.hotspots.find((h) => h.path === "src/api.ts");

		expect(utilsHotspot?.fanIn).toBe(1);
		expect(apiHotspot?.fanIn).toBe(0);
		expect(utilsHotspot?.score).toBeGreaterThan(apiHotspot?.score ?? 0);
	});

	it("should rank hotspots correctly", () => {
		const graph: DependencyGraph = {
			nodes: [
				{
					id: "src/core.ts",
					path: "src/core.ts",
					language: "typescript",
					imports: 5,
					loc: 200,
				},
				{
					id: "src/utils.ts",
					path: "src/utils.ts",
					language: "typescript",
					imports: 3,
					loc: 100,
				},
				{
					id: "src/helper.ts",
					path: "src/helper.ts",
					language: "typescript",
					imports: 1,
					loc: 50,
				},
			],
			edges: [
				{ source: "src/utils.ts", target: "src/core.ts" },
				{ source: "src/helper.ts", target: "src/core.ts" },
			],
			metadata: {
				totalNodes: 3,
				totalEdges: 2,
				languageBreakdown: { typescript: 3 },
				unresolvedImports: 0,
			},
		};
		const result = performHotspotAnalysis(graph);

		// Should be sorted by score descending
		expect(result.hotspots[0]?.rank).toBe(1);
		expect(result.hotspots[1]?.rank).toBe(2);
		expect(result.hotspots[2]?.rank).toBe(3);

		// Scores should be descending
		expect(result.hotspots[0]?.score).toBeGreaterThanOrEqual(
			result.hotspots[1]?.score ?? 0,
		);
		expect(result.hotspots[1]?.score).toBeGreaterThanOrEqual(
			result.hotspots[2]?.score ?? 0,
		);
	});

	it("should limit results to top 50", () => {
		const nodes = Array.from({ length: 60 }, (_, i) => ({
			id: `file${i}.ts`,
			path: `file${i}.ts`,
			language: "typescript",
			imports: i,
			loc: i * 10,
		}));

		const graph: DependencyGraph = {
			nodes,
			edges: [],
			metadata: {
				totalNodes: 60,
				totalEdges: 0,
				languageBreakdown: { typescript: 60 },
				unresolvedImports: 0,
			},
		};

		const result = performHotspotAnalysis(graph);
		expect(result.hotspots).toHaveLength(50);
	});

	it("should handle nodes with zero LOC", () => {
		const graph: DependencyGraph = {
			nodes: [
				{
					id: "src/empty.ts",
					path: "src/empty.ts",
					language: "typescript",
					imports: 0,
					loc: 0,
				},
			],
			edges: [],
			metadata: {
				totalNodes: 1,
				totalEdges: 0,
				languageBreakdown: { typescript: 1 },
				unresolvedImports: 0,
			},
		};
		const result = performHotspotAnalysis(graph);
		expect(result.hotspots).toHaveLength(1);
		expect(result.hotspots[0]?.score).toBe(0.5); // All normalized values are 0.5 when all equal
	});

	it("should calculate correct fan-in values", () => {
		const graph: DependencyGraph = {
			nodes: [
				{
					id: "a.ts",
					path: "a.ts",
					language: "typescript",
					imports: 0,
					loc: 10,
				},
				{
					id: "b.ts",
					path: "b.ts",
					language: "typescript",
					imports: 0,
					loc: 10,
				},
				{
					id: "c.ts",
					path: "c.ts",
					language: "typescript",
					imports: 0,
					loc: 10,
				},
			],
			edges: [
				{ source: "b.ts", target: "a.ts" },
				{ source: "c.ts", target: "a.ts" },
			],
			metadata: {
				totalNodes: 3,
				totalEdges: 2,
				languageBreakdown: { typescript: 3 },
				unresolvedImports: 0,
			},
		};
		const result = performHotspotAnalysis(graph);

		const aHotspot = result.hotspots.find((h) => h.path === "a.ts");
		const bHotspot = result.hotspots.find((h) => h.path === "b.ts");
		const cHotspot = result.hotspots.find((h) => h.path === "c.ts");

		expect(aHotspot?.fanIn).toBe(2);
		expect(bHotspot?.fanIn).toBe(0);
		expect(cHotspot?.fanIn).toBe(0);
	});
});
