import { serve } from "inngest/edge";
import { inngest } from "./client";
import { processAnalysisJob } from "./functions";

// This is the core Inngest handler that can be reused across frameworks
// For Elysia, we use the Edge handler which takes a standard Request and returns a Response
export const inngestHandler = serve({
	client: inngest,
	functions: [
		processAnalysisJob,
	],
});
