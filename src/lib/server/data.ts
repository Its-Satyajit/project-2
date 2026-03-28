"server-only";

import { and, desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import {
	getFilesByLanguage,
	getGlobalStats,
	getGrowthTimeline,
	getLanguageBreakdown,
	getLanguageLocVsFiles,
	getLicenseDistribution,
	getMostActiveContributors,
	getRepoSizeDistribution,
	getStarDistribution,
	getStarsForksDistribution,
	getTopContributors,
	getTopLanguagesByLoc,
	getTopRepos,
} from "~/server/dal/insights";
import {
	getRepositoryByOwnerAndName,
	getRepositoryData,
	getTopRepositoriesByStars,
} from "~/server/dal/repositories";
import { db } from "~/server/db";
import { repositories } from "~/server/db/schema";

/**
 * Cached fetch for top repositories (used on home page)
 * Revalidates every 60 seconds using use cache directive
 */
export async function getTopRepositories(limit: number = 10) {
	"use cache";
	cacheLife("minutes");
	cacheTag("repositories");
	return getTopRepositoriesByStars(limit);
}

/**
 * Cached fetch for repository data (used on dashboard)
 * Revalidates every 30 seconds for active repos
 */
export async function getCachedRepositoryData(repoId: string) {
	"use cache";
	cacheLife("minutes");
	cacheTag("repository", `repo-${repoId}`);
	return getRepositoryData(repoId);
}

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
export async function getCachedRepositoryWithAnalysis(repoId: string) {
	"use cache";
	cacheLife({ stale: 86400, revalidate: 86400, expire: 86400 });
	cacheTag("repository", "analysis", `repo-${repoId}`);
	return getRepositoryWithAnalysis(repoId);
}

/**
 * Cached version of repository lookup by owner/name
 * Uses 24h cache since repos aren't re-analyzed within 24h window
 */
export async function getCachedRepoByPath(owner: string, name: string) {
	"use cache";
	cacheLife({ stale: 86400, revalidate: 86400, expire: 86400 });
	cacheTag("repository", "analysis", `repo-${owner}-${name}`);
	return getRepoByPath(owner, name);
}

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
export async function getCachedRecentAnalyses(limit: number = 5) {
	"use cache";
	cacheLife("hours");
	cacheTag("repositories", "analysis");
	return getRecentAnalyses(limit);
}

/**
 * Cached global insights data (24h cache)
 * Aggregates statistics across all analyzed repositories
 */
export async function getCachedGlobalInsights() {
	"use cache";
	cacheLife({ stale: 86400, revalidate: 86400, expire: 86400 });
	cacheTag("insights");

	const [
		stats,
		languages,
		topRepos,
		topContributors,
		licenses,
		timeline,
		starDistribution,
		repoSizeDistribution,
		topLanguagesByLoc,
		starsForksData,
		filesByLanguage,
		languageLocVsFiles,
		mostActiveContributors,
	] = await Promise.all([
		getGlobalStats(),
		getLanguageBreakdown(),
		getTopRepos(10),
		getTopContributors(20),
		getLicenseDistribution(),
		getGrowthTimeline(),
		getStarDistribution(),
		getRepoSizeDistribution(),
		getTopLanguagesByLoc(10),
		getStarsForksDistribution(),
		getFilesByLanguage(),
		getLanguageLocVsFiles(),
		getMostActiveContributors(10),
	]);

	return {
		stats,
		languages,
		topRepos,
		topContributors,
		licenses,
		timeline,
		starDistribution,
		repoSizeDistribution,
		topLanguagesByLoc,
		starsForksData,
		filesByLanguage,
		languageLocVsFiles,
		mostActiveContributors,
	};
}
