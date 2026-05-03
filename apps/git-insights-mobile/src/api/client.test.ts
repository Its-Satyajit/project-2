import type { AxiosInstance } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	api,
	type Contributor,
	type DashboardData,
	type RepoStatus,
	type Repository,
	setApiClient,
} from "../api/client";

describe("API Client", () => {
	let mockClient: AxiosInstance;

	beforeEach(() => {
		mockClient = {
			get: vi.fn().mockResolvedValue({ data: [] }),
			post: vi.fn(),
			put: vi.fn(),
			delete: vi.fn(),
			interceptors: {
				request: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
				response: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
			},
		} as unknown as AxiosInstance;
		setApiClient(mockClient);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("getTopRepos", () => {
		it("should fetch top repositories with default limit", async () => {
			const mockRepos: Repository[] = [
				{
					id: "1",
					owner: "facebook",
					name: "react",
					fullName: "facebook/react",
					description: "A declarative UI library",
					stars: 220000,
					forks: 47000,
					contributorCount: 1000,
					primaryLanguage: "JavaScript",
					analysisStatus: "complete",
				},
			];
			mockClient.get = vi.fn().mockResolvedValue({ data: mockRepos });

			const result = await api.getTopRepos();

			expect(mockClient.get).toHaveBeenCalledWith("/repos/top", {
				params: { limit: 10 },
			});
			expect(result).toEqual(mockRepos);
		});

		it("should fetch top repositories with custom limit", async () => {
			mockClient.get = vi.fn().mockResolvedValue({ data: [] });

			await api.getTopRepos(5);

			expect(mockClient.get).toHaveBeenCalledWith("/repos/top", {
				params: { limit: 5 },
			});
		});
	});

	describe("searchRepos", () => {
		it("should search repositories with query", async () => {
			const mockRepos: Repository[] = [
				{
					id: "2",
					owner: "vercel",
					name: "next.js",
					fullName: "vercel/next.js",
					description: "The React Framework",
					stars: 115000,
					forks: 25000,
					contributorCount: 2000,
					primaryLanguage: "TypeScript",
					analysisStatus: "complete",
				},
			];
			mockClient.get = vi.fn().mockResolvedValue({ data: mockRepos });

			const result = await api.searchRepos("next.js");

			expect(mockClient.get).toHaveBeenCalledWith("/repos/search", {
				params: { q: "next.js", limit: 10 },
			});
			expect(result).toEqual(mockRepos);
		});

		it("should handle empty query returning empty array", async () => {
			mockClient.get = vi.fn().mockResolvedValue({ data: [] });

			const result = await api.searchRepos("");

			expect(mockClient.get).toHaveBeenCalled();
			expect(result).toEqual([]);
		});
	});

	describe("getDashboard", () => {
		it("should fetch dashboard data for a repository", async () => {
			const mockDashboard: DashboardData = {
				id: "1",
				owner: "facebook",
				name: "react",
				fullName: "facebook/react",
				description: "A declarative UI library",
				url: "https://github.com/facebook/react",
				defaultBranch: "main",
				primaryLanguage: "JavaScript",
				isPrivate: false,
				stars: 220000,
				forks: 47000,
				avatarUrl: "https://avatars.githubusercontent.com/u/69631",
				analysisStatus: "complete",
				analysisPhase: null,
				fileTree: [],
				contributorCount: 1000,
				totalFiles: 500,
				totalDirectories: 50,
				totalLines: 100000,
			};
			mockClient.get = vi.fn().mockResolvedValue({ data: mockDashboard });

			const result = await api.getDashboard("1");

			expect(mockClient.get).toHaveBeenCalledWith("/dashboard/1");
			expect(result).toEqual(mockDashboard);
		});
	});

	describe("getStatus", () => {
		it("should fetch status for a repository", async () => {
			const mockStatus: RepoStatus = {
				repoId: "1",
				status: "complete",
				phase: null,
				metadata: {
					owner: "facebook",
					name: "react",
					fullName: "facebook/react",
					description: "A declarative UI library",
					defaultBranch: "main",
					primaryLanguage: "JavaScript",
					isPrivate: false,
					stars: 220000,
					forks: 47000,
					avatarUrl: "https://avatars.githubusercontent.com/u/69631",
				},
				analysis: {
					totalFiles: 500,
					totalDirectories: 50,
					totalLines: 100000,
					summary: { total: 100000 },
				},
			};
			mockClient.get = vi.fn().mockResolvedValue({ data: mockStatus });

			const result = await api.getStatus("1");

			expect(mockClient.get).toHaveBeenCalledWith("/dashboard/1/status");
			expect(result).toEqual(mockStatus);
		});
	});

	describe("getContributors", () => {
		it("should fetch contributors with default sorting", async () => {
			const mockContributors: Contributor[] = [
				{
					id: "1",
					githubLogin: "gaearon",
					avatarUrl: "https://avatars.githubusercontent.com/u/810438",
					htmlUrl: "https://github.com/gaearon",
					contributions: 500,
					firstContributionAt: "2013-05-01T00:00:00.000Z",
					lastContributionAt: "2024-01-01T00:00:00.000Z",
				},
			];
			mockClient.get = vi.fn().mockResolvedValue({ data: mockContributors });

			const result = await api.getContributors("1");

			expect(mockClient.get).toHaveBeenCalledWith("/repos/1/contributors", {
				params: { sort: "contributions", limit: 100 },
			});
			expect(result).toEqual(mockContributors);
		});

		it("should support newest sort order", async () => {
			mockClient.get = vi.fn().mockResolvedValue({ data: [] });

			await api.getContributors("1", "newest", 50);

			expect(mockClient.get).toHaveBeenCalledWith("/repos/1/contributors", {
				params: { sort: "newest", limit: 50 },
			});
		});
	});
});
