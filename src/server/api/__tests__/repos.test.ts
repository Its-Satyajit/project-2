import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { reposRoute } from "~/server/api/repos";
import { getTopRepositoriesByStars } from "~/server/dal/repositories";

vi.mock("~/server/dal/repositories", () => ({
	getTopRepositoriesByStars: vi.fn(),
}));

describe("Repos API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return top repositories with default limit", async () => {
		(getTopRepositoriesByStars as Mock).mockResolvedValueOnce([
			{
				id: "repo-1",
				owner: "owner1",
				name: "repo1",
				fullName: "owner1/repo1",
				description: "A cool repo",
				stars: 100,
				forks: 10,
				contributorCount: 5,
				primaryLanguage: "TypeScript",
				analysisStatus: "complete",
			},
		]);

		const request = new Request("http://localhost/repos/top");
		const response = await reposRoute.handle(request);
		const body = await response.json();

		expect(body).toHaveLength(1);
		expect(body[0]).toEqual({
			id: "repo-1",
			owner: "owner1",
			name: "repo1",
			fullName: "owner1/repo1",
			description: "A cool repo",
			stars: 100,
			forks: 10,
			contributorCount: 5,
			primaryLanguage: "TypeScript",
			analysisStatus: "complete",
		});
		expect(getTopRepositoriesByStars).toHaveBeenCalledWith(10);
	});

	it("should respect custom limit parameter", async () => {
		(getTopRepositoriesByStars as Mock).mockResolvedValueOnce([]);

		const request = new Request("http://localhost/repos/top?limit=5");
		await reposRoute.handle(request);

		expect(getTopRepositoriesByStars).toHaveBeenCalledWith(5);
	});

	it("should handle null values gracefully", async () => {
		(getTopRepositoriesByStars as Mock).mockResolvedValueOnce([
			{
				id: "repo-1",
				owner: "owner1",
				name: "repo1",
				fullName: "owner1/repo1",
				description: null,
				stars: null,
				forks: null,
				contributorCount: null,
				primaryLanguage: null,
				analysisStatus: "complete",
			},
		]);

		const request = new Request("http://localhost/repos/top");
		const response = await reposRoute.handle(request);
		const body = await response.json();

		expect(body[0].stars).toBe(0);
		expect(body[0].forks).toBe(0);
		expect(body[0].contributorCount).toBe(0);
	});
});
