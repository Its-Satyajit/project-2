import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import {
	deleteOldAnalysisData,
	deleteOldLogs,
	getLogsByRepoId,
	getRecentLogs,
	insertLog,
} from "~/server/dal/analysisLogs";
import { db } from "~/server/db";

vi.mock("~/server/db");

describe("Analysis Logs DAL", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("insertLog", () => {
		it("should insert a log entry", async () => {
			(db.insert as Mock).mockReturnValue({
				values: vi.fn().mockResolvedValue([]),
			});

			await insertLog({
				repositoryId: "repo-123",
				event: "test.event",
				status: "success",
				phase: "testing",
				message: "Test message",
			});

			expect(db.insert).toHaveBeenCalled();
		});
	});

	describe("getLogsByRepoId", () => {
		it("should return logs for a repository", async () => {
			const mockLogs = [
				{ id: "log-1", repositoryId: "repo-123", message: "Test 1" },
				{ id: "log-2", repositoryId: "repo-123", message: "Test 2" },
			];

			(db.select as Mock).mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						orderBy: vi.fn().mockResolvedValue(mockLogs),
					}),
				}),
			});

			const result = await getLogsByRepoId("repo-123");

			expect(result).toEqual(mockLogs);
		});
	});

	describe("getRecentLogs", () => {
		it("should return logs from the last N days", async () => {
			const mockLogs = [{ id: "log-1", message: "Recent log" }];

			(db.select as Mock).mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						orderBy: vi.fn().mockResolvedValue(mockLogs),
					}),
				}),
			});

			const result = await getRecentLogs(7);

			expect(result).toEqual(mockLogs);
		});
	});

	describe("deleteOldLogs", () => {
		it("should delete logs older than specified days", async () => {
			(db.delete as Mock).mockReturnValue({
				where: vi.fn().mockReturnValue({
					returning: vi
						.fn()
						.mockResolvedValue([{ id: "log-1" }, { id: "log-2" }]),
				}),
			});

			const result = await deleteOldLogs(7);

			expect(result).toBe(2);
		});

		it("should return 0 if no logs to delete", async () => {
			(db.delete as Mock).mockReturnValue({
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([]),
				}),
			});

			const result = await deleteOldLogs(7);

			expect(result).toBe(0);
		});
	});

	describe("deleteOldAnalysisData", () => {
		it("should return zeros if no old repos exist", async () => {
			(db.select as Mock).mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([]),
				}),
			});

			const result = await deleteOldAnalysisData(7);

			expect(result).toEqual({
				deletedRepos: 0,
				deletedResults: 0,
				deletedLogs: 0,
			});
		});

		it("should delete old repos and related data", async () => {
			const oldRepos = [{ id: "repo-old" }];

			(db.select as Mock).mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(oldRepos),
				}),
			});

			(db.delete as Mock)
				.mockReturnValueOnce({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([{ id: "log-1" }]),
					}),
				})
				.mockReturnValueOnce({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([{ id: "result-1" }]),
					}),
				})
				.mockReturnValueOnce({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([{ id: "repo-old" }]),
					}),
				});

			const result = await deleteOldAnalysisData(7);

			expect(result).toEqual({
				deletedRepos: 1,
				deletedResults: 1,
				deletedLogs: 1,
			});
		});
	});
});
