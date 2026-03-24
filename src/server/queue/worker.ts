import { type Job, Worker } from "bullmq";
import { env } from "~/env";
import { getExtension } from "~/lib/getExtension";
import { convertToFileTree } from "~/lib/treeUtils";
import { insertAnalysisResults } from "../dal/analysis";
import { insertCommits } from "../dal/commit";
import { insertFiles } from "../dal/files";
import { updateRepositoryStatus } from "../dal/repositories";
import { performBasicAnalysis } from "../logic/analysis";
import {
	detectLanguage,
	type FileContent,
	performDependencyAnalysis,
} from "../logic/dependencyAnalysis";
import { performHotspotAnalysis } from "../logic/hotspotAnalysis";
import { getFileContentFromRaw, getRepoCommits, getRepoTree } from "../octokit";
import type { AnalysisJob } from "./index";
import { analysisQueue } from "./index";

const CONTENT_MAX_SIZE = 50 * 1024;
const CODE_EXTENSIONS = [
	// TypeScript/JavaScript
	"ts",
	"tsx",
	"js",
	"jsx",
	// Python
	"py",
	// Go
	"go",
	// Rust
	"rs",
	// Java
	"java",
	// C/C++
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
	// C#
	"cs",
	// Kotlin
	"kt",
	"kts",
	// Swift
	"swift",
	// PHP
	"php",
	// Dart
	"dart",
	// R
	"r",
	// Ruby
	"rb",
	// MATLAB/Octave
	"m",
	// Scala
	"scala",
	// Shell
	"sh",
	"bash",
	"zsh",
	// Julia
	"jl",
	// Objective-C
	"mm",
	// Assembly
	"asm",
	"s",
	"S",
	// Groovy
	"groovy",
	"gradle",
	// Haskell
	"hs",
	"lhs",
	// Elixir
	"ex",
	"exs",
	// SQL
	"sql",
];

async function updateStatus(repoId: string, status: string, phase: string) {
	await updateRepositoryStatus(repoId, status, phase);
}

