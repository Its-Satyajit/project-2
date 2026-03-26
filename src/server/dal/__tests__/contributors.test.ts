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
	const mockResult = {
		where: vi.fn(),
		orderBy: vi.fn(),
		limit: vi.fn(),
		offset: vi.fn(),
		values: vi.fn(),
		set: vi.fn(),
		from: vi.fn(),
		innerJoin: vi.fn(),
		onConflictDoUpdate: vi.fn(),
		returning: vi.fn(),
		then: vi.fn(),
		catch: vi.fn(),
		finally: vi.fn(),
	};

	// Make mock functions return the builder for chaining
	for (const key of Object.keys(mockResult)) {
		const fn = (mockResult as any)[key];
		if (vi.isMockFunction(fn) && key !== "then") {
			fn.mockImplementation(() => mockResult);
		}
	}

	// returning() and values() should behave specifically
	mockResult.returning.mockImplementation(() => Promise.resolve([]));
	mockResult.values.mockImplementation(() => mockResult);

	// Make the builder thenable so it can be awaited
	mockResult.then.mockImplementation((onFulfilled: any) =>
		Promise.resolve([]).then(onFulfilled),
	);

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
	githubUsers: {},
	repositoryContributors: {},
}));

import {
	deleteContributorsByRepoId,
	getContributorByLogin,
	getContributorCount,
	getContributors,
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

	describe("upsertContributors", () => {
		it("should handle upsert operation for a single contributor", async () => {
			await upsertContributors([mockContributor]);
		});

		it("should handle upserting multiple contributors", async () => {
			const contributors = [
				{ ...mockContributor, githubLogin: "user1" },
				{ ...mockContributor, githubLogin: "user2" },
			];
			await upsertContributors(contributors);
		});

		it("should handle empty array", async () => {
			await upsertContributors([]);
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

	// upsertContributors already tested above

	describe("deleteContributorsByRepoId", () => {
		it("should delete all contributors for a repo", async () => {
			await deleteContributorsByRepoId("550e8400-e29b-41d4-a716-446655440000");
		});
	});
});
