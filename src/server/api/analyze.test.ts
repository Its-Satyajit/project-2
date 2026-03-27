import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { analyzeRoute } from "~/server/api/analyze";
import {
	getRepositoryByOwnerAndName,
	insertRepositories,
} from "~/server/dal/repositories";
import { inngest } from "~/server/inngest/client";
import { getRepoMetadata } from "~/server/octokit";

// Mock dependencies
vi.mock("~/server/dal/repositories", () => ({
	getRepositoryByOwnerAndName: vi.fn(),
	insertRepositories: vi.fn(),
}));

vi.mock("~/server/inngest/client", () => ({
	inngest: {
		send: vi.fn().mockResolvedValue({}),
	},
}));

vi.mock("~/server/octokit", () => ({
	getRepoMetadata: vi.fn().mockResolvedValue({
		owner: { login: "test-owner", avatar_url: "avatar" },
		name: "test-repo",
		full_name: "test-owner/test-repo",
		html_url: "url",
		description: "desc",
		default_branch: "main",
		language: "typescript",
		private: false,
		stargazers_count: 10,
		forks_count: 5,
	}),
}));

// Mock rate limit
vi.mock("~/server/middleware/rate-limit", () => ({
	rateLimit: vi.fn().mockReturnValue((app: any) => app),
}));

describe("Analyze API - Re-analysis Window", () => {
	const mockRepoUrl = "https://github.com/test-owner/test-repo";

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should NOT trigger analysis if already analyzed in the last 24h", async () => {
		const lessThan24hAgo = new Date();
		lessThan24hAgo.setHours(lessThan24hAgo.getHours() - 1);

		(getRepositoryByOwnerAndName as Mock).mockResolvedValueOnce({
			id: "repo-123",
			owner: "test-owner",
			name: "test-repo",
			analysisStatus: "complete",
			analysisResults: [
				{
					createdAt: lessThan24hAgo.toISOString(),
				},
			],
		});

		const request = new Request("http://localhost/analyze", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ githubUrl: mockRepoUrl }),
		});

		const response = await analyzeRoute.handle(request);
		const body = await response.json();

		expect(body.status).toBe("complete");
		expect(body.message).toBe("Repository analyzed recently.");
		expect(insertRepositories).not.toHaveBeenCalled();
		expect(inngest.send).not.toHaveBeenCalled();
	});

	it("should proceed with analysis if last analysis > 24h ago", async () => {
		const moreThan24hAgo = new Date();
		moreThan24hAgo.setDate(moreThan24hAgo.getDate() - 2);

		(getRepositoryByOwnerAndName as Mock).mockResolvedValueOnce({
			id: "repo-123",
			owner: "test-owner",
			name: "test-repo",
			analysisStatus: "complete",
			analysisResults: [
				{
					createdAt: moreThan24hAgo.toISOString(),
				},
			],
		});

		(insertRepositories as Mock).mockResolvedValueOnce({
			id: "repo-123",
			owner: "test-owner",
			name: "test-repo",
		});

		const request = new Request("http://localhost/analyze", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ githubUrl: mockRepoUrl }),
		});

		const response = await analyzeRoute.handle(request);
		const body = await response.json();

		expect(body.status).toBe("queued");
		expect(insertRepositories).toHaveBeenCalled();
		expect(inngest.send).toHaveBeenCalled();
	});

	it("should proceed with analysis if never analyzed before", async () => {
		(getRepositoryByOwnerAndName as Mock).mockResolvedValueOnce(null);

		(insertRepositories as Mock).mockResolvedValueOnce({
			id: "repo-123",
			owner: "test-owner",
			name: "test-repo",
		});

		const request = new Request("http://localhost/analyze", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ githubUrl: mockRepoUrl }),
		});

		const response = await analyzeRoute.handle(request);
		const body = await response.json();

		expect(body.status).toBe("queued");
		expect(insertRepositories).toHaveBeenCalled();
		expect(inngest.send).toHaveBeenCalled();
	});
});
