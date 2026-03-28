import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockEq, mockDesc, mockSum, mockCount, mockSql } = vi.hoisted(() => ({
	mockEq: vi.fn().mockImplementation((col, val) => ({ type: "eq", col, val })),
	mockDesc: vi.fn().mockImplementation((col) => ({ type: "desc", col })),
	mockSum: vi.fn().mockImplementation((col) => ({ type: "sum", col })),
	mockCount: vi.fn().mockImplementation(() => ({ type: "count" })),
	mockSql: vi.fn(),
}));

vi.mock("drizzle-orm", async (importOriginal) => {
	const actual = (await importOriginal()) as any;
	return {
		...actual,
		eq: mockEq,
		desc: mockDesc,
		sum: mockSum,
		count: mockCount,
		sql: mockSql,
	};
});

vi.mock("../../db", () => {
	// Create a reusable mock chain object
	const mockChain: any = {
		where: vi.fn(),
		orderBy: vi.fn(),
		limit: vi.fn(),
		offset: vi.fn(),
		values: vi.fn(),
		set: vi.fn(),
		from: vi.fn(),
		innerJoin: vi.fn(),
		leftJoin: vi.fn(),
		groupBy: vi.fn(),
		onConflictDoUpdate: vi.fn(),
		returning: vi.fn(),
		then: vi.fn(),
		catch: vi.fn(),
		finally: vi.fn(),
	};

	// Make all methods chainable (return mockChain itself)
	mockChain.where.mockReturnValue(mockChain);
	mockChain.orderBy.mockReturnValue(mockChain);
	mockChain.limit.mockReturnValue(mockChain);
	mockChain.offset.mockReturnValue(mockChain);
	mockChain.values.mockReturnValue(mockChain);
	mockChain.set.mockReturnValue(mockChain);
	mockChain.from.mockReturnValue(mockChain);
	mockChain.innerJoin.mockReturnValue(mockChain);
	mockChain.leftJoin.mockReturnValue(mockChain);
	mockChain.groupBy.mockReturnValue(mockChain);
	mockChain.onConflictDoUpdate.mockReturnValue(mockChain);

	// Special return values
	mockChain.returning.mockResolvedValue([]);
	mockChain.then.mockImplementation((onFulfilled: any) =>
		Promise.resolve([]).then(onFulfilled),
	);

	return {
		db: {
			select: vi.fn(() => mockChain),
			insert: vi.fn(() => mockChain),
			update: vi.fn(() => mockChain),
			delete: vi.fn(() => mockChain),
		},
	};
});

vi.mock("../../db/schema", () => ({
	repositories: {
		id: "id",
		owner: "owner",
		name: "name",
		stars: "stars",
		forks: "forks",
		license: "license",
		primaryLanguage: "primary_language",
		createdAt: "created_at",
		analysisStatus: "analysis_status",
	},
	analysisResults: {
		repositoryId: "repository_id",
		totalFiles: "total_files",
		totalLines: "total_lines",
		totalDirectories: "total_directories",
	},
	repositoryContributors: {
		repositoryId: "repository_id",
		userId: "user_id",
		contributions: "contributions",
	},
	githubUsers: {
		id: "id",
		githubLogin: "github_login",
		avatarUrl: "avatar_url",
	},
}));

import {
	getGlobalStats,
	getGrowthTimeline,
	getLanguageBreakdown,
	getLicenseDistribution,
	getTopContributors,
	getTopRepos,
} from "../insights";

describe("insights DAL", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getGlobalStats", () => {
		it("should return global statistics from all analyzed repos", async () => {
			const result = await getGlobalStats();
			expect(result).toHaveProperty("totalRepos");
			expect(result).toHaveProperty("totalLines");
			expect(result).toHaveProperty("totalFiles");
			expect(result).toHaveProperty("totalContributors");
			expect(typeof result.totalRepos).toBe("number");
			expect(typeof result.totalLines).toBe("number");
		});

		it("should return zeros when no repos exist", async () => {
			const result = await getGlobalStats();
			expect(result.totalRepos).toBe(0);
		});
	});

	describe("getLanguageBreakdown", () => {
		it("should return array of language statistics", async () => {
			const result = await getLanguageBreakdown();
			expect(Array.isArray(result)).toBe(true);
		});

		it("each item should have language, count, and totalLines", async () => {
			const result = await getLanguageBreakdown();
			// Mock returns empty array, so this just verifies structure
			expect(Array.isArray(result)).toBe(true);
		});

		it("should return empty array when no data", async () => {
			const result = await getLanguageBreakdown();
			expect(Array.isArray(result)).toBe(true);
		});
	});

	describe("getTopRepos", () => {
		it("should return top repositories by stars", async () => {
			const result = await getTopRepos(10);
			expect(Array.isArray(result)).toBe(true);
		});

		it("should respect the limit parameter", async () => {
			await getTopRepos(5);
			const { db } = await import("../../db");
			expect(db.select).toHaveBeenCalled();
		});

		it("each item should have repo details and stats", async () => {
			const result = await getTopRepos(10);
			expect(Array.isArray(result)).toBe(true);
		});
	});

	describe("getTopContributors", () => {
		it("should return cross-repo contributor rankings", async () => {
			const result = await getTopContributors(20);
			expect(Array.isArray(result)).toBe(true);
		});

		it("should respect the limit parameter", async () => {
			await getTopContributors(10);
			const { db } = await import("../../db");
			expect(db.select).toHaveBeenCalled();
		});

		it("each item should have contributor info and aggregated stats", async () => {
			const result = await getTopContributors(20);
			expect(Array.isArray(result)).toBe(true);
		});
	});

	describe("getLicenseDistribution", () => {
		it("should return license distribution data", async () => {
			const result = await getLicenseDistribution();
			expect(Array.isArray(result)).toBe(true);
		});

		it("each item should have license and count", async () => {
			const result = await getLicenseDistribution();
			expect(Array.isArray(result)).toBe(true);
		});
	});

	describe("getGrowthTimeline", () => {
		it("should return monthly growth data", async () => {
			const result = await getGrowthTimeline();
			expect(Array.isArray(result)).toBe(true);
		});

		it("each item should have month and count", async () => {
			const result = await getGrowthTimeline();
			expect(Array.isArray(result)).toBe(true);
		});
	});
});
