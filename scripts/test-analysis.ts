import { coreAnalysisLogic } from "../src/server/inngest/functions";

const mockStep = {
	run: async <T>(name: string, fn: () => Promise<T>) => {
		console.log(`[DirectAnalysis] Running step: ${name}`);
		return fn();
	},
	updateProgress: async (progress: number) => {
		console.log(`[DirectAnalysis] Progress: ${progress}%`);
	},
};

const data = {
	repoId: "2ea975d9-f2db-48df-a192-9ea54e841aa2",
	owner: "vercel",
	repo: "next.js",
	branch: "canary",
	githubUrl: "https://github.com/vercel/next.js",
};

console.log("Starting analysis...");
const result = await coreAnalysisLogic(data, mockStep);
console.log("Result:", result);
