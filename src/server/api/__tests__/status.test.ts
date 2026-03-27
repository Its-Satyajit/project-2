import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { statusRoute } from "~/server/api/status";
import { getRepositoryData } from "~/server/dal/repositories";
import { fetchAnalysisData } from "~/server/dal/s3";
import { computeRepoSummary } from "~/server/logic/repoSummary";

vi.mock("~/server/dal/repositories", () => ({
	getRepositoryData: vi.fn(),
}));

vi.mock("~/server/dal/s3", () => ({
	fetchAnalysisData: vi.fn(),
}));

vi.mock("~/server/logic/repoSummary", () => ({
	computeRepoSummary: vi.fn().mockReturnValue("Mock summary"),
}));

describe("Status API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return 404 if repository not found", async () => {
		(getRepositoryData as Mock).mockResolvedValueOnce(null);

		const request = new Request("http://localhost/dashboard/repo-123/status");
		const response = await statusRoute.handle(request);

		expect(response.status).toBe(404);
	});

	it("should return repository status with analysis data", async () => {
		(getRepositoryData as Mock).mockResolvedValueOnce({
			id: "repo-123",
			owner: "test-owner",
			name: "test-repo",
			fullName: "test-owner/test-repo",
			description: "A test repo",
			defaultBranch: "main",
			primaryLanguage: "TypeScript",
			isPrivate: false,
			stars: 100,
			forks: 10,
			avatarUrl: "https://avatar.url",
			analysisStatus: "complete",
			analysisPhase: "Analysis complete",
			analysisResults: [
				{
					id: "result-1",
					s3StorageKey: "test-key",
					totalFiles: 100,
					totalDirectories: 10,
					totalLines: 5000,
				},
			],
		});

		(fetchAnalysisData as Mock).mockResolvedValueOnce({
			fileTypeBreakdown: { ts: 50, js: 30 },
			dependencyGraph: { nodes: [], edges: [] },
			hotSpotData: [],
		});

		const request = new Request("http://localhost/dashboard/repo-123/status");
		const response = await statusRoute.handle(request);
		const body = await response.json();

		expect(body.status).toBe("complete");
		expect(body.metadata.owner).toBe("test-owner");
		expect(body.analysis.totalFiles).toBe(100);
	});

	it("should handle missing analysis results gracefully", async () => {
		(getRepositoryData as Mock).mockResolvedValueOnce({
			id: "repo-123",
			owner: "test-owner",
			name: "test-repo",
			fullName: "test-owner/test-repo",
			analysisStatus: "queued",
			analysisPhase: "Waiting",
			analysisResults: [],
		});

		const request = new Request("http://localhost/dashboard/repo-123/status");
		const response = await statusRoute.handle(request);
		const body = await response.json();

		expect(body.status).toBe("queued");
		expect(body.analysis).toBeNull();
	});

	it("should handle S3 fetch errors gracefully", async () => {
		(getRepositoryData as Mock).mockResolvedValueOnce({
			id: "repo-123",
			owner: "test-owner",
			name: "test-repo",
			fullName: "test-owner/test-repo",
			analysisStatus: "complete",
			analysisPhase: "Complete",
			analysisResults: [
				{
					id: "result-1",
					s3StorageKey: "test-key",
					totalFiles: 100,
					totalDirectories: 10,
					totalLines: 5000,
				},
			],
		});

		(fetchAnalysisData as Mock).mockRejectedValueOnce(new Error("S3 error"));

		const request = new Request("http://localhost/dashboard/repo-123/status");
		const response = await statusRoute.handle(request);
		const body = await response.json();

		expect(body.status).toBe("complete");
		expect(body.analysis.fileTypeBreakdown).toBeUndefined();
	});
});
