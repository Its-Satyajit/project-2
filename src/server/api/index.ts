import Elysia from "elysia";
import { analyzeRoute } from "./ analyze";
import { dashboardRoute } from "./dashboard";
import { debugRoute } from "./debug";
import { fileContentRoute } from "./file-content";
import { reposRoute } from "./repos";
import { statusRoute } from "./status";
import { treemapRoute } from "./treemap";

export const apiHandler = new Elysia()
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
