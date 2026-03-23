import Elysia, { t } from "elysia";
import { getRepositoryData } from "../dal/repositories";
import { type AnalysisData, computeRepoSummary } from "../logic/repoSummary";

export const statusRoute = new Elysia().get(
	"/dashboard/:repoId/status",
	async ({ params, set }) => {
		const repoData = await getRepositoryData(params.repoId);

		if (!repoData) {
			set.status = 404;
			return { error: "Repository not found" };
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
			},
			analysis: repoData.analysisResults?.[0]
				? {
						totalFiles: repoData.analysisResults[0].totalFiles,
						totalDirectories: repoData.analysisResults[0].totalDirectories,
						totalLines: repoData.analysisResults[0].totalLines,
						fileTypeBreakdown:
							repoData.analysisResults[0].fileTypeBreakdownJson,
						dependencyGraph: repoData.analysisResults[0].dependencyGraphJson,
						hotSpotData: repoData.analysisResults[0].hotSpotDataJson,
						summary: computeRepoSummary(
							repoData.analysisResults[0] as AnalysisData,
						),
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
