import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import {
	getLatestAnalysis,
	insertAnalysisResults,
} from "~/server/dal/analysis";
import { db } from "~/server/db";

vi.mock("~/server/db");

describe("Analysis DAL", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("insertAnalysisResults", () => {
		it("should insert analysis results and return the result", async () => {
			const mockResult = {
				id: "result-1",
				repositoryId: "repo-123",
				s3StorageKey: "test-key",
				totalFiles: 100,
				totalDirectories: 10,
				totalLines: 5000,
			};

			(db.insert as Mock).mockReturnValue({
				values: vi.fn().mockReturnValue({
					onConflictDoUpdate: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([mockResult]),
					}),
				}),
			});

			const result = await insertAnalysisResults({
				repositoryId: "repo-123",
				s3StorageKey: "test-key",
				totalFiles: 100,
				totalDirectories: 10,
				totalLines: 5000,
			});

			expect(result).toEqual(mockResult);
		});

		it("should update existing analysis results on conflict", async () => {
			const mockResult = {
				id: "result-1",
				repositoryId: "repo-123",
				s3StorageKey: "updated-key",
				totalFiles: 200,
			};

			(db.insert as Mock).mockReturnValue({
				values: vi.fn().mockReturnValue({
					onConflictDoUpdate: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([mockResult]),
					}),
				}),
			});

			const result = await insertAnalysisResults({
				repositoryId: "repo-123",
				s3StorageKey: "updated-key",
				totalFiles: 200,
			});

			expect(result?.s3StorageKey).toBe("updated-key");
		});
	});

	describe("getLatestAnalysis", () => {
		it("should return the latest analysis result for a repo", async () => {
			const mockResult = {
				id: "result-1",
				repositoryId: "repo-123",
				s3StorageKey: "test-key",
				createdAt: new Date(),
			};

			(db.select as Mock).mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						orderBy: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([mockResult]),
						}),
					}),
				}),
			});

			const result = await getLatestAnalysis("repo-123");

			expect(result).toEqual(mockResult);
		});

		it("should return undefined if no analysis exists", async () => {
			(db.select as Mock).mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						orderBy: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([]),
						}),
					}),
				}),
			});

			const result = await getLatestAnalysis("repo-123");

			expect(result).toBeUndefined();
		});
	});
});
