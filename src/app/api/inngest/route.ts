import { serve } from "inngest/next";
import { inngest } from "../../../server/inngest/client";
import { processAnalysisJob } from "../../../server/inngest/functions";

// Next.js standard API route for Inngest (reverted from Elysia)
export const { GET, POST, PUT } = serve({
	client: inngest,
	functions: [
		processAnalysisJob,
	],
});
