import { inngest } from "../src/server/inngest/client";

async function triggerLocalAnalysis() {
	const repoId = process.argv[2];
	const githubUrl = process.argv[3] || "https://github.com/microsoft/vscode";
	
	if (!repoId) {
		console.error("Please provide a repoId: npm run test:inngest <repoId> [githubUrl]");
		process.exit(1);
	}

	console.log(`Triggering analysis for ${repoId} (${githubUrl})...`);
	
	// Parse owner/repo from URL
	const urlParts = githubUrl.replace(/\/$/, "").split("/");
	const repo = urlParts.pop();
	const owner = urlParts.pop();

	await inngest.send({
		name: "repo/analyze",
		data: {
			repoId,
			owner,
			repo,
			branch: "main",
			githubUrl,
		},
	});

	console.log("Event sent to Inngest Dev Server!");
}

triggerLocalAnalysis().catch(console.error);
