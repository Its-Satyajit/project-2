import "server-only";
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
