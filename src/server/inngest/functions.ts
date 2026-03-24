import { inngest } from "./client";
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

const CONTENT_MAX_SIZE = 50 * 1024;
const CODE_EXTENSIONS = [
	"ts", "tsx", "js", "jsx", "py", "go", "rs", "java", "c", "h", "cpp", "cc", "cxx", "c++", "hpp", "hh", "hxx", "h++", "cs", "kt", "kts", "swift", "php", "dart", "r", "rb", "m", "scala", "sh", "bash", "zsh", "jl", "mm", "asm", "s", "S", "groovy", "gradle", "hs", "lhs", "ex", "exs", "sql",
];

async function updateStatus(repoId: string, status: string, phase: string) {
	await updateRepositoryStatus(repoId, status, phase);
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
	step: { run: <T>(name: string, fn: () => Promise<T>) => Promise<T>, updateProgress?: (p: number) => Promise<void> }
) {
	const { repoId, owner, repo, branch } = data;

	// 1. Fetching repository data
	const { repoTree, limitedTree } = await step.run("fetch-repo-data", async () => {
		await updateStatus(repoId, "fetching", "Fetching repository data");
		const [tree, commits] = await Promise.all([
			getRepoTree({ owner, repo, branch }),
			getRepoCommits({ owner, repo }),
		]);

		await insertCommits(
			commits.map((item) => ({
				repositoryId: repoId,
				sha: item.sha,
				message: item.commit.message,
				authorName: item.commit.author?.name ?? "Unknown",
				committedAt: item.commit.author?.date
					? new Date(item.commit.author.date)
					: null,
			})),
		);

		const limTree = tree.slice(0, 2000);
		await insertFiles(
			limTree.map((item) => ({
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

		return { repoTree: tree, limitedTree: limTree };
	});

	// 2. Basic analysis
	const { basicResults } = await step.run("basic-analysis", async () => {
		await updateStatus(repoId, "basic-analysis", "Performing basic analysis");

		const fileTree = convertToFileTree(
			limitedTree
				.filter(
					(f: any): f is any & { path: string; isDirectory: boolean } =>
						f.path !== null,
				)
				.map((f: any) => ({
					...f,
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

		const codeFiles = limitedTree.filter(
			(f: any) =>
				f.type === "blob" &&
				f.size !== undefined &&
				f.size > 0 &&
				f.size <= CONTENT_MAX_SIZE &&
				CODE_EXTENSIONS.includes(getExtension(f.path) || ""),
		);

		const filesContent: FileContent[] = [];
		for (const file of codeFiles.slice(0, 50)) {
			if (!file.path) continue;

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
			}
		}

		const dependencyResults = await performDependencyAnalysis(filesContent);
		const hotspotResults = performHotspotAnalysis(dependencyResults.graph);

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
	});

	return { success: true, repoId };
}

// Inngest Background Function
export const processAnalysisJob = inngest.createFunction(
	{ 
		id: "analyze-repo", 
		name: "Analyze Repository",
		triggers: [{ event: "repo/analyze" }]
	},
	async ({ event, step }: { event: { data: any }, step: any }) => {
		return coreAnalysisLogic(event.data, step);
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
