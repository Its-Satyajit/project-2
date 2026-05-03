import { getExtension } from "~/lib/getExtension";
import type { FileTreeItem } from "~/lib/treeUtils";
import { getFileContent } from "../octokit";

type TreeItem = {
	path?: string;
	mode?: string;
	type?: string;
	sha?: string;
	size?: number;
	url?: string;
};

const CODE_EXTENSIONS = new Set([
	"ts",
	"tsx",
	"js",
	"jsx",
	"py",
	"go",
	"java",
	"c",
	"cpp",
	"h",
	"hpp",
	"rs",
	"rb",
	"php",
	"css",
	"html",
	"json",
	"md",
]);

export async function performBasicAnalysis({
	repoId,
	fullTree,
	owner,
	repo,
	fileTree,
}: {
	repoId: string;
	fullTree: TreeItem[];
	owner: string;
	repo: string;
	fileTree: FileTreeItem[];
}) {
	let totalFiles = 0;
	let totalDirectories = 0;
	const extensionBreakdown: Record<string, number> = {};
	const codeFiles: { path: string; size: number }[] = [];

	// 1. Iterative processing of the tree
	for (const item of fullTree) {
		if (item.type === "tree") {
			totalDirectories++;
			continue;
		}

		if (item.type === "blob") {
			totalFiles++;

			const ext = getExtension(item.path);

			extensionBreakdown[ext] = (extensionBreakdown[ext] ?? 0) + 1;

			if (CODE_EXTENSIONS.has(ext) && item.path && item.size) {
				codeFiles.push({ path: item.path, size: item.size });
			}
		}
	}

	// 2. Hybrid LOC Estimation
	// Fetch exact counts for top 10 files + 20 random samples to get a better CPL average
	const topFiles = codeFiles.slice(0, 10);
	const remainingFiles = codeFiles.slice(10);

	const sampledFiles = [...topFiles];
	if (remainingFiles.length > 0) {
		const numExtraSamples = Math.min(remainingFiles.length, 20);
		const shuffled = [...remainingFiles].sort(() => 0.5 - Math.random());
		sampledFiles.push(...shuffled.slice(0, numExtraSamples));
	}

	let totalLines = 0;
	let totalSampledSize = 0;
	let totalSampledLines = 0;

	const sampledFilesContent = await Promise.all(
		sampledFiles.map((f) => getFileContent({ owner, repo, path: f.path })),
	);

	for (let i = 0; i < sampledFiles.length; i++) {
		const file = sampledFiles[i];
		const content = sampledFilesContent[i];
		if (content && file) {
			const lines = content.split("\n").length;
			totalLines += lines;
			totalSampledSize += file.size;
			totalSampledLines += lines;
		}
	}

	// Dynamic Heuristic: Average characters per line from samples
	const averageCPL =
		totalSampledLines > 0 ? totalSampledSize / totalSampledLines : 45;

	// Apply heuristic to all non-sampled files
	const sampledPaths = new Set(sampledFiles.map((f) => f.path));
	for (const file of codeFiles) {
		if (!sampledPaths.has(file.path)) {
			totalLines += Math.round(file.size / averageCPL);
		}
	}

	// 3. Prepare result data
	const analysisData = {
		repositoryId: repoId,
		totalFiles,
		totalDirectories,
		totalLines,
		totalCodeFiles: codeFiles.length,
		fileTypeBreakdown: extensionBreakdown,
		summaryText: `Analysis complete. Found ${totalFiles} files across ${totalDirectories} directories. Estimated ${totalLines} lines of code.`,
		fileTree,
	};

	return analysisData;
}
