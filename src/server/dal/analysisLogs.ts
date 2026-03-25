import { eq, gte, inArray, lte } from "drizzle-orm";
import type { Static } from "elysia";
import type { dbSchema } from "../api/dbSchema";
import { db } from "../db";
import {
	analysisLogs,
	analysisResults,
	repositories,
} from "../db/schema";

type Insert = Static<typeof dbSchema.analysisLogs.insert>;

export async function insertLog(data: Insert) {
	await db.insert(analysisLogs).values(data);
}

export async function getLogsByRepoId(repoId: string) {
	return db
		.select()
		.from(analysisLogs)
		.where(eq(analysisLogs.repositoryId, repoId))
		.orderBy(analysisLogs.createdAt);
}

export async function getRecentLogs(days: number = 7) {
	const cutoff = new Date();
	cutoff.setDate(cutoff.getDate() - days);
	return db
		.select()
		.from(analysisLogs)
		.where(gte(analysisLogs.createdAt, cutoff))
		.orderBy(analysisLogs.createdAt);
}

export async function deleteOldLogs(days: number = 7) {
	const cutoff = new Date();
	cutoff.setDate(cutoff.getDate() - days);
	const result = await db
		.delete(analysisLogs)
		.where(lte(analysisLogs.createdAt, cutoff))
		.returning({ id: analysisLogs.id });
	return result.length;
}

export async function deleteOldAnalysisData(days: number = 7) {
	const cutoff = new Date();
	cutoff.setDate(cutoff.getDate() - days);

	const oldRepos = await db
		.select({ id: repositories.id })
		.from(repositories)
		.where(lte(repositories.createdAt, cutoff));

	if (oldRepos.length === 0) {
		return {
			deletedRepos: 0,
			deletedResults: 0,
			deletedLogs: 0,
		};
	}

	const repoIds = oldRepos.map((r) => r.id);

	const logsResult = await db
		.delete(analysisLogs)
		.where(inArray(analysisLogs.repositoryId, repoIds))
		.returning({ id: analysisLogs.id });

	const resultsResult = await db
		.delete(analysisResults)
		.where(inArray(analysisResults.repositoryId, repoIds))
		.returning({ id: analysisResults.id });

	const reposResult = await db
		.delete(repositories)
		.where(inArray(repositories.id, repoIds))
		.returning({ id: repositories.id });

	return {
		deletedRepos: reposResult.length,
		deletedLogs: logsResult.length,
		deletedResults: resultsResult.length,
	};
}
