import { eq } from "drizzle-orm";
import type { Static } from "elysia";
import type { dbSchema } from "../api/dbSchema";
import { db } from "../db";
import { repositories } from "../db/schema";

type Insert = Static<typeof dbSchema.repositories.insert>;
export async function insertRepositories(data: Insert) {
	const [repo] = await db
		.insert(repositories)
		.values(data)
		.onConflictDoUpdate({
			target: [repositories.owner, repositories.name],
			set: data,
		})
		.returning();
	return repo;
}

export async function getRepositoryData(repoId: string) {
	const result = await db.query.repositories.findFirst({
		where: (t) => eq(t.id, repoId),
		with: {
			files: true,
			analysisResults: true,
		},
	});
	if (!result) return null;
	return result;
}

export async function updateRepositoryStatus(
	repoId: string,
	status: string,
	phase?: string,
) {
	await db
		.update(repositories)
		.set({
			analysisStatus: status,
			analysisPhase: phase ?? null,
		})
		.where(eq(repositories.id, repoId));
}

export async function getTopRepositoriesByStars(limit: number = 10) {
	const result = await db.query.repositories.findMany({
		where: (t) => eq(t.analysisStatus, "complete"),
		orderBy: (t, { desc }) => [desc(t.stars)],
		limit,
		columns: {
			id: true,
			owner: true,
			name: true,
			fullName: true,
			description: true,
			stars: true,
			forks: true,
			primaryLanguage: true,
			analysisStatus: true,
		},
	});
	return result;
}
