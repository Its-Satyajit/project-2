import fs from "node:fs/promises";
import path from "node:path";
import { lt } from "drizzle-orm";
import { simpleGit } from "simple-git";
import { getExtension } from "~/lib/getExtension";
import { convertToFileTree } from "~/lib/treeUtils";
import { getLatestAnalysis, insertAnalysisResults } from "../dal/analysis";
import { insertLog } from "../dal/analysisLogs";
import {
	deleteContributorsByRepoId,
	upsertContributors,
} from "../dal/contributors";
import { updateRepositoryStatus } from "../dal/repositories";
import { uploadAnalysisData } from "../dal/s3";
import { db } from "../db";
import { analysisLogs } from "../db/schema";
import { performBasicAnalysis } from "../logic/analysis";
import {
	detectLanguage,
	type FileContent,
	performDependencyAnalysis,
} from "../logic/dependencyAnalysis";
import { performHotspotAnalysis } from "../logic/hotspotAnalysis";
import {
	getCommitDetails,
	getFileContentFromRaw,
	getRepoCommits,
	getRepoContributors,
	getRepoTree,
} from "../octokit";
import { inngest } from "./client";

const TEST_FILE_PATTERN = /(\btest\b|\bspec\b|__tests__|__mocks__)/i;

const CONTENT_MAX_SIZE = 50 * 1024;
const CODE_EXTENSIONS = [
	"ts",
	"tsx",
	"js",
	"jsx",
	"py",
	"go",
	"rs",
	"java",
	"c",
	"h",
	"cpp",
	"cc",
	"cxx",
	"c++",
	"hpp",
	"hh",
	"hxx",
	"h++",
	"cs",
	"kt",
	"kts",
	"swift",
	"php",
	"dart",
	"r",
	"rb",
	"m",
	"scala",
	"sh",
	"bash",
	"zsh",
	"jl",
	"mm",
	"asm",
	"s",
	"S",
	"groovy",
	"gradle",
	"hs",
	"lhs",
	"ex",
	"exs",
	"sql",
];

async function updateStatus(repoId: string, status: string, phase: string) {
	await updateRepositoryStatus(repoId, status, phase);
}

async function logEvent(
	repoId: string,
	event: string,
	status: string,
	phase: string,
	message?: string,
	metadata?: Record<string, unknown>,
	durationMs?: number,
) {
	await insertLog({
		repositoryId: repoId,
		event,
		status,
		phase,
		message,
		metadata,
		durationMs,
	});
}

