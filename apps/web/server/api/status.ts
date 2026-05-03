import Elysia, { t } from "elysia";
import { getRepositoryData } from "../dal/repositories";
import { fetchAnalysisData } from "../dal/s3";
import { computeRepoSummary } from "../logic/repoSummary";

export const statusRoute = new Elysia().get(
	"/dashboard/:repoId/status",
	async ({ params, set }) => {
		const repoData = await getRepositoryData(params.repoId);

		if (!repoData) {
			set.status = 404;
			return { error: "Repository not found" };
		}

		const result = repoData.analysisResults[0];
		let s3Data = null;

		if (result?.s3StorageKey) {
			try {
				s3Data = await fetchAnalysisData(result.s3StorageKey);
			} catch (error) {
				console.error("Error fetching S3 data for status:", error);
			}
		}

		return {
			repoId: repoData.id,
			status: repoData.analysisStatus,
			phase: repoData.analysisPhase,
			metadata: {
				owner: repoData.owner,
				name: repoData.name,
				fullName: repoData.fullName,
				description: repoData.description,
				defaultBranch: repoData.defaultBranch,
				primaryLanguage: repoData.primaryLanguage,
				isPrivate: repoData.isPrivate,
				stars: repoData.stars,
				forks: repoData.forks,
				avatarUrl: repoData.avatarUrl,
			},
			analysis: result
				? {
						totalFiles: result.totalFiles,
						totalDirectories: result.totalDirectories,
						totalLines: result.totalLines,
						fileTypeBreakdown: s3Data?.fileTypeBreakdown,
						dependencyGraph: s3Data?.dependencyGraph,
						hotSpotData: s3Data?.hotSpotData,
						summary: s3Data
							? computeRepoSummary({
									...s3Data,
									totalFiles: result.totalFiles ?? 0,
									totalDirectories: result.totalDirectories ?? 0,
									totalLines: result.totalLines ?? 0,
								})
							: null,
					}
				: null,
		};
	},
	{
		params: t.Object({
			repoId: t.String(),
		}),
	},
);
