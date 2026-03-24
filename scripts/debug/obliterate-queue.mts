import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const { analysisQueue } = await import("../../src/server/queue/index");

async function obliterate() {
	console.log("Obliterating queue...");
	await analysisQueue.obliterate({ force: true });
	console.log("Queue cleared");
	const counts = await analysisQueue.getJobCounts();
	console.log("Counts after:", counts);
	await analysisQueue.close();
}

obliterate();