// Core analysis logic that can be reused for Inngest or direct local execution
export async function coreAnalysisLogic(
	data: {
		repoId: string;
		owner: string;
		repo: string;
		branch: string;
		githubUrl: string;
	},
	_step: {
		run: <T>(name: string, fn: () => Promise<T>) => Promise<T>;
		updateProgress?: (p: number) => Promise<void>;
	},
) {
	const { repoId, owner, repo, branch } = data;

	const recentAnalysis = await getLatestAnalysis(repoId);
	if (recentAnalysis) {
		const hoursSinceLastAnalysis =
			(Date.now() - new Date(recentAnalysis.createdAt).getTime()) /
			(1000 * 60 * 60);
		if (hoursSinceLastAnalysis < 24) {
			await logEvent(
				repoId,
				"analysis.start",
				"skipped",
				"rate-limit",
				`Analyzed ${hoursSinceLastAnalysis.toFixed(1)} hours ago`,
			);
			return {
				success: true,
				repoId,
				skipped: true,
				reason: "Analyzed less than 24 hours ago",
			};
		}
	}

	await logEvent(
		repoId,
		"analysis.start",
		"started",
		"initializing",
		`Starting analysis for ${owner}/${repo}`,
	);

	// Bypass Turbopack static fs tracing
	const getCwd = () => process.cwd();
	const tmpPath = [getCwd(), ".tmp", repoId];
	const tempDir = tmpPath.join("/");

	async function safeCleanup(dir: string): Promise<void> {
		try {
			await fs.rm(dir, { recursive: true, force: true });
			console.log(`[Cleanup] Removed ${dir}`);
		} catch (error) {
			console.error(`[Cleanup] Failed to remove ${dir}:`, error);
		}
	}

	// Defensive cleanup at start - clean any stale directories
	await safeCleanup(tempDir);

	// 0. Shallow Clone (Optimized content access)
	try {
		await fs.mkdir(path.dirname(tempDir), { recursive: true });
		const git = simpleGit();
		await git.clone(data.githubUrl, tempDir, [
			"--depth",
			"1",
			"--branch",
			branch,
			"--single-branch",
		]);
		await logEvent(
			repoId,
			"clone.complete",
			"success",
			"initializing",
			`Shallow cloned to ${tempDir}`,
		);
	} catch (error) {
		console.error("[ShallowClone] Failed, falling back to API:", error);
		await logEvent(
			repoId,
			"clone.failed",
			"warning",
			"initializing",
			`Clone failed: ${error instanceof Error ? error.message : "unknown"}`,
		);
	}

	try {
		// 1. Fetching repository data
		await updateStatus(repoId, "fetching", "Fetching repository data");
		const [tree, commits] = await Promise.all([
			getRepoTree({ owner, repo, branch }),
			getRepoCommits({ owner, repo }),
		]);

		const commitsData = commits.map((item) => ({
			sha: item.sha,
			message: item.commit.message,
			authorName: item.commit.author?.name ?? "Unknown",
			committedAt: item.commit.author?.date
				? new Date(item.commit.author.date)
				: null,
		}));

		// Skip test files and increase limit for large repos
		const limitedTree = tree
			.filter((item) => item.path && !TEST_FILE_PATTERN.test(item.path))
			.slice(0, 10000);

		const filesData = limitedTree.map((item) => ({
			id: Math.random().toString(), // fake ID for compat
			path: item.path,
			size: item.size ?? 0,
			sha: item.sha,
			isDirectory: item.type === "tree",
			linesCount: 0,
			extension:
				item.type === "blob" && getExtension(item.path) !== "no-extension"
					? getExtension(item.path)
					: null,
			depth: item.path?.split("/").length ?? 0,
		}));

		// 2. Basic analysis
		await updateStatus(repoId, "basic-analysis", "Performing basic analysis");

		const fileTree = convertToFileTree(
			(limitedTree as Array<{ path: string; type: string }>)
				.filter((f) => f.path !== null)
				.map((f) => ({
					path: f.path,
					isDirectory: f.type === "tree",
				})),
		);

		const basicResults = await performBasicAnalysis({
			repoId,
			fullTree: tree,
			owner,
			repo,
			fileTree,
		});

		// 3. Dependency analysis
		await updateStatus(
			repoId,
			"dependency-analysis",
			"Performing dependency analysis",
		);

		const changeCounts: Record<string, number> = {};
		await Promise.all(
			commitsData.map(async (c) => {
				const details = await getCommitDetails({ owner, repo, sha: c.sha });
				if (details.files) {
					for (const f of details.files) {
						if (f.filename) {
							changeCounts[f.filename] = (changeCounts[f.filename] ?? 0) + 1;
						}
					}
				}
			}),
		);

		const codeFiles = limitedTree
			.filter(
				(f: { path: string; type: string; size?: number }) =>
					f.type === "blob" &&
					f.size !== undefined &&
					f.size > 0 &&
					f.size <= CONTENT_MAX_SIZE &&
					CODE_EXTENSIONS.includes(getExtension(f.path) || ""),
			)
			.sort((a, b) => {
				const scoreA = (changeCounts[a.path] || 0) * 1000 + (a.size || 0);
				const scoreB = (changeCounts[b.path] || 0) * 1000 + (b.size || 0);
				return scoreB - scoreA;
			})
			.slice(0, 3000);

		const BATCH_SIZE = 20;
		const filesContent: FileContent[] = [];

		for (let i = 0; i < codeFiles.length; i += BATCH_SIZE) {
			const batch = codeFiles.slice(i, i + BATCH_SIZE);
			const batchResults = await Promise.all(
				batch.map(async (file) => {
					if (!file.path) return null;

					let content: string | null = null;
					// Try local FS first (Shallow Clone)
					try {
						// Bypass static analysis path tracing
						const localPath = [tempDir, file.path].join("/");
						content = await fs.readFile(localPath, "utf8");
					} catch (_e) {
						// Fallback to API
						content = await getFileContentFromRaw({
							owner,
							repo,
							branch,
							path: file.path,
						});
					}

					if (!content) return null;
					return {
						path: file.path,
						content,
						language: detectLanguage(file.path) || "typescript",
					};
				}),
			);
			filesContent.push(
				...batchResults.filter((r): r is NonNullable<typeof r> => r !== null),
			);
		}

		console.log(
			`[Inngest] Fetched ${filesContent.length} files for dependency analysis`,
		);

		const dependencyResults = await performDependencyAnalysis(filesContent);
		const hotspotResults = performHotspotAnalysis(dependencyResults.graph);

		console.log(
			`[Inngest] Dependency analysis complete: ${dependencyResults.graph.nodes.length} nodes, ${dependencyResults.graph.edges.length} edges`,
		);

		const s3StorageKey = await uploadAnalysisData(repoId, {
			commits: commitsData,
			files: filesData,
			fileTree: basicResults.fileTree,
			fileTypeBreakdown: basicResults.fileTypeBreakdown,
			dependencyGraph: dependencyResults.graph,
			hotSpotData: hotspotResults.hotspots,
			totalCodeFiles: basicResults.totalCodeFiles,
			samplingCoverage: {
				analyzedFiles: codeFiles.length,
				totalFiles: basicResults.totalCodeFiles,
				percentage: Math.round(
					(codeFiles.length / basicResults.totalCodeFiles) * 100,
				),
			},
		});

		await insertAnalysisResults({
			repositoryId: repoId,
			s3StorageKey,
			totalFiles: basicResults.totalFiles,
			totalDirectories: basicResults.totalDirectories,
			totalLines: basicResults.totalLines,
		});

		await updateStatus(repoId, "complete", "Analysis complete");
		await logEvent(
			repoId,
			"analysis.complete",
			"success",
			"complete",
			`Analyzed ${basicResults.totalFiles} files, ${dependencyResults.graph.nodes.length} nodes, ${dependencyResults.graph.edges.length} edges`,
			{
				totalFiles: basicResults.totalFiles,
				totalNodes: dependencyResults.graph.nodes.length,
				totalEdges: dependencyResults.graph.edges.length,
				processedFiles: dependencyResults.processedFiles,
				skippedFiles: dependencyResults.skippedFiles,
			},
		);

		// 4. Contributors sync
		await updateStatus(repoId, "contributors", "Syncing contributors");
		await deleteContributorsByRepoId(repoId);

		const contributors = await getRepoContributors({ owner, repo });
		if (contributors.length > 0) {
			await upsertContributors(
				contributors.map((c) => ({
					repositoryId: repoId,
					githubLogin: c.login,
					avatarUrl: c.avatar_url,
					htmlUrl: c.html_url,
					contributions: c.contributions,
					firstContributionAt: null,
					lastContributionAt: null,
				})),
			);
			await logEvent(
				repoId,
				"contributors.sync",
				"success",
				"contributors",
				`Synced ${contributors.length} contributors`,
				{ count: contributors.length },
			);
		}
		await updateStatus(repoId, "complete", "Analysis complete");
	} finally {
		// Final Cleanup
		await safeCleanup(tempDir);
	}

	return { success: true, repoId };
}

