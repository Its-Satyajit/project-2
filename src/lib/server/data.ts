"server-only";

import { and, desc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import {
	getRepositoryByOwnerAndName,
	getRepositoryData,
	getTopRepositoriesByStars,
} from "~/server/dal/repositories";
import { db } from "~/server/db";
import { repositories } from "~/server/db/schema";

/**
 * Cached fetch for top repositories (used on home page)
 * Revalidates every 60 seconds
 */
export const getTopRepositories = unstable_cache(
	async (limit: number = 10) => {
		return getTopRepositoriesByStars(limit);
	},
	["top-repositories"],
	{
		revalidate: 60,
		tags: ["repositories"],
	},
);

/**
 * Cached fetch for repository data (used on dashboard)
 * Revalidates every 30 seconds for active repos
 */
export const getCachedRepositoryData = unstable_cache(
	async (repoId: string) => {
		return getRepositoryData(repoId);
	},
	["repository-data"],
	{
		revalidate: 30,
		tags: ["repository"],
	},
);

/**
 * Get repository with analysis results for dashboard
 */
export async function getRepositoryWithAnalysis(repoId: string) {
	const result = await db.query.repositories.findFirst({
		where: (t) => eq(t.id, repoId),
		with: {
			analysisResults: true,
			contributors: {
				limit: 10,
				orderBy: (t, { desc }) => [desc(t.contributions)],
				with: {
					user: true,
				},
			},
		},
	});

	if (!result) return null;

	return {
		...result,
		contributorCount: result.contributors?.length ?? 0,
	};
}

/**
 * Get repository by owner and name (for /[owner]/[repo] URLs)
 */
export async function getRepoByPath(owner: string, name: string) {
	const result = await db.query.repositories.findFirst({
		where: (t) => and(eq(t.owner, owner), eq(t.name, name)),
		with: {
			analysisResults: true,
			contributors: {
				limit: 10,
				orderBy: (t, { desc }) => [desc(t.contributions)],
				with: {
					user: true,
				},
			},
		},
	});

	if (!result) return null;

	return {
		...result,
		contributorCount: result.contributors?.length ?? 0,
	};
}

/**
 * Cached version of repository with analysis
 */
export const getCachedRepositoryWithAnalysis = unstable_cache(
	async (repoId: string) => {
		return getRepositoryWithAnalysis(repoId);
	},
	["repository-with-analysis"],
	{
		revalidate: 30,
		tags: ["repository", "analysis"],
	},
);

/**
 * Cached version of repository lookup by owner/name
 */
export const getCachedRepoByPath = unstable_cache(
	async (owner: string, name: string) => {
		return getRepoByPath(owner, name);
	},
	["repo-by-path"],
	{
		revalidate: 30,
		tags: ["repository", "analysis"],
	},
);

/**
 * Get recent analyses for home page (most recently analyzed repos)
 */
export async function getRecentAnalyses(limit: number = 5) {
	const result = await db.query.repositories.findMany({
		where: (t) => eq(t.analysisStatus, "complete"),
		orderBy: [desc(repositories.updatedAt)],
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
			avatarUrl: true,
			updatedAt: true,
		},
		with: {
			analysisResults: {
				columns: {
					totalFiles: true,
					totalLines: true,
					totalDirectories: true,
				},
			},
		},
	});

	return result;
}

/**
 * Cached version of recent analyses
 */
export const getCachedRecentAnalyses = unstable_cache(
	async (limit: number = 5) => {
		return getRecentAnalyses(limit);
	},
	["recent-analyses"],
	{
		revalidate: 120,
		tags: ["repositories", "analysis"],
	},
);
