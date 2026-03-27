import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { treemapRoute } from "~/server/api/treemap";
import { fetchAnalysisData } from "~/server/dal/s3";
import { db } from "~/server/db";

vi.mock("~/server/dal/s3", () => ({
	fetchAnalysisData: vi.fn(),
}));

vi.mock("~/server/db");

describe("Treemap API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return 404 if repository not found", async () => {
		db.query = {
			repositories: {
				findFirst: vi.fn().mockResolvedValue(null),
			},
		} as any;

		const request = new Request("http://localhost/dashboard/repo-123/treemap");
		const response = await treemapRoute.handle(request);

		expect(response.status).toBe(404);
	});

	it("should return 404 if no analysis data exists", async () => {
		db.query = {
			repositories: {
				findFirst: vi.fn().mockResolvedValue({
					id: "repo-123",
					analysisResults: [],
				}),
			},
		} as any;

		const request = new Request("http://localhost/dashboard/repo-123/treemap");
		const response = await treemapRoute.handle(request);

		expect(response.status).toBe(404);
	});

	it("should return 404 if analysis has no s3StorageKey", async () => {
		db.query = {
			repositories: {
				findFirst: vi.fn().mockResolvedValue({
					id: "repo-123",
					analysisResults: [{ id: "result-1", s3StorageKey: null }],
				}),
			},
		} as any;

		const request = new Request("http://localhost/dashboard/repo-123/treemap");
		const response = await treemapRoute.handle(request);

		expect(response.status).toBe(404);
	});

	it("should return treemap data with hotspots", async () => {
		db.query = {
			repositories: {
				findFirst: vi.fn().mockResolvedValue({
					id: "repo-123",
					analysisResults: [{ id: "result-1", s3StorageKey: "test-key" }],
				}),
			},
		} as any;

		(fetchAnalysisData as Mock).mockResolvedValueOnce({
			files: [
				{
					id: "f1",
					path: "src/index.ts",
					isDirectory: false,
					extension: ".ts",
					linesCount: 100,
				},
				{
					id: "f2",
					path: "src/utils.ts",
					isDirectory: false,
					extension: ".ts",
					linesCount: 50,
				},
				{ id: "f3", path: "src", isDirectory: true },
			],
			dependencyGraph: {
				nodes: [
					{ path: "src/index.ts", loc: 100, fanIn: 0, fanOut: 2, score: 0.5 },
					{ path: "src/utils.ts", loc: 50, fanIn: 1, fanOut: 0, score: 0.8 },
				],
				edges: [],
			},
			hotSpotData: [{ path: "src/utils.ts", score: 0.8, fanIn: 1, fanOut: 0 }],
		});

		const request = new Request("http://localhost/dashboard/repo-123/treemap");
		const response = await treemapRoute.handle(request);
		const body = await response.json();

		expect(body.totalFiles).toBe(2);
		expect(body.files).toHaveLength(2);
		expect(body.files[0].path).toBe("src/index.ts");
		expect(body.files[0].hotspotScore).toBe(0.5);
	});

	it("should handle files without hotspot data", async () => {
		db.query = {
			repositories: {
				findFirst: vi.fn().mockResolvedValue({
					id: "repo-123",
					analysisResults: [{ id: "result-1", s3StorageKey: "test-key" }],
				}),
			},
		} as any;

		(fetchAnalysisData as Mock).mockResolvedValueOnce({
			files: [
				{
					id: "f1",
					path: "README.md",
					isDirectory: false,
					extension: ".md",
					linesCount: 20,
				},
			],
			dependencyGraph: { nodes: [], edges: [] },
		});

		const request = new Request("http://localhost/dashboard/repo-123/treemap");
		const response = await treemapRoute.handle(request);
		const body = await response.json();

		expect(body.files[0].isExternal).toBe(true);
		expect(body.files[0].hotspotScore).toBe(0);
	});
});