async function processAnalysisJob(job: Job<AnalysisJob>) {
	const { repoId, owner, repo, branch } = job.data;

	console.log(`[Worker] Starting analysis for ${owner}/${repo} (${repoId})`);
	console.log(`[Worker] Job data:`, job.data);

	try {
		await updateStatus(repoId, "fetching", "Fetching repository data");

		const [repoTree, repoCommits] = await Promise.all([
			getRepoTree({ owner, repo, branch }),
			getRepoCommits({ owner, repo }),
		]);

		await insertCommits(
			repoCommits.map((item) => ({
				repositoryId: repoId,
				sha: item.sha,
				message: item.commit.message,
				authorName: item.commit.author?.name ?? "Unknown",
				committedAt: item.commit.author?.date
					? new Date(item.commit.author.date)
					: null,
			})),
		);

		const limitedTree = repoTree.slice(0, 2000);
		await insertFiles(
			limitedTree.map((item) => ({
				repositoryId: repoId,
				path: item.path,
				size: item.size ?? 0,
				sha: item.sha,
				isDirectory: item.type === "tree",
				extension:
					item.type === "blob" && getExtension(item.path) !== "no-extension"
						? getExtension(item.path)
						: null,
				depth: item.path?.split("/").length ?? 0,
			})),
		);

		await job.updateProgress(25);

		await updateStatus(repoId, "basic-analysis", "Performing basic analysis");

		const fileTree = convertToFileTree(
			limitedTree
				.filter(
					(f): f is typeof f & { path: string; isDirectory: boolean } =>
						f.path !== null,
				)
				.map((f) => ({
					...f,
					isDirectory: f.type === "tree",
				})),
		);

		const basicResults = await performBasicAnalysis({
			repoId,
			fullTree: repoTree,
			owner,
			repo,
			fileTree,
		});

		await job.updateProgress(50);

		await updateStatus(
			repoId,
			"dependency-analysis",
			"Performing dependency analysis",
		);

		const codeFiles = limitedTree.filter(
			(f) =>
				f.type === "blob" &&
				f.size !== undefined &&
				f.size > 0 &&
				f.size <= CONTENT_MAX_SIZE &&
				CODE_EXTENSIONS.includes(getExtension(f.path) || ""),
		);

		console.log(
			`Found ${codeFiles.length} code files to analyze. Sample:`,
			codeFiles.slice(0, 5).map((f) => f.path),
		);

		const filesContent: FileContent[] = [];
		let failedFetches = 0;

		for (const file of codeFiles.slice(0, 1000)) {
			if (!file.path) {
				console.log(`Skipping file with no path:`, file);
				continue;
			}

			const content = await getFileContentFromRaw({
				owner,
				repo,
				branch,
				path: file.path,
			});

			if (content) {
				filesContent.push({
					path: file.path,
					content,
					language: detectLanguage(file.path) || "typescript",
				});
			} else {
				failedFetches++;
				if (failedFetches <= 5) {
					console.log(`Failed to fetch content for: ${file.path}`);
				}
			}
		}

		if (failedFetches > 0) {
			console.log(`Total failed fetches: ${failedFetches}`);
		}

		console.log(`Fetched content for ${filesContent.length} files`);

		await job.updateProgress(75);

		const dependencyResults = await performDependencyAnalysis(filesContent);

		const hotspotResults = performHotspotAnalysis(dependencyResults.graph);

		await job.updateProgress(90);

		await insertAnalysisResults({
			repositoryId: repoId,
			fileTreeJson: basicResults.fileTreeJson,
			totalFiles: basicResults.totalFiles,
			totalDirectories: basicResults.totalDirectories,
			totalLines: basicResults.totalLines,
			fileTypeBreakdownJson: basicResults.fileTypeBreakdownJson,
			dependencyGraphJson: dependencyResults.graph,
			hotSpotDataJson: hotspotResults.hotspots,
		});

		await updateStatus(repoId, "complete", "Analysis complete");

		await job.updateProgress(100);

		return { success: true, repoId };
	} catch (error) {
		await updateStatus(repoId, "failed", "Analysis failed");
		throw error;
	}
}

export async function runAnalysisDirect(data: {
	repoId: string;
	owner: string;
	repo: string;
	branch: string;
	githubUrl: string;
}) {
	const mockJob = {
		data,
		updateProgress: async (progress: number) => {
			console.log(`[DirectAnalysis] Progress: ${progress}%`);
		},
	};

	// Call the core logic directly
	return processAnalysisJob(mockJob as unknown as Job<AnalysisJob>);
}

let worker: Worker | null = null;

export function startAnalysisWorker() {
	if (worker) return worker;

	console.log(
		`[Worker] Connecting to Redis at ${env.REDIS_HOST}:${env.REDIS_PORT}`,
	);

	worker = new Worker<AnalysisJob>("analysis", processAnalysisJob, {
		connection: {
			host: env.REDIS_HOST || "localhost",
			port: env.REDIS_PORT ? parseInt(env.REDIS_PORT, 10) : 6379,
		},
		concurrency: 2,
	});

	worker.on("error", (err) => {
		console.error("[Worker] Connection error:", err);
	});

	worker.on("completed", (job) => {
		console.log(`[Worker] Analysis job ${job.id} completed`);
	});

	worker.on("failed", (job, err) => {
		console.error(`[Worker] Analysis job ${job?.id} failed:`, err);
	});

	worker.on("active", (job) => {
		console.log(
			`[Worker] Processing job ${job.id} for repo ${job.data.repoId}`,
		);
	});

	return worker;
}

export async function addAnalysisJob(data: AnalysisJob) {
	console.log(`[Queue] Adding analysis job for ${data.repoId}`);
	return analysisQueue.add("analyze", data, {
		jobId: data.repoId,
	});
}
