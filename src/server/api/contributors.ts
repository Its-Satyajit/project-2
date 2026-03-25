import Elysia, { t } from "elysia";
import { getContributors } from "../dal/contributors";

export const contributorsRoute = new Elysia().get(
	"/repos/:repoId/contributors",
	async ({ params: { repoId }, query }) => {
		const limit = query.limit ?? 100;
		const sort = query.sort ?? "contributions";
		const contributors = await getContributors(
			repoId,
			sort as "contributions" | "newest",
			limit,
		);
		return contributors.map((c) => ({
			id: c.id,
			githubLogin: c.githubLogin,
			avatarUrl: c.avatarUrl,
			htmlUrl: c.htmlUrl,
			contributions: c.contributions,
			firstContributionAt: c.firstContributionAt?.toISOString() ?? null,
			lastContributionAt: c.lastContributionAt?.toISOString() ?? null,
		}));
	},
	{
		query: t.Object({
			limit: t.Number({ default: 100 }),
			sort: t.Union([t.Literal("contributions"), t.Literal("newest")], {
				default: "contributions",
			}),
		}),
	},
);
