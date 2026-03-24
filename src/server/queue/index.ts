import { Queue } from "bullmq";
import Redis from "ioredis";
import { env } from "~/env";

export interface AnalysisJob {
	repoId: string;
	owner: string;
	repo: string;
	branch: string;
	githubUrl: string;
}

export const connection = (env.REDIS_URL 
	? new Redis(env.REDIS_URL, { maxRetriesPerRequest: null })
	: { 
			host: env.REDIS_HOST || "localhost", 
			port: env.REDIS_PORT ? parseInt(env.REDIS_PORT, 10) : 6379,
			password: env.REDIS_PASSWORD
	  }) as any;

export const analysisQueue = new Queue<AnalysisJob>("analysis", {
	connection,
	defaultJobOptions: {
		attempts: 3,
		backoff: {
			type: "exponential",
			delay: 1000,
		},
		removeOnComplete: 100,
		removeOnFail: 50,
	},
});
