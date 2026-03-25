import { Elysia, t } from "elysia";
import { deleteOldAnalysisData, getRecentLogs } from "../dal/analysisLogs";

export const observabilityRoutes = new Elysia({ prefix: "/observability" })
	.get("/logs", async () => {
		const logs = await getRecentLogs(7);
		return { logs };
	})
	.post(
		"/cleanup",
		async () => {
			const result = await deleteOldAnalysisData(7);
			return {
				message: "Cleanup completed",
				deleted: result,
			};
		},
		{
			body: t.Object({
				days: t.Optional(t.Number()),
			}),
		},
	);

export default observabilityRoutes;
