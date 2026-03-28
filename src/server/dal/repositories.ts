import { and, eq, ilike, or, sql } from "drizzle-orm";
import type { Static } from "elysia";
import type { dbSchema } from "../api/dbSchema";
import { db } from "../db";
import { analysisResults, repositories } from "../db/schema";

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
			analysisResults: true,
		},
	});
	if (!result) return null;
	return result;
}

export async function getRepositoryByOwnerAndName(owner: string, name: string) {
	const result = await db.query.repositories.findFirst({
		where: (t) => and(eq(t.owner, owner), eq(t.name, name)),
		with: {
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
			updatedAt: new Date(),
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
			avatarUrl: true,
		},
		with: {
			contributors: {
				limit: 1000,
				columns: { contributions: true },
			},
		},
	});
	return result.map((repo) => ({
		...repo,
		contributorCount: repo.contributors?.length ?? 0,
	}));
}

export interface GlobalStats {
	repositoriesAnalyzed: number;
	totalFiles: number;
	totalLines: number;
	contributors: number;
}

export async function getGlobalStats(): Promise<GlobalStats> {
	const [repoCount, analysisStats, contributorCount] = await Promise.all([
		db
			.select({ count: sql<number>`count(*)` })
			.from(repositories)
			.where(eq(repositories.analysisStatus, "complete")),
		db
			.select({
				totalFiles: sql<number>`coalesce(sum(${analysisResults.totalFiles}), 0)`,
				totalLines: sql<number>`coalesce(sum(${analysisResults.totalLines}), 0)`,
			})
			.from(analysisResults)
			.innerJoin(
				repositories,
				eq(repositories.id, analysisResults.repositoryId),
			)
			.where(eq(repositories.analysisStatus, "complete")),
		db
			.select({
				count: sql<number>`count(distinct ${repositories.owner}||'/'||${repositories.name})`,
			})
			.from(repositories)
			.where(eq(repositories.analysisStatus, "complete")),
	]);

	return {
		repositoriesAnalyzed: repoCount[0]?.count ?? 0,
		totalFiles: analysisStats[0]?.totalFiles ?? 0,
		totalLines: analysisStats[0]?.totalLines ?? 0,
		contributors: contributorCount[0]?.count ?? 0,
	};
}

export async function searchRepositories(query: string, limit: number = 10) {
	const searchPattern = `%${query}%`;
	const result = await db.query.repositories.findMany({
		where: (t) =>
			and(
				eq(t.analysisStatus, "complete"),
				or(
					ilike(t.fullName, searchPattern),
					ilike(t.name, searchPattern),
					ilike(t.owner, searchPattern),
					t.description ? ilike(t.description, searchPattern) : undefined,
				),
			),
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
			avatarUrl: true,
		},
		with: {
			contributors: {
				limit: 1000,
				columns: { contributions: true },
			},
		},
	});
	return result.map((repo) => ({
		...repo,
		contributorCount: repo.contributors?.length ?? 0,
	}));
}
