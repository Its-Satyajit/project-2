import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { analyzeRoute } from "~/server/api/analyze";
import {
	getRepositoryByOwnerAndName,
	insertRepositories,
} from "~/server/dal/repositories";
import { inngest } from "~/server/inngest/client";
import { getRepoMetadata } from "~/server/octokit";

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
	getRepoMetadata: vi.fn(),
}));

vi.mock("~/server/middleware/rate-limit", () => ({
	rateLimit: vi.fn().mockReturnValue((app: any) => app),
}));

describe("Analyze API - Error Cases", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return error for invalid GitHub URL", async () => {
		const request = new Request("http://localhost/analyze", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ githubUrl: "not-a-valid-url" }),
		});

		const response = await analyzeRoute.handle(request);
		const body = await response.json();

		expect(body.error).toBe("Invalid GitHub URL");
		expect(response.status).toBe(200);
	});

	it("should return error for private repositories", async () => {
		(getRepoMetadata as Mock).mockResolvedValueOnce({
			owner: { login: "test-owner", avatar_url: "avatar" },
			name: "test-repo",
			full_name: "test-owner/test-repo",
			html_url: "url",
			description: "desc",
			default_branch: "main",
			language: "typescript",
			private: true,
			stargazers_count: 10,
			forks_count: 5,
		});

		const request = new Request("http://localhost/analyze", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ githubUrl: "https://github.com/private/repo" }),
		});

		const response = await analyzeRoute.handle(request);
		const body = await response.json();

		expect(body.error).toBe(
			"Private repositories are not supported yet. Only public repositories can be analyzed.",
		);
	});

	it("should return error if insertRepositories fails", async () => {
		(getRepoMetadata as Mock).mockResolvedValueOnce({
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
		});

		(getRepositoryByOwnerAndName as Mock).mockResolvedValueOnce(null);
		(insertRepositories as Mock).mockResolvedValueOnce(null);

		const request = new Request("http://localhost/analyze", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				githubUrl: "https://github.com/test-owner/test-repo",
			}),
		});

		const response = await analyzeRoute.handle(request);
		const body = await response.json();

		expect(body.error).toBe("Failed to persist repository record");
	});

	it("should handle Inngest send failure gracefully", async () => {
		(getRepoMetadata as Mock).mockResolvedValueOnce({
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
		});

		(getRepositoryByOwnerAndName as Mock).mockResolvedValueOnce(null);
		(insertRepositories as Mock).mockResolvedValueOnce({
			id: "repo-123",
			owner: "test-owner",
			name: "test-repo",
		});
		(inngest.send as Mock).mockRejectedValueOnce(new Error("Inngest failed"));

		const request = new Request("http://localhost/analyze", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				githubUrl: "https://github.com/test-owner/test-repo",
			}),
		});

		const response = await analyzeRoute.handle(request);
		const body = await response.json();

		expect(body.success).toBe(true);
		expect(body.status).toBe("queued");
	});
});
