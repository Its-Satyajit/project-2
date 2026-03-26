import Elysia, { t } from "elysia";
import type { FileTreeItem } from "~/lib/treeUtils";
import { getRepositoryData } from "../dal/repositories";
import { getContributorCount } from "../dal/contributors";
import { fetchAnalysisData } from "../dal/s3";
import type { CommitData } from "../types/analysis";

export const dashboardRoute = new Elysia().get(
	"/dashboard/:repoId",
	async ({ params, set }) => {
		const data = await getRepositoryData(params.repoId);
		if (!data) {
			set.status = 404;
			return { error: "Repository not found" };
		}

		const result = data.analysisResults[0];
		let fileTree: FileTreeItem[] = [];
		let additionalData: {
			fileTypeBreakdown?: Record<string, number>;
			dependencyGraph?: any;
			hotSpotData?: any;
			commits?: CommitData[];
		} = {};

		if (result?.s3StorageKey) {
			try {
				const s3Data = await fetchAnalysisData(result.s3StorageKey);
				fileTree = s3Data.fileTree || [];
				additionalData = {
					fileTypeBreakdown: s3Data.fileTypeBreakdown,
					dependencyGraph: s3Data.dependencyGraph,
					hotSpotData: s3Data.hotSpotData,
					commits: s3Data.commits,
				};
			} catch (error) {
				console.error("Error fetching analysis data from S3:", error);
			}
		}

		const contributorCount = await getContributorCount(params.repoId);

		return {
			...data,
			...additionalData,
			fileTree,
			contributorCount,
		};
	},
	{
		params: t.Object({
			repoId: t.String(),
		}),
	},
);
