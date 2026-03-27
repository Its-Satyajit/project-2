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
		const lastUpdated = data.updatedAt ? new Date(data.updatedAt) : null;
		const hoursSinceUpdate = lastUpdated
			? (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60)
			: null;
		const timeDiff = lastUpdated ? now.getTime() - lastUpdated.getTime() : null;
		const isWithinWindow = timeDiff !== null && timeDiff <= RE_ANALYSIS_WINDOW;

		console.log(
			`[Dashboard] Repo: ${data.owner}/${data.name}, Status: ${data.analysisStatus}, ` +
				`Repository updatedAt: ${lastUpdated?.toISOString() ?? "never"}, ` +
				`Hours ago: ${hoursSinceUpdate?.toFixed(1) ?? "N/A"}, ` +
				`Time diff: ${timeDiff ? (timeDiff / 1000 / 60).toFixed(1) + "min" : "N/A"}, ` +
				`Within 24h cooldown: ${isWithinWindow}`,
		);

		// Trigger re-analysis if:
		// 1. Status is 'complete'
		// 2. Repository hasn't been updated in the last 24h
		// 3. OR there are no analysis results (something went wrong)
		const shouldReanalyze =
			data.analysisStatus === "complete" &&
			(!lastUpdated ||
				isNaN(lastUpdated.getTime()) ||
				now.getTime() - lastUpdated.getTime() > RE_ANALYSIS_WINDOW ||
				!result);

		console.log(`[Dashboard] shouldReanalyze: ${shouldReanalyze}`);

		if (shouldReanalyze) {
			// Update status immediately to prevent re-triggers on refresh
			console.log(
				`[Dashboard] Re-analysis triggered for ${data.owner}/${data.name}`,
			);
			await updateRepositoryStatus(
				data.id,
				"queued",
				"Auto re-analysis triggered",
			);

			console.log(
				`[Dashboard] Triggering auto re-analysis for ${data.owner}/${data.name} (last updated: ${lastUpdated?.toISOString() ?? "never"})`,
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
		} else {
			console.log(
				`[Dashboard] Re-analysis skipped for ${data.owner}/${data.name}: within 24h cooldown`,
			);
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
