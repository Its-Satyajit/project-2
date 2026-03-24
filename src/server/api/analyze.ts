import Elysia, { t } from "elysia";
import { getOwnerRepo } from "~/lib/getOwnerRepo";
import { rateLimit } from "~/server/middleware/rate-limit";
import { insertRepositories } from "../dal/repositories";
import { inngest } from "../inngest/client";
import { getRepoMetadata } from "../octokit";

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

		console.log(
			`[API] Fetching repo metadata for ${parseResult.owner}/${parseResult.repo}`,
		);
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
			avatarUrl: repoMetadata.owner.avatar_url,
			analysisStatus: "queued",
		});

		if (!repoRecord?.id) {
			return { error: "Failed to persist repository record" };
		}

		try {
			console.log(`[API] Sending Inngest event for ${repoRecord.id}`);
			await inngest.send({
				name: "repo/analyze",
				data: {
					repoId: repoRecord.id,
					owner: parseResult.owner,
					repo: parseResult.repo,
					branch: repoMetadata.default_branch,
					githubUrl: ctx.body.githubUrl,
				},
			});
			console.log(`[API] Inngest event sent for ${repoRecord.id}`);
		} catch (err) {
			console.error("[API] Failed to send Inngest event:", err);
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
