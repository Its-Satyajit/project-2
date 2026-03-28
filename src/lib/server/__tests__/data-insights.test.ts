import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the insights DAL
vi.mock("~/server/dal/insights", () => ({
	getGlobalStats: vi.fn(),
	getLanguageBreakdown: vi.fn(),
	getTopRepos: vi.fn(),
	getTopContributors: vi.fn(),
	getLicenseDistribution: vi.fn(),
	getGrowthTimeline: vi.fn(),
	getStarDistribution: vi.fn(),
	getRepoSizeDistribution: vi.fn(),
	getTopLanguagesByLoc: vi.fn(),
	getStarsForksDistribution: vi.fn(),
	getFilesByLanguage: vi.fn(),
	getLanguageLocVsFiles: vi.fn(),
	getMostActiveContributors: vi.fn(),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
	cacheLife: vi.fn(),
	cacheTag: vi.fn(),
}));

import {
	getFilesByLanguage,
	getGlobalStats,
	getGrowthTimeline,
	getLanguageBreakdown,
	getLanguageLocVsFiles,
	getLicenseDistribution,
	getMostActiveContributors,
	getRepoSizeDistribution,
	getStarDistribution,
	getStarsForksDistribution,
	getTopContributors,
	getTopLanguagesByLoc,
	getTopRepos,
} from "~/server/dal/insights";

const mockStats = {
	totalRepos: 42,
	totalLines: 1500000,
	totalFiles: 8500,
	totalDirectories: 1200,
	totalContributors: 320,
	avgLinesPerRepo: 35714,
	avgFilesPerRepo: 202,
	avgLocPerFile: 176,
};

const mockLanguages = [
	{ language: "TypeScript", count: 20, totalLines: 800000 },
	{ language: "JavaScript", count: 15, totalLines: 400000 },
];

const mockTopRepos = [
	{
		id: "1",
		owner: "facebook",
		name: "react",
		fullName: "facebook/react",
		stars: 200000,
		forks: 40000,
		primaryLanguage: "JavaScript",
		totalLines: 150000,
		totalFiles: 500,
	},
];

const mockTopContributors = [
	{
		id: "u1",
		githubLogin: "torvalds",
		avatarUrl: "https://example.com/avatar.png",
		totalContributions: 5000,
		repoCount: 5,
	},
];

const mockLicenses = [
	{ license: "MIT", count: 25 },
	{ license: "Apache-2.0", count: 10 },
];

const mockTimeline = [
	{ month: "2024-01", count: 5 },
	{ month: "2024-02", count: 8 },
];

const mockStarDistribution = [
	{ range: "0-100", count: 20 },
	{ range: "100-1K", count: 15 },
	{ range: "1K-10K", count: 5 },
	{ range: "10K-100K", count: 2 },
	{ range: "100K+", count: 0 },
];

const mockRepoSizeDistribution = [
	{ size: "Tiny (<1K)", count: 5 },
	{ size: "Small (1K-10K)", count: 15 },
	{ size: "Medium (10K-100K)", count: 12 },
	{ size: "Large (100K-500K)", count: 8 },
	{ size: "Massive (500K+)", count: 2 },
];

const mockTopLanguagesByLoc = [
	{ language: "TypeScript", totalLines: 800000, repoCount: 20 },
	{ language: "JavaScript", totalLines: 400000, repoCount: 15 },
];

const mockStarsForksData = [
	{
		name: "react",
		owner: "facebook",
		stars: 200000,
		forks: 40000,
		language: "JavaScript",
	},
];

const mockFilesByLanguage = [
	{ language: "TypeScript", totalFiles: 5000, totalDirs: 800, repoCount: 20 },
	{ language: "JavaScript", totalFiles: 3000, totalDirs: 500, repoCount: 15 },
];

const mockLanguageLocVsFiles = [
	{ language: "TypeScript", loc: 800000, files: 5000, repos: 20 },
	{ language: "JavaScript", loc: 400000, files: 3000, repos: 15 },
];

