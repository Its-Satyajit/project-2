import { eq } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { db } from "../db";
import { analysisResults, files, repositories } from "../db/schema";

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

		const allFiles = await db
			.select({
				id: files.id,
				path: files.path,
				linesCount: files.linesCount,
				extension: files.extension,
				isDirectory: files.isDirectory,
			})
			.from(files)
			.where(eq(files.repositoryId, params.repoId));

		const nonDirFiles = allFiles.filter((f) => !f.isDirectory);

		const hotspotMap = new Map<
			string,
			{ score: number; fanIn: number; fanOut: number; loc: number }
		>();
		const analysis = repoData.analysisResults?.[0];

		// Get LOC from dependency graph
		if (analysis?.dependencyGraphJson) {
			const graph = analysis.dependencyGraphJson as {
				nodes: Array<{
					path: string;
					loc: number;
					score?: number;
					fanIn?: number;
					fanOut?: number;
				}>;
			};
			for (const node of graph.nodes ?? []) {
				hotspotMap.set(node.path, {
					score: node.score ?? 0,
					fanIn: node.fanIn ?? 0,
					fanOut: node.fanOut ?? 0,
					loc: node.loc ?? 0,
				});
			}
		}

		// Also get hotspots data for files with scores
		if (analysis?.hotSpotDataJson) {
			const hotspots = analysis.hotSpotDataJson as Array<{
				path: string;
				score: number;
				fanIn: number;
				fanOut: number;
			}>;
			for (const h of hotspots) {
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
			// Use LOC from dependency graph if available, otherwise fallback to files table
			const loc = hotspot?.loc ?? file.linesCount ?? 0;
			return {
				id: file.id,
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
			totalLoc: treemapData.reduce((sum, f) => sum + f.loc, 0),
		};
	},
	{
		params: t.Object({
			repoId: t.String(),
		}),
	},
);