// 7-day Log Cleanup Job
export const cleanupOldLogs = inngest.createFunction(
	{
		id: "cleanup-old-logs",
		name: "Cleanup Old Analysis Logs",
		triggers: [{ cron: "0 0 * * *" }],
	},
	async ({ step }) => {
		await step.run("delete-old-logs", async () => {
			const sevenDaysAgo = new Date();
			sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

			const result = await db
				.delete(analysisLogs)
				.where(lt(analysisLogs.createdAt, sevenDaysAgo))
				.returning();

			return { deletedRows: result.length };
		});
	},
);

// Inngest Background Function
export const processAnalysisJob = inngest.createFunction(
	{
		id: "process-repo-analysis",
		name: "Process Repository Analysis",
		concurrency: 5,
		triggers: [{ event: "analysis/repo.requested" }],
	},
	async ({ event, step }) => {
		return coreAnalysisLogic(
			event.data as {
				repoId: string;
				owner: string;
				repo: string;
				branch: string;
				githubUrl: string;
			},
			step as any,
		);
	},
);

// Direct Analysis for Local Dev / Testing
export async function runAnalysisDirect(data: {
	repoId: string;
	owner: string;
	repo: string;
	branch: string;
	githubUrl: string;
}) {
	const mockStep = {
		run: async <T>(name: string, fn: () => Promise<T>) => {
			console.log(`[DirectAnalysis] Running step: ${name}`);
			return fn();
		},
		updateProgress: async (progress: number) => {
			console.log(`[DirectAnalysis] Progress: ${progress}%`);
		},
	};

	return coreAnalysisLogic(data, mockStep);
}
