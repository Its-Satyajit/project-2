import Elysia from "elysia";
import { rateLimit } from "~/server/middleware/rate-limit";
import { analyzeRoute } from "./analyze";
import { dashboardRoute } from "./dashboard";
import { debugRoute } from "./debug";
import { fileContentRoute } from "./file-content";
import { reposRoute } from "./repos";
import { statusRoute } from "./status";
import { treemapRoute } from "./treemap";

// Global rate limit for all API endpoints: 60 per minute
const globalRateLimit = rateLimit({
	limit: 60,
	window: "1m",
});

export const apiHandler = new Elysia()
	.use(globalRateLimit)
	.get(
		"/hello-elysia",
		() => {
			return "🦊 I am Alive,";
		},
		{},
	)
	.use(analyzeRoute)
	.use(dashboardRoute)
	.use(debugRoute)
	.use(fileContentRoute)
	.use(reposRoute)
	.use(statusRoute)
	.use(treemapRoute);