const mockMostActiveContributors = [
	{
		githubLogin: "torvalds",
		avatarUrl: "https://example.com/avatar.png",
		repoCount: 8,
		totalContributions: 5000,
	},
];

describe("getCachedGlobalInsights", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getGlobalStats).mockResolvedValue(mockStats);
		vi.mocked(getLanguageBreakdown).mockResolvedValue(mockLanguages);
		vi.mocked(getTopRepos).mockResolvedValue(mockTopRepos);
		vi.mocked(getTopContributors).mockResolvedValue(mockTopContributors);
		vi.mocked(getLicenseDistribution).mockResolvedValue(mockLicenses);
		vi.mocked(getGrowthTimeline).mockResolvedValue(mockTimeline);
		vi.mocked(getStarDistribution).mockResolvedValue(mockStarDistribution);
		vi.mocked(getRepoSizeDistribution).mockResolvedValue(
			mockRepoSizeDistribution,
		);
		vi.mocked(getTopLanguagesByLoc).mockResolvedValue(mockTopLanguagesByLoc);
		vi.mocked(getStarsForksDistribution).mockResolvedValue(mockStarsForksData);
		vi.mocked(getFilesByLanguage).mockResolvedValue(mockFilesByLanguage);
		vi.mocked(getLanguageLocVsFiles).mockResolvedValue(mockLanguageLocVsFiles);
		vi.mocked(getMostActiveContributors).mockResolvedValue(
			mockMostActiveContributors,
		);
	});

	it("should return all insight data combined", async () => {
		const { getCachedGlobalInsights } = await import("~/lib/server/data");
		const result = await getCachedGlobalInsights();

		expect(result).toHaveProperty("stats");
		expect(result).toHaveProperty("languages");
		expect(result).toHaveProperty("topRepos");
		expect(result).toHaveProperty("topContributors");
		expect(result).toHaveProperty("licenses");
		expect(result).toHaveProperty("timeline");
		expect(result).toHaveProperty("starDistribution");
		expect(result).toHaveProperty("repoSizeDistribution");
		expect(result).toHaveProperty("topLanguagesByLoc");
		expect(result).toHaveProperty("starsForksData");
		expect(result).toHaveProperty("filesByLanguage");
		expect(result).toHaveProperty("languageLocVsFiles");
		expect(result).toHaveProperty("mostActiveContributors");
	});

	it("should call all DAL functions", async () => {
		const { getCachedGlobalInsights } = await import("~/lib/server/data");
		await getCachedGlobalInsights();

		expect(getGlobalStats).toHaveBeenCalled();
		expect(getLanguageBreakdown).toHaveBeenCalled();
		expect(getTopRepos).toHaveBeenCalled();
		expect(getTopContributors).toHaveBeenCalled();
		expect(getLicenseDistribution).toHaveBeenCalled();
		expect(getGrowthTimeline).toHaveBeenCalled();
		expect(getStarDistribution).toHaveBeenCalled();
		expect(getRepoSizeDistribution).toHaveBeenCalled();
		expect(getTopLanguagesByLoc).toHaveBeenCalled();
		expect(getStarsForksDistribution).toHaveBeenCalled();
		expect(getFilesByLanguage).toHaveBeenCalled();
		expect(getLanguageLocVsFiles).toHaveBeenCalled();
		expect(getMostActiveContributors).toHaveBeenCalled();
	});

	it("should return correct stats", async () => {
		const { getCachedGlobalInsights } = await import("~/lib/server/data");
		const result = await getCachedGlobalInsights();

		expect(result.stats).toEqual(mockStats);
	});

	it("should return correct languages", async () => {
		const { getCachedGlobalInsights } = await import("~/lib/server/data");
		const result = await getCachedGlobalInsights();

		expect(result.languages).toEqual(mockLanguages);
	});

	it("should return correct top repos", async () => {
		const { getCachedGlobalInsights } = await import("~/lib/server/data");
		const result = await getCachedGlobalInsights();

		expect(result.topRepos).toEqual(mockTopRepos);
	});
});
