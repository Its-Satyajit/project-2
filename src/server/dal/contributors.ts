import { desc, eq } from "drizzle-orm";
import type { Static } from "elysia";
import type { dbSchema } from "../api/dbSchema";
import { db } from "../db";
import { contributors } from "../db/schema";

type Insert = Static<typeof dbSchema.contributors.insert>;

export async function insertContributors(data: Insert | Insert[] | null | undefined) {
	if (!data) return;
	const values = Array.isArray(data) ? data : [data];
	if (values.length === 0) return;
	await db.insert(contributors).values(values);
}

export async function getContributors(
	repositoryId: string,
	sort: "contributions" | "newest" = "contributions",
	limit: number = 100,
) {
	const query = db
		.select()
		.from(contributors)
		.where(eq(contributors.repositoryId, repositoryId));

	if (sort === "newest") {
		return query.orderBy(desc(contributors.createdAt)).limit(limit);
	}
	return query.orderBy(desc(contributors.contributions)).limit(limit);
}

export async function getContributorByLogin(
	repositoryId: string,
	githubLogin: string,
) {
	const result = await db
		.select()
		.from(contributors)
		.where(
			eq(contributors.repositoryId, repositoryId) &&
				eq(contributors.githubLogin, githubLogin),
		);
	return result[0] ?? null;
}

export async function getContributorCount(repositoryId: string) {
	const result = await db
		.select({ count: contributors.id })
		.from(contributors)
		.where(eq(contributors.repositoryId, repositoryId));
	return result.length;
}

export async function upsertContributors(
	data: Array<{
		repositoryId: string;
		githubLogin: string;
		avatarUrl?: string | null;
		htmlUrl?: string | null;
		contributions: number;
		firstContributionAt?: Date | null;
		lastContributionAt?: Date | null;
	}>,
) {
	for (const contributor of data) {
		const existing = await getContributorByLogin(
			contributor.repositoryId,
			contributor.githubLogin,
		);
		if (existing) {
			await db
				.update(contributors)
				.set({
					avatarUrl: contributor.avatarUrl,
					htmlUrl: contributor.htmlUrl,
					contributions: contributor.contributions,
					firstContributionAt: contributor.firstContributionAt,
					lastContributionAt: contributor.lastContributionAt,
					updatedAt: new Date(),
				})
				.where(eq(contributors.id, existing.id));
		} else {
			await db.insert(contributors).values(contributor);
		}
	}
}

export async function deleteContributorsByRepoId(repositoryId: string) {
	await db
		.delete(contributors)
		.where(eq(contributors.repositoryId, repositoryId));
}
