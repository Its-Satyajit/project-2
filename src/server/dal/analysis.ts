import { desc, eq } from "drizzle-orm";
import type { Static } from "elysia";
import type { dbSchema } from "../api/dbSchema";
import { db } from "../db";
import { analysisResults } from "../db/schema";

type Insert = Static<typeof dbSchema.analysisResults.insert>;

export async function insertAnalysisResults(data: Insert) {
	const [result] = await db
		.insert(analysisResults)
		.values(data)
		.onConflictDoUpdate({
			target: [analysisResults.repositoryId],
			set: data,
		})
		.returning();
	return result;
}

export async function getLatestAnalysis(repoId: string) {
	const [result] = await db
		.select()
		.from(analysisResults)
		.where(eq(analysisResults.repositoryId, repoId))
		.orderBy(desc(analysisResults.createdAt))
		.limit(1);
	return result;
}
