import { beforeEach, describe, expect, it, vi } from "vitest";

const mockEq = vi
	.fn()
	.mockImplementation((col, val) => ({ type: "eq", col, val }));
const mockDesc = vi.fn().mockImplementation((col) => ({ type: "desc", col }));

vi.mock("drizzle-orm", () => ({
	eq: mockEq,
	desc: mockDesc,
}));

vi.mock("../db", () => ({
	db: {
		select: vi.fn().mockReturnValue({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					orderBy: vi.fn().mockResolvedValue([]),
				}),
			}),
		}),
		insert: vi.fn().mockReturnValue({
			values: vi.fn().mockResolvedValue(undefined),
		}),
		update: vi.fn().mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue(undefined),
			}),
		}),
		delete: vi.fn().mockReturnValue({
			where: vi.fn().mockResolvedValue(undefined),
		}),
	},
}));

vi.mock("../db/schema", () => ({
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
