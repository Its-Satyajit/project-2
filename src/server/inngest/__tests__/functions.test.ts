import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

// Mock dependencies
vi.mock("../client", () => ({
    inngest: {
        createFunction: vi.fn().mockImplementation((config, trigger, handler) => ({ config, trigger, handler })),
    },
}));

vi.mock("../../octokit", () => ({
    getRepoTree: vi.fn(),
    getRepoCommits: vi.fn(),
    getRepoContributors: vi.fn(),
    getFileContentFromRaw: vi.fn(),
}));

vi.mock("../../dal/s3", () => ({
    uploadAnalysisData: vi.fn().mockResolvedValue("mock-s3-key"),
}));

vi.mock("../../dal/analysis", () => ({
    getLatestAnalysis: vi.fn(),
    insertAnalysisResults: vi.fn(),
}));

vi.mock("../../dal/analysisLogs", () => ({
    insertLog: vi.fn(),
}));

vi.mock("../../dal/repositories", () => ({
    updateRepositoryStatus: vi.fn(),
}));

vi.mock("../../dal/contributors", () => ({
    deleteContributorsByRepoId: vi.fn(),
    upsertContributors: vi.fn(),
}));

import { coreAnalysisLogic } from "../functions";

describe("Inngest Functions - coreAnalysisLogic", () => {
    let mockStep: {
        run: Mock<any>;
        updateProgress?: Mock<any>;
    };
    const testData = {
        repoId: "repo-123",
        owner: "test-owner",
        repo: "test-repo",
        branch: "main",
        githubUrl: "https://github.com/test-owner/test-repo",
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockStep = {
            run: vi.fn().mockImplementation((_, fn) => fn()),
        };
    });

    it("should skip analysis if performed in the last 24 hours", async () => {
        const { getLatestAnalysis } = await import("../../dal/analysis");
        (getLatestAnalysis as Mock<any>).mockResolvedValueOnce({
            createdAt: new Date().toISOString(),
        } as unknown);

        const result = await coreAnalysisLogic(testData, mockStep as any);

        expect(result.skipped).toBe(true);
        expect(result.reason).toBe("Analyzed less than 24 hours ago");
    });

    it("should run complete analysis if no recent analysis found", async () => {
        const { getLatestAnalysis } = await import("../../dal/analysis");
        const { getRepoTree, getRepoCommits, getRepoContributors } = await import("../../octokit");
        
        (getLatestAnalysis as Mock<any>).mockResolvedValueOnce(null);
        (getRepoTree as Mock<any>).mockResolvedValueOnce([]);
        (getRepoCommits as Mock<any>).mockResolvedValueOnce([]);
        (getRepoContributors as Mock<any>).mockResolvedValueOnce([]);

        const result = await coreAnalysisLogic(testData, mockStep as any);

        expect(result.success).toBe(true);
        expect(result.repoId).toBe("repo-123");
        expect(mockStep.run).toHaveBeenCalledWith("fetch-repo-data", expect.any(Function));
    });
});
