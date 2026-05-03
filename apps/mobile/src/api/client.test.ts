
import { describe, expect, it, vi } from "vitest";
import type {
	AlertItem,
	Contributor,
	DashboardData,
	FileContent,
	HotspotData,
	RepoStatus,
	Repository,
	TreemapData,
} from "@git-insights/api";

vi.mock("@react-native-async-storage/async-storage", () => ({
	default: {
		getItem: vi.fn().mockResolvedValue(null),
		setItem: vi.fn().mockResolvedValue(null),
		removeItem: vi.fn().mockResolvedValue(null),
	},
	getItem: vi.fn().mockResolvedValue(null),
	setItem: vi.fn().mockResolvedValue(null),
	removeItem: vi.fn().mockResolvedValue(null),
}));


vi.mock("../api/client", async (importActual) => {
	const actual = await importActual<typeof import("../api/client")>();
	const mockApi: Record<string, any> = {
		getTopRepos: vi.fn().mockResolvedValue([]),
		searchRepos: vi.fn().mockResolvedValue([]),
		getDashboard: vi.fn(),
		getStatus: vi.fn(),
		getContributors: vi.fn().mockResolvedValue([]),
		getTreemap: vi.fn(),
		getHotspots: vi.fn(),
		getFileContent: vi.fn(),
		getAlerts: vi.fn().mockResolvedValue([]),
		analyzeRepo: vi.fn(),
	};
	return {
		...actual,
		getApiClient: () => Promise.resolve(mockApi),
		createApiClient: () => Promise.resolve(mockApi),
		api: mockApi,
		default: mockApi,
	};
});

import { api } from "../api/client";

describe("API Client", () => {
	describe("getTopRepos", () => {
		it("should fetch top repositories", async () => {
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
			(api.getTopRepos as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
				mockRepos,
			);

			const result = await api.getTopRepos(10);

			expect(result).toEqual(mockRepos);
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
			(api.searchRepos as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
				mockRepos,
			);

			const result = await api.searchRepos("next.js", 10);

			expect(result).toEqual(mockRepos);
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
			(api.getDashboard as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
				mockDashboard,
			);

			const result = await api.getDashboard("1");

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
			(api.getStatus as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
				mockStatus,
			);

			const result = await api.getStatus("1");

			expect(result).toEqual(mockStatus);
		});
	});

	describe("getContributors", () => {
		it("should fetch contributors", async () => {
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
			(
				api.getContributors as ReturnType<typeof vi.fn>
			).mockResolvedValueOnce(mockContributors);

			const result = await api.getContributors("1", "contributions", 100);

			expect(result).toEqual(mockContributors);
		});
	});

	describe("getTreemap", () => {
		it("should fetch treemap data for a repository", async () => {
			const mockTreemap: TreemapData = {
				files: [
					{
						id: "1",
						path: "src/index.ts",
						loc: 150,
						extension: ".ts",
						hotspotScore: 45,
						fanIn: 10,
						fanOut: 5,
						isExternal: false,
					},
				],
				totalFiles: 1,
				totalLoc: 150,
			};
			(api.getTreemap as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
				mockTreemap,
			);

			const result = await api.getTreemap("1");

			expect(result).toEqual(mockTreemap);
		});
	});

	describe("getHotspots", () => {
		it("should fetch hotspot data for a repository", async () => {
			const mockHotspots: HotspotData[] = [
				{
					file: "src/core/renderer.ts",
					score: 85,
					churn: 42,
					lines: 500,
					dependencies: 12,
				},
			];
			(api.getHotspots as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
				mockHotspots,
			);

			const result = await api.getHotspots("1");

			expect(result).toEqual(mockHotspots);
		});
	});

	describe("getFileContent", () => {
		it("should fetch file content", async () => {
			const mockFile: FileContent = {
				path: "src/index.ts",
				content: "export default function() {}",
				extension: ".ts",
				size: 1024,
				lines: 25,
			};
			(api.getFileContent as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
				mockFile,
			);

			const result = await api.getFileContent("1", "src/index.ts");

			expect(result).toEqual(mockFile);
		});
	});

	describe("getAlerts", () => {
		it("should fetch all alerts", async () => {
			const mockAlerts: AlertItem[] = [
				{
					id: "1",
					type: "ci_failure",
					title: "Build Failed",
					message: "CI pipeline failed on main",
					timestamp: "2024-01-01T00:00:00.000Z",
					read: false,
				},
			];
			(api.getAlerts as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
				mockAlerts,
			);

			const result = await api.getAlerts();

			expect(result).toEqual(mockAlerts);
		});
	});

	describe("analyzeRepo", () => {
		it("should submit a repo for analysis", async () => {
			(api.analyzeRepo as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				success: true,
				repoId: "1",
				status: "queued",
			});

			const result = await api.analyzeRepo({
				githubUrl: "https://github.com/facebook/react",
			});

			expect(result).toEqual({ success: true, repoId: "1", status: "queued" });
		});
	});
});
