import { lt } from "drizzle-orm";
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
	getFileContentFromRaw,
	getRepoCommits,
	getRepoContributors,
	getRepoTree,
} from "../octokit";
import { inngest } from "./client";

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
	step: {
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

	// 1. Fetching repository data
	const { repoTree, limitedTree, commitsData, filesData } = await step.run(
		"fetch-repo-data",
		async () => {
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

			const limTree = tree.slice(0, 2000);
			const filesData = limTree.map((item) => ({
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

			return { repoTree: tree, limitedTree: limTree, commitsData, filesData };
		},
	);

	// 2. Basic analysis
	const { basicResults } = await step.run("basic-analysis", async () => {
		await updateStatus(repoId, "basic-analysis", "Performing basic analysis");

		const fileTree = convertToFileTree(
			(limitedTree as Array<{ path: string; type: string }>)
				.filter((f) => f.path !== null)
				.map((f) => ({
					path: f.path,
					isDirectory: f.type === "tree",
				})),
		);

		const results = await performBasicAnalysis({
			repoId,
			fullTree: repoTree,
			owner,
			repo,
			fileTree,
		});

		return { basicResults: results };
	});

	// 3. Dependency analysis
	await step.run("dependency-analysis", async () => {
		await updateStatus(
			repoId,
			"dependency-analysis",
			"Performing dependency analysis",
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
			.sort((a, b) => (b.size || 0) - (a.size || 0))
			.slice(0, 1000);

		const BATCH_SIZE = 20;
		const filesContent: FileContent[] = [];

		for (let i = 0; i < codeFiles.length; i += BATCH_SIZE) {
			const batch = codeFiles.slice(i, i + BATCH_SIZE);
			const batchResults = await Promise.all(
				batch.map(async (file) => {
					if (!file.path) return null;
					const content = await getFileContentFromRaw({
						owner,
						repo,
						branch,
						path: file.path,
					});
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
	});

	// 4. Contributors sync
	await step.run("contributors-sync", async () => {
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
	});

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
		id: "analyze-repo",
		name: "Analyze Repository",
		triggers: [{ event: "repo/analyze" }],
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
