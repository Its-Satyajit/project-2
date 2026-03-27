import Elysia, { t } from "elysia";
import type { FileTreeItem } from "~/lib/treeUtils";
import { getContributorCount } from "../dal/contributors";
import { getRepositoryData, updateRepositoryStatus } from "../dal/repositories";
import { fetchAnalysisData } from "../dal/s3";
import { inngest } from "../inngest/client";
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

		const RE_ANALYSIS_WINDOW = 24 * 60 * 60 * 1000;
		const now = new Date();
		const lastAnalyzed = result ? new Date(result.createdAt) : null;

		// Trigger re-analysis if:
		// 1. Last analysis is older than 24h
		// 2. Or if there's no analysis result yet
		// 3. AND the repository is currently in 'complete' status (not already analyzing)
		if (
			data.analysisStatus === "complete" &&
			(!lastAnalyzed ||
				now.getTime() - lastAnalyzed.getTime() > RE_ANALYSIS_WINDOW)
		) {
			// Update status immediately to prevent re-triggers on refresh
			await updateRepositoryStatus(
				data.id,
				"queued",
				"Auto re-analysis triggered",
			);

			console.log(
				`[Dashboard] Triggering auto re-analysis for ${data.owner}/${data.name} (last: ${lastAnalyzed?.toISOString() ?? "never"})`,
			);
			await inngest.send({
				name: "analysis/repo.requested",
				data: {
					repoId: data.id,
					owner: data.owner,
					repo: data.name,
					branch: data.defaultBranch ?? "main",
					githubUrl:
						data.url ?? `https://github.com/${data.owner}/${data.name}`,
				},
			});
		}

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
