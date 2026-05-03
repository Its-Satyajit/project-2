import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { dashboardRoute } from "~/server/api/dashboard";
import { getContributorCount } from "~/server/dal/contributors";
import {
	getRepositoryData,
	updateRepositoryStatus,
} from "~/server/dal/repositories";
import { inngest } from "~/server/inngest/client";

// Mock dependencies
vi.mock("~/server/dal/repositories", () => ({
	getRepositoryData: vi.fn(),
	updateRepositoryStatus: vi.fn(),
}));

vi.mock("~/server/dal/contributors", () => ({
	getContributorCount: vi.fn().mockResolvedValue(0),
}));

vi.mock("~/server/dal/s3", () => ({
	fetchAnalysisData: vi.fn().mockResolvedValue({}),
}));

vi.mock("~/server/inngest/client", () => ({
	inngest: {
		send: vi.fn().mockResolvedValue({}),
	},
}));

describe("Dashboard API - Re-analysis Logic", () => {
	const mockRepoId = "repo-123";

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should trigger re-analysis if status is complete and last update > 24h ago", async () => {
		const moreThan24hAgo = new Date();
		moreThan24hAgo.setDate(moreThan24hAgo.getDate() - 2);

		(getRepositoryData as Mock).mockResolvedValueOnce({
			id: mockRepoId,
			owner: "test-owner",
			name: "test-repo",
			fullName: "test-owner/test-repo",
			defaultBranch: "main",
			url: "https://github.com/test-owner/test-repo",
			analysisStatus: "complete",
			updatedAt: moreThan24hAgo.toISOString(),
			analysisResults: [
				{
					createdAt: moreThan24hAgo.toISOString(),
					s3StorageKey: "test-key",
				},
			],
		});

		const request = new Request(`http://localhost/dashboard/${mockRepoId}`);
		await dashboardRoute.handle(request);

		expect(updateRepositoryStatus).toHaveBeenCalledWith(
			mockRepoId,
			"queued",
			"Auto re-analysis triggered",
		);
		expect(inngest.send).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "analysis/repo.requested",
				data: expect.objectContaining({
					repoId: mockRepoId,
				}),
			}),
		);
	});

	it("should NOT trigger re-analysis if status is complete and last update < 24h ago", async () => {
		const lessThan24hAgo = new Date();
		lessThan24hAgo.setHours(lessThan24hAgo.getHours() - 1);

		(getRepositoryData as Mock).mockResolvedValueOnce({
			id: mockRepoId,
			owner: "test-owner",
			name: "test-repo",
			fullName: "test-owner/test-repo",
			analysisStatus: "complete",
			updatedAt: lessThan24hAgo.toISOString(),
			analysisResults: [
				{
					createdAt: lessThan24hAgo.toISOString(),
					s3StorageKey: "test-key",
				},
			],
		});

		const request = new Request(`http://localhost/dashboard/${mockRepoId}`);
		await dashboardRoute.handle(request);

		expect(updateRepositoryStatus).not.toHaveBeenCalled();
		expect(inngest.send).not.toHaveBeenCalled();
	});

	it("should trigger re-analysis if status is complete but NO analysis result exists", async () => {
		(getRepositoryData as Mock).mockResolvedValueOnce({
			id: mockRepoId,
			owner: "test-owner",
			name: "test-repo",
			fullName: "test-owner/test-repo",
			analysisStatus: "complete",
			updatedAt: new Date().toISOString(),
			analysisResults: [],
		});

		const request = new Request(`http://localhost/dashboard/${mockRepoId}`);
		await dashboardRoute.handle(request);

		expect(updateRepositoryStatus).toHaveBeenCalledWith(
			mockRepoId,
			"queued",
			"Auto re-analysis triggered",
		);
		expect(inngest.send).toHaveBeenCalled();
	});

	it("should NOT trigger re-analysis if status IS NOT 'complete' (e.g. already 'queued')", async () => {
		(getRepositoryData as Mock).mockResolvedValueOnce({
			id: mockRepoId,
			owner: "test-owner",
			name: "test-repo",
			fullName: "test-owner/test-repo",
			analysisStatus: "queued",
			updatedAt: new Date().toISOString(),
			analysisResults: [],
		});

		const request = new Request(`http://localhost/dashboard/${mockRepoId}`);
		await dashboardRoute.handle(request);

		expect(updateRepositoryStatus).not.toHaveBeenCalled();
		expect(inngest.send).not.toHaveBeenCalled();
	});
});
