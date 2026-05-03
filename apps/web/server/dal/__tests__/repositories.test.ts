import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import {
	getRepositoryByOwnerAndName,
	getRepositoryData,
	getTopRepositoriesByStars,
	insertRepositories,
	updateRepositoryStatus,
} from "~/server/dal/repositories";
import { db } from "~/server/db";

vi.mock("~/server/db");

describe("Repositories DAL", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("insertRepositories", () => {
		it("should insert a repository and return it", async () => {
			const mockRepo = {
				id: "repo-123",
				owner: "test-owner",
				name: "test-repo",
				fullName: "test-owner/test-repo",
			};

			(db.insert as Mock).mockReturnValue({
				values: vi.fn().mockReturnValue({
					onConflictDoUpdate: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([mockRepo]),
					}),
				}),
			});

			const result = await insertRepositories({
				owner: "test-owner",
				name: "test-repo",
				fullName: "test-owner/test-repo",
			});

			expect(result).toEqual(mockRepo);
		});
	});

	describe("getRepositoryData", () => {
		it("should return repository with analysis results", async () => {
			const mockRepo = {
				id: "repo-123",
				owner: "test-owner",
				name: "test-repo",
				analysisStatus: "complete",
				analysisResults: [{ id: "result-1", s3StorageKey: "key" }],
			};

			db.query = {
				repositories: {
					findFirst: vi.fn().mockResolvedValue(mockRepo),
				},
			} as any;

			const result = await getRepositoryData("repo-123");

			expect(result).toEqual(mockRepo);
			expect(db.query.repositories.findFirst).toHaveBeenCalled();
		});

		it("should return null if repository not found", async () => {
			db.query = {
				repositories: {
					findFirst: vi.fn().mockResolvedValue(null),
				},
			} as any;

			const result = await getRepositoryData("nonexistent");

			expect(result).toBeNull();
		});
	});

	describe("getRepositoryByOwnerAndName", () => {
		it("should return repository by owner and name", async () => {
			const mockRepo = {
				id: "repo-123",
				owner: "test-owner",
				name: "test-repo",
			};

			db.query = {
				repositories: {
					findFirst: vi.fn().mockResolvedValue(mockRepo),
				},
			} as any;

			const result = await getRepositoryByOwnerAndName(
				"test-owner",
				"test-repo",
			);

			expect(result).toEqual(mockRepo);
		});

		it("should return null if not found", async () => {
			db.query = {
				repositories: {
					findFirst: vi.fn().mockResolvedValue(null),
				},
			} as any;

			const result = await getRepositoryByOwnerAndName("unknown", "unknown");

			expect(result).toBeNull();
		});
	});

	describe("updateRepositoryStatus", () => {
		it("should update repository status and phase", async () => {
			(db.update as Mock).mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([]),
				}),
			});

			await updateRepositoryStatus("repo-123", "complete", "Analysis complete");

			expect(db.update).toHaveBeenCalled();
		});

		it("should update status without phase", async () => {
			(db.update as Mock).mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([]),
				}),
			});

			await updateRepositoryStatus("repo-123", "queued");

			expect(db.update).toHaveBeenCalled();
		});
	});

	describe("getTopRepositoriesByStars", () => {
		it("should return top repositories sorted by stars", async () => {
			const mockRepos = [
				{
					id: "repo-1",
					owner: "owner1",
					name: "repo1",
					fullName: "owner1/repo1",
					stars: 1000,
					contributors: [{ contributions: 5 }],
				},
				{
					id: "repo-2",
					owner: "owner2",
					name: "repo2",
					fullName: "owner2/repo2",
					stars: 500,
					contributors: [{ contributions: 3 }, { contributions: 2 }],
				},
			];

			db.query = {
				repositories: {
					findMany: vi.fn().mockResolvedValue(mockRepos),
				},
			} as any;

			const result = await getTopRepositoriesByStars(10);

			expect(result).toHaveLength(2);
			expect(result[0]?.contributorCount).toBe(1);
			expect(result[1]?.contributorCount).toBe(2);
		});

		it("should handle empty contributors array", async () => {
			const mockRepos = [
				{
					id: "repo-1",
					owner: "owner1",
					name: "repo1",
					fullName: "owner1/repo1",
					stars: 1000,
					contributors: [],
				},
			];

			db.query = {
				repositories: {
					findMany: vi.fn().mockResolvedValue(mockRepos),
				},
			} as any;

			const result = await getTopRepositoriesByStars(10);

			expect(result[0]?.contributorCount).toBe(0);
		});
	});
});
