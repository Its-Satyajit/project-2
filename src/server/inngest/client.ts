import { Inngest } from "inngest";

// Analysis job interface consistent with src/server/queue/index.ts
export interface AnalysisJob {
	repoId: string;
	owner: string;
	repo: string;
	branch: string;
	githubUrl: string;
}

// Create a client to send and receive events
export const inngest = new Inngest({ id: "project-2-analysis" });
