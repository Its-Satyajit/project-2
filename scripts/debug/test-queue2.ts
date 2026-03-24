import * as fs from "node:fs";
import * as path from "node:path";

const envFile = fs.readFileSync(path.join(__dirname, "../../.env"), "utf-8");
envFile.split("\n").forEach((line) => {
	const match = line.match(/^([^=]+)=(.*)$/);
	if (match && match[1] && match[2]) {
		const key = match[1].trim();
		let value = match[2].trim();
		if (value.startsWith('"') && value.endsWith('"')) {
			value = value.slice(1, -1);
		}
		process.env[key] = value;
	}
});

import { analysisQueue } from "../../src/server/queue/index";

async function test() {
	console.log("Queue connection:", analysisQueue.opts.connection);
	const job = await analysisQueue.add(
		"analyze",
		{
			repoId: "556ea516-457f-4916-8912-12170a26d1cf",
			owner: "Its-Satyajit",
			repo: "project-2",
			branch: "main",
			githubUrl: "https://github.com/Its-Satyajit/project-2",
		},
		{ jobId: "556ea516-457f-4916-8912-12170a26d1cf" },
	);
	console.log("Job added:", job.id);
	const counts = await analysisQueue.getJobCounts();
	console.log("Queue counts:", counts);
	await analysisQueue.close();
}

test().catch(console.error);
