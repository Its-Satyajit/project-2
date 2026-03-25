import Elysia, { t } from "elysia";
import { getTopRepositoriesByStars } from "../dal/repositories";

export const reposRoute = new Elysia().get(
	"/repos/top",
	async ({ query }) => {
		const limit = query.limit ?? 10;
		const repos = await getTopRepositoriesByStars(limit);
		return repos.map((repo) => ({
			id: repo.id,
			owner: repo.owner,
			name: repo.name,
			fullName: repo.fullName,
			description: repo.description,
			stars: repo.stars ?? 0,
			forks: repo.forks ?? 0,
			contributorCount: repo.contributorCount ?? 0,
			primaryLanguage: repo.primaryLanguage,
			analysisStatus: repo.analysisStatus,
		}));
	},
	{
		query: t.Object({
			limit: t.Number({ default: 10 }),
		}),
	},
);
