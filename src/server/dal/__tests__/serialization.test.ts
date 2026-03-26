import { describe, it, expect } from "vitest";
import type { AnalysisData } from "../../types/analysis";
import { packAnalysisData, unpackAnalysisData } from "../serialization";

describe("AnalysisData Serialization", () => {
	const mockData: AnalysisData = {
		totalFiles: 2,
		totalLines: 100,
		files: [
			{
				id: "1",
				path: "src/index.ts",
				size: 1000,
				sha: "sha1",
				isDirectory: false,
				linesCount: 50,
				extension: "ts",
				depth: 2,
			},
			{
				id: "2",
				path: "src/utils.ts",
				size: 500,
				sha: "sha2",
				isDirectory: false,
				linesCount: 50,
				extension: "ts",
				depth: 2,
			},
		],
		fileTree: [
			{ name: "src", items: [{ name: "index.ts" }, { name: "utils.ts" }] },
		],
		fileTypeBreakdown: { ts: 2 },
		commits: [],
		dependencyGraph: {
			nodes: [
				{ path: "src/index.ts", loc: 50 },
				{ path: "src/utils.ts", loc: 50 },
			],
			edges: [{ source: "src/index.ts", target: "src/utils.ts" }],
			metadata: {
				totalNodes: 2,
				totalEdges: 1,
				languageBreakdown: { ts: 2 },
			},
		},
		hotSpotData: [{ path: "src/index.ts", score: 0.8, fanIn: 5, fanOut: 2 }],
	};

	it("should pack and unpack data correctly", () => {
		const packed = packAnalysisData(mockData);
		const unpacked = unpackAnalysisData(packed);

		expect(unpacked.totalFiles).toBe(mockData.totalFiles);
		expect(unpacked.files[0]?.path).toBe(mockData.files[0]?.path);
		expect(unpacked.dependencyGraph?.metadata?.totalNodes).toBe(2);
		expect(unpacked.dependencyGraph?.metadata?.languageBreakdown.ts).toBe(2);
		expect(unpacked.dependencyGraph?.nodes[0]?.path).toBe(
			mockData.dependencyGraph?.nodes[0]?.path,
		);
		expect(unpacked.dependencyGraph?.edges[0]?.source).toBe(
			mockData.dependencyGraph?.edges[0]?.source,
		);
		expect(unpacked.hotSpotData?.[0]?.path).toBe(mockData.hotSpotData?.[0]?.path);
	});

	it("should handle legacy JSON data", () => {
		const json = JSON.stringify(mockData);
		const buffer = Buffer.from(json);
		const unpacked = unpackAnalysisData(buffer);

		expect(unpacked.totalFiles).toBe(mockData.totalFiles);
		expect(unpacked.files[0]?.path).toBe(mockData.files[0]?.path);
	});

	it("should significantly reduce size for repetitive paths", () => {
		// Create a larger mock data with many repetitive paths
		const largeMockData: AnalysisData = {
			files: Array.from({ length: 100 }).map((_, i) => ({
				id: i.toString(),
				path: `extremely/long/path/to/repro/directory/structure/file_${i}.ts`,
				size: 100,
				sha: "sha",
				isDirectory: false,
				linesCount: 10,
				extension: "ts",
				depth: 5,
			})),
			fileTree: [],
			fileTypeBreakdown: {},
			commits: [],
			dependencyGraph: {
				nodes: Array.from({ length: 100 }).map((_, i) => ({
					path: `extremely/long/path/to/repro/directory/structure/file_${i}.ts`,
				})),
				edges: [],
			},
		};

		const jsonSize = Buffer.from(JSON.stringify(largeMockData)).length;
		const packedSize = packAnalysisData(largeMockData).length;

		console.log(`JSON size: ${jsonSize} bytes`);
		console.log(`Packed size: ${packedSize} bytes`);
		console.log(
			`Compression ratio: ${((1 - packedSize / jsonSize) * 100).toFixed(2)}%`,
		);

		expect(packedSize).toBeLessThan(jsonSize);
	});
});
