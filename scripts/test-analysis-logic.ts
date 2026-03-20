import { performBasicAnalysis } from "../src/server/logic/analysis";

// Mock Octokit getFileContent
import * as octokit from "../src/server/octokit";
// @ts-ignore
octokit.getFileContent = async () => "line1\nline2\nline3\nline4\nline5";

// Mock DAL insertAnalysisResults
import * as dal from "../src/server/dal/analysis";
// @ts-ignore
dal.insertAnalysisResults = async (data) => {
	console.log("DAL Inserted:", data);
	return data;
};

const mockTree = [
	{ path: "src/index.ts", type: "blob", size: 450 }, // ~10 lines or exactly 5 from mock
	{ path: "src/utils.js", type: "blob", size: 900 }, // ~20 lines
	{ path: "README.md", type: "blob", size: 100 },
	{ path: "src", type: "tree" },
	{ path: "package.json", type: "blob", size: 500 },
];

async function runTest() {
	console.log("Running Analysis Logic Test...");
	const results = await performBasicAnalysis({
		repoId: "test-repo-id",
		fullTree: mockTree,
		owner: "test-owner",
		repo: "test-repo",
	});

	console.log("Results:", JSON.stringify(results, null, 2));

	if (results.totalFiles !== 4) throw new Error("Total files mismatch");
	if (results.totalDirectories !== 1) throw new Error("Total directories mismatch");
	if (results.fileTypeBreakdownJson.ts !== 1) throw new Error("Extension breakdown mismatch");
	
	console.log("Test Passed!");
}

runTest().catch((err) => {
	console.error("Test Failed:", err);
	process.exit(1);
});
