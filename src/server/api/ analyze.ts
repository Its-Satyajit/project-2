import Elysia, { t } from "elysia";
import { getOwnerRepo } from "~/lib/getOwnerRepo";
import { rateLimit } from "~/server/middleware/rate-limit";
import { insertRepositories } from "../dal/repositories";
import { getRepoMetadata } from "../octokit";
import { addAnalysisJob } from "../queue/worker";

// Strict rate limit for expensive analysis endpoint: 5 per hour
const analyzeRateLimit = rateLimit({
	limit: 5,
	window: "1h",
	message:
		"Too many analysis requests. Please wait before requesting another repository analysis.",
});

export const analyzeRoute = new Elysia().use(analyzeRateLimit).post(
	"/analyze",
	async (ctx) => {
		const parseResult = getOwnerRepo(ctx.body.githubUrl);

		if (!parseResult) {
			return { error: "Invalid GitHub URL" };
		}

		const repoMetadata = await getRepoMetadata(parseResult);

		const repoRecord = await insertRepositories({
			owner: repoMetadata.owner.login,
			name: repoMetadata.name,
			fullName: repoMetadata.full_name,
			url: repoMetadata.html_url,
			description: repoMetadata.description,
			defaultBranch: repoMetadata.default_branch,
			primaryLanguage: repoMetadata.language ?? "Unknown",
			isPrivate: repoMetadata.private,
			stars: repoMetadata.stargazers_count,
			forks: repoMetadata.forks_count,
			analysisStatus: "queued",
		});

		if (!repoRecord?.id) {
			return { error: "Failed to persist repository record" };
		}

		try {
			console.log(`[API] Adding analysis job for ${repoRecord.id}`);
			await addAnalysisJob({
				repoId: repoRecord.id,
				owner: parseResult.owner,
				repo: parseResult.repo,
				branch: repoMetadata.default_branch,
				githubUrl: ctx.body.githubUrl,
			});
			console.log(`[API] Job added to queue for ${repoRecord.id}`);
		} catch (err) {
			console.error("[API] Failed to add job:", err);
		}

		return {
			success: true,
			repoId: repoRecord.id,
			metadata: repoMetadata,
			status: "queued",
		};
	},
	{
		body: t.Object({
			githubUrl: t.String(),
		}),
	},
);
