import { serve } from "inngest/next";
import { inngest } from "../../../server/inngest/client";
import { processAnalysisJob } from "../../../server/inngest/functions";

export const { GET, POST, PUT } = serve({
	client: inngest,
	functions: [processAnalysisJob],
});
