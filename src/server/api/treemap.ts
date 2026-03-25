import { eq } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { fetchAnalysisData } from "../dal/s3";
import { db } from "../db";

export const treemapRoute = new Elysia().get(
	"/dashboard/:repoId/treemap",
	async ({ params, set }) => {
		const repoData = await db.query.repositories.findFirst({
			where: (t) => eq(t.id, params.repoId),
			with: {
				analysisResults: true,
			},
		});

		if (!repoData) {
			set.status = 404;
			return { error: "Repository not found" };
		}

		const analysis = repoData.analysisResults?.[0];
		if (!analysis || !analysis.s3StorageKey) {
			set.status = 404;
			return { error: "Analysis data not found" };
		}

		// Fetch the full blob from S3
		const analysisData = await fetchAnalysisData(analysis.s3StorageKey);

		const allFiles = analysisData.files || [];
		const nonDirFiles = allFiles.filter((f) => !f.isDirectory);

		const hotspotMap = new Map<
			string,
			{ score: number; fanIn: number; fanOut: number; loc: number }
		>();

		// Get LOC from dependency graph
		if (analysisData.dependencyGraph) {
			const graph = analysisData.dependencyGraph;
			for (const node of graph.nodes ?? []) {
				hotspotMap.set(node.path, {
					score: node.score ?? 0,
					fanIn: node.fanIn ?? 0,
					fanOut: node.fanOut ?? 0,
					loc: node.loc ?? 0,
				});
			}
		}

		// Also get hotspots data
		if (analysisData.hotSpotData) {
			for (const h of analysisData.hotSpotData) {
				const existing = hotspotMap.get(h.path);
				if (existing) {
					existing.score = h.score;
					existing.fanIn = h.fanIn;
					existing.fanOut = h.fanOut;
				} else {
					hotspotMap.set(h.path, {
						score: h.score,
						fanIn: h.fanIn,
						fanOut: h.fanOut,
						loc: 0,
					});
				}
			}
		}

		const treemapData = nonDirFiles.map((file) => {
			const hotspot = hotspotMap.get(file.path ?? "");
			const ext = file.extension ?? "";
			// Use LOC from dependency graph if available, otherwise fallback to files table dummy 0
			const loc = hotspot?.loc ?? file.linesCount ?? 0;
			return {
				id: file.id || Math.random().toString(),
				path: file.path ?? "",
				loc,
				extension: ext,
				hotspotScore: hotspot?.score ?? 0,
				fanIn: hotspot?.fanIn ?? 0,
				fanOut: hotspot?.fanOut ?? 0,
				isExternal: !hotspot,
			};
		});

		return {
			files: treemapData,
			totalFiles: treemapData.length,
			totalLoc: treemapData.reduce((sum: number, f) => sum + f.loc, 0),
		};
	},
	{
		params: t.Object({
			repoId: t.String(),
		}),
	},
);
