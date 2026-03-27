import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

// Mock dependencies
vi.mock("../client", () => ({
	inngest: {
		createFunction: vi.fn().mockImplementation((config, trigger, handler) => ({
			config,
			trigger,
			handler,
		})),
	},
}));

vi.mock("simple-git", () => ({
	simpleGit: vi.fn().mockReturnValue({
		clone: vi.fn().mockResolvedValue({}),
	}),
}));

vi.mock("node:fs/promises", () => ({
	default: {
		mkdir: vi.fn().mockResolvedValue(undefined),
		rm: vi.fn().mockResolvedValue(undefined),
		readFile: vi.fn().mockResolvedValue("mock file content"),
	},
}));

vi.mock("../../octokit", () => ({
	getRepoTree: vi.fn(),
	getRepoCommits: vi.fn(),
	getRepoContributors: vi.fn(),
	getFileContentFromRaw: vi.fn(),
	getCommitDetails: vi.fn().mockResolvedValue({ files: [] }),
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

vi.mock("../../logic/analysis", () => ({
	performBasicAnalysis: vi.fn().mockResolvedValue({
		totalFiles: 10,
		totalDirectories: 2,
		totalLines: 100,
		totalCodeFiles: 5,
		fileTypeBreakdown: { ts: 5 },
		fileTree: [],
	}),
}));

vi.mock("../../logic/dependencyAnalysis", () => ({
	detectLanguage: vi.fn().mockReturnValue("typescript"),
	performDependencyAnalysis: vi.fn().mockResolvedValue({
		graph: { nodes: [], edges: [] },
		processedFiles: 0,
		skippedFiles: 0,
	}),
}));

vi.mock("../../logic/hotspotAnalysis", () => ({
	performHotspotAnalysis: vi.fn().mockReturnValue({ hotspots: [] }),
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
		const { getRepoTree, getRepoCommits, getRepoContributors } = await import(
			"../../octokit"
		);

		(getLatestAnalysis as Mock<any>).mockResolvedValueOnce(null);
		(getRepoTree as Mock<any>).mockResolvedValueOnce([]);
		(getRepoCommits as Mock<any>).mockResolvedValueOnce([]);
		(getRepoContributors as Mock<any>).mockResolvedValueOnce([]);

		const result = await coreAnalysisLogic(testData, mockStep as any);

		expect(result.success).toBe(true);
		expect(result.repoId).toBe("repo-123");
		// Verify that step.run is NOT called anymore
		expect(mockStep.run).not.toHaveBeenCalled();
	});

	it("should perform shallow clone and read from local FS during dependency analysis", async () => {
		const { getLatestAnalysis } = await import("../../dal/analysis");
		const { getRepoTree, getRepoCommits, getRepoContributors } = await import(
			"../../octokit"
		);
		const { simpleGit } = await import("simple-git");
		const fs = (await import("node:fs/promises")).default;

		(getLatestAnalysis as Mock<any>).mockResolvedValue(null);
		(getRepoTree as Mock<any>).mockResolvedValue([
			{ path: "src/index.ts", type: "blob", size: 100, sha: "sha1" },
		]);
		(getRepoCommits as Mock<any>).mockResolvedValue([
			{
				sha: "sha-commit",
				commit: { message: "init", author: { name: "test" } },
			},
		]);
		(getRepoContributors as Mock<any>).mockResolvedValue([]);

		const result = await coreAnalysisLogic(testData, mockStep as any);

		expect(result.success).toBe(true);
		// Verify clone was called directly without step.run
		const gitMock = simpleGit();
		expect(gitMock.clone).toHaveBeenCalledWith(
			testData.githubUrl,
			expect.stringContaining(".tmp/repo-123"),
			expect.arrayContaining(["--depth", "1"]),
		);

		// Verify local file read was attempted
		expect(fs.readFile).toHaveBeenCalledWith(
			expect.stringContaining("src/index.ts"),
			"utf8",
		);

		// Verify cleanup was called
		expect(fs.rm).toHaveBeenCalledWith(
			expect.stringContaining(".tmp/repo-123"),
			expect.objectContaining({ recursive: true }),
		);
	});

	it("should fallback to API if local file read fails", async () => {
		const { getLatestAnalysis } = await import("../../dal/analysis");
		const { getRepoTree, getFileContentFromRaw } = await import(
			"../../octokit"
		);
		const fs = (await import("node:fs/promises")).default;

		(getLatestAnalysis as Mock<any>).mockResolvedValue(null);
		(getRepoTree as Mock<any>).mockResolvedValue([
			{ path: "src/index.ts", type: "blob", size: 100, sha: "sha1" },
		]);
		(fs.readFile as Mock<any>).mockRejectedValueOnce(
			new Error("File not found"),
		);
		(getFileContentFromRaw as Mock<any>).mockResolvedValueOnce("api-content");

		await coreAnalysisLogic(testData, mockStep as any);

		// Verify fallback to API
		expect(getFileContentFromRaw).toHaveBeenCalledWith(
			expect.objectContaining({
				path: "src/index.ts",
			}),
		);
	});
});
