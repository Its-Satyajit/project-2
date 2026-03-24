import { analysisQueue } from "../../src/server/queue/index";

async function test() {
	console.log("Queue connection:", analysisQueue.opts.connection);
	const job = await analysisQueue.add(
		"test",
		{
			repoId: "test",
			owner: "test",
			repo: "test",
			branch: "main",
			githubUrl: "test",
		},
		{ jobId: "test" },
	);
	console.log("Job added:", job.id);
	const counts = await analysisQueue.getJobCounts();
	console.log("Queue counts:", counts);
	await analysisQueue.close();
}

test().catch(console.error);
