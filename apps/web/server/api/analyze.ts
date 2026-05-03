import Elysia, { t } from "elysia";
import { getOwnerRepo } from "~/lib/getOwnerRepo";
import { rateLimit } from "~/server/middleware/rate-limit";
import {
	getRepositoryByOwnerAndName,
	insertRepositories,
} from "../dal/repositories";
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

		if (repoMetadata.private) {
			return {
				error:
					"Private repositories are not supported yet. Only public repositories can be analyzed.",
			};
		}

		// Strictly enforce 24h analysis window
		const existing = await getRepositoryByOwnerAndName(
			parseResult.owner,
			parseResult.repo,
		);
		if (existing?.analysisStatus === "complete") {
			const result = existing.analysisResults[0];
			const lastAnalyzed = result ? new Date(result.createdAt) : null;
			const RE_ANALYSIS_WINDOW = 24 * 60 * 60 * 1000;
			if (
				lastAnalyzed &&
				Date.now() - lastAnalyzed.getTime() < RE_ANALYSIS_WINDOW
			) {
				return {
					success: true,
					repoId: existing.id,
					owner: existing.owner,
					name: existing.name,
					status: "complete",
					message: "Repository analyzed recently.",
				};
			}
		}

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
			license:
				repoMetadata.license?.spdx_id &&
				repoMetadata.license.spdx_id !== "NOASSERTION"
					? repoMetadata.license.spdx_id
					: (repoMetadata.license?.name ?? null),
			analysisStatus: "queued",
		});

		if (!repoRecord?.id) {
			return { error: "Failed to persist repository record" };
		}

		try {
			console.log(`[API] Sending Inngest event for ${repoRecord.id}`);
			await inngest.send({
				name: "analysis/repo.requested",
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
			owner: repoRecord.owner,
			name: repoRecord.name,
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
