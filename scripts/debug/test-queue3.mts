import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env manually
const envFile = fs.readFileSync(path.join(__dirname, "../../.env"), "utf-8");
envFile.split("\n").forEach((line) => {
	const match = line.match(/^([^=]+)=(.*)$/);
	if (match) {
		const key = match[1].trim();
		let value = match[2].trim();
		if (value.startsWith('"') && value.endsWith('"')) {
			value = value.slice(1, -1);
		}
		process.env[key] = value;
	}
});

// Now import the queue
const { analysisQueue } = await import("../../src/server/queue/index");

async function test() {
	console.log("Queue connection:", analysisQueue.opts.connection);
	try {
		const job = await analysisQueue.add(
			"analyze",
			{
				repoId: "556ea516-457f-4916-8912-12170a26d1cf",
				owner: "Its-Satyajit",
				repo: "git-insights-analyzer",
				branch: "main",
				githubUrl: "https://github.com/Its-Satyajit/git-insights-analyzer",
			},
			{ jobId: "556ea516-457f-4916-8912-12170a26d1cf" },
		);
		console.log("Job added:", job.id);
		const counts = await analysisQueue.getJobCounts();
		console.log("Queue counts:", counts);
	} catch (error) {
		console.error("Error adding job:", error);
	} finally {
		await analysisQueue.close();
	}
}

test();
