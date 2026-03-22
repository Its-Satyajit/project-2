import { getExtension } from "~/lib/getExtension";
import type { FileTreeItem } from "~/lib/treeUtils";
import { insertAnalysisResults } from "../dal/analysis";
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
	// Sort by size descending to get "Top 10 largest code files"
	codeFiles.sort((a, b) => b.size - a.size);
	const topFiles = codeFiles.slice(0, 10);
	const remainingFiles = codeFiles.slice(10);

	let totalLines = 0;

	// Fetch exact counts for top files
	const topFilesContent = await Promise.all(
		topFiles.map((f) => getFileContent({ owner, repo, path: f.path })),
	);

	for (const content of topFilesContent) {
		if (content) {
			totalLines += content.split("\n").length;
		}
	}

	// Heuristic for the rest: ~45 characters per line
	for (const file of remainingFiles) {
		totalLines += Math.round(file.size / 45);
	}

	// 3. Persist results
	const analysisData = {
		repositoryId: repoId,
		totalFiles,
		totalDirectories,
		totalLines,
		fileTypeBreakdownJson: extensionBreakdown,
		summaryText: `Analysis complete. Found ${totalFiles} files across ${totalDirectories} directories. Estimated ${totalLines} lines of code.`,
		fileTreeJson: fileTree,
	};

	await insertAnalysisResults(analysisData);

	return analysisData;
}
