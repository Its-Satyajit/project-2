import Elysia, { t } from "elysia";
import { getRepositoryData } from "../dal/repositories";
import { getFileContent } from "../octokit";

export const fileContentRoute = new Elysia().get(
	"/file-content",
	async ({ query, set }) => {
		const repoData = await getRepositoryData(query.repoId);
		if (!repoData) {
			set.status = 404;
			return { error: "Repository not found" };
		}

		const content = await getFileContent({
			owner: repoData.owner,
			repo: repoData.name,
			path: query.path,
		});

		if (content === null) {
			set.status = 404;
			return { error: "File not found or too large" };
		}

		return { content };
	},
	{
		query: t.Object({
			repoId: t.String(),
			path: t.String(),
		}),
	},
);
