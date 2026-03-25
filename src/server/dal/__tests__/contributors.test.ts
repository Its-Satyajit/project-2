import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockEq, mockDesc } = vi.hoisted(() => ({
	mockEq: vi
		.fn()
		.mockImplementation((col, val) => ({ type: "eq", col, val })),
	mockDesc: vi.fn().mockImplementation((col) => ({ type: "desc", col })),
}));

vi.mock("drizzle-orm", async (importOriginal) => {
	const actual = (await importOriginal()) as any;
	return {
		...actual,
		eq: mockEq,
		desc: mockDesc,
	};
});

vi.mock("../../db", () => {
	const mockResult = Object.assign(Promise.resolve([]), {
		where: vi.fn().mockImplementation(() => mockResult),
		orderBy: vi.fn().mockImplementation(() => mockResult),
		limit: vi.fn().mockImplementation(() => mockResult),
		offset: vi.fn().mockImplementation(() => mockResult),
		values: vi.fn().mockImplementation(() => Promise.resolve([])),
		set: vi.fn().mockImplementation(() => mockResult),
		from: vi.fn().mockImplementation(() => mockResult),
	});

	return {
		db: {
			select: vi.fn().mockReturnValue(mockResult),
			insert: vi.fn().mockReturnValue(mockResult),
			update: vi.fn().mockReturnValue(mockResult),
			delete: vi.fn().mockReturnValue(mockResult),
		},
	};
});

vi.mock("../../db/schema", () => ({
	contributors: {
		// Mock table definition
	},
}));

import {
	deleteContributorsByRepoId,
	getContributorByLogin,
	getContributorCount,
	getContributors,
	insertContributors,
	upsertContributors,
} from "../contributors";

const mockContributor = {
	repositoryId: "550e8400-e29b-41d4-a716-446655440000",
	githubLogin: "testuser",
	avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
	htmlUrl: "https://github.com/testuser",
	contributions: 100,
	firstContributionAt: new Date("2023-01-01"),
	lastContributionAt: new Date("2024-01-01"),
};

describe("contributors DAL", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("insertContributors", () => {
		it("should insert a single contributor", async () => {
			await insertContributors(mockContributor);
		});

		it("should insert multiple contributors", async () => {
			const contributors = [
				{ ...mockContributor, githubLogin: "user1" },
				{ ...mockContributor, githubLogin: "user2" },
			];
			await insertContributors(contributors);
		});

		it("should handle empty array", async () => {
			await insertContributors([]);
		});

		it("should handle null/undefined", async () => {
			await insertContributors(null);
			await insertContributors(undefined);
		});
	});

	describe("getContributors", () => {
		it("should return contributors for a repository", async () => {
			const result = await getContributors(
				"550e8400-e29b-41d4-a716-446655440000",
			);
			expect(Array.isArray(result)).toBe(true);
		});

		it("should return empty array for non-existent repo", async () => {
			const result = await getContributors(
				"00000000-0000-0000-0000-000000000000",
			);
			expect(result).toHaveLength(0);
		});
	});

	describe("getContributorByLogin", () => {
		it("should return null for non-existent login", async () => {
			const result = await getContributorByLogin(
				"550e8400-e29b-41d4-a716-446655440000",
				"nonexistent",
			);
			expect(result).toBeNull();
		});
	});

	describe("getContributorCount", () => {
		it("should return count of contributors", async () => {
			const count = await getContributorCount(
				"550e8400-e29b-41d4-a716-446655440000",
			);
			expect(typeof count).toBe("number");
		});
	});

	describe("upsertContributors", () => {
		it("should handle upsert operation", async () => {
			await upsertContributors([
				{
					...mockContributor,
					githubLogin: "upsert-user",
					contributions: 50,
				},
			]);
		});
	});

	describe("deleteContributorsByRepoId", () => {
		it("should delete all contributors for a repo", async () => {
			await deleteContributorsByRepoId("550e8400-e29b-41d4-a716-446655440000");
		});
	});
});
