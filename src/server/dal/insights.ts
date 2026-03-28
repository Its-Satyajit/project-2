import { count, desc, eq, sql, sum } from "drizzle-orm";
import { db } from "../db";
import {
	analysisResults,
	githubUsers,
	repositories,
	repositoryContributors,
} from "../db/schema";

/**
 * Get global statistics across all analyzed repositories
 */
export async function getGlobalStats(): Promise<{
	totalRepos: number;
	totalLines: number;
	totalFiles: number;
	totalDirectories: number;
	totalContributors: number;
	avgLinesPerRepo: number;
	avgFilesPerRepo: number;
	avgLocPerFile: number;
}> {
	const [repoStats] = await db
		.select({
			totalRepos: count(),
			totalLines: sum(analysisResults.totalLines),
			totalFiles: sum(analysisResults.totalFiles),
			totalDirectories: sum(analysisResults.totalDirectories),
		})
		.from(repositories)
		.leftJoin(
			analysisResults,
			eq(repositories.id, analysisResults.repositoryId),
		)
		.where(eq(repositories.analysisStatus, "complete"));

	const [contributorStats] = await db
		.select({
			totalContributors: count(),
		})
		.from(repositoryContributors)
		.innerJoin(
			repositories,
			eq(repositoryContributors.repositoryId, repositories.id),
		)
		.where(eq(repositories.analysisStatus, "complete"));

	const totalRepos = Number(repoStats?.totalRepos) || 0;
	const totalLines = Number(repoStats?.totalLines) || 0;
	const totalFiles = Number(repoStats?.totalFiles) || 0;
	const totalDirectories = Number(repoStats?.totalDirectories) || 0;

	return {
		totalRepos,
		totalLines,
		totalFiles,
		totalDirectories,
		totalContributors: Number(contributorStats?.totalContributors) || 0,
		avgLinesPerRepo: totalRepos > 0 ? Math.round(totalLines / totalRepos) : 0,
		avgFilesPerRepo: totalRepos > 0 ? Math.round(totalFiles / totalRepos) : 0,
		avgLocPerFile: totalFiles > 0 ? Math.round(totalLines / totalFiles) : 0,
	};
}

/**
 * Get language breakdown with counts and total lines
 */
export async function getLanguageBreakdown(): Promise<
	Array<{
		language: string;
		count: number;
		totalLines: number;
	}>
> {
	const results = await db
		.select({
			language: repositories.primaryLanguage,
			count: count(),
			totalLines: sum(analysisResults.totalLines),
		})
		.from(repositories)
		.innerJoin(
			analysisResults,
			eq(repositories.id, analysisResults.repositoryId),
		)
		.where(eq(repositories.analysisStatus, "complete"))
		.groupBy(repositories.primaryLanguage)
		.orderBy(desc(count()));

	return results.map((r) => ({
		language: r.language || "Unknown",
		count: Number(r.count) || 0,
		totalLines: Number(r.totalLines) || 0,
	}));
}

/**
 * Get top repositories by stars with analysis stats
 */
export async function getTopRepos(limit: number = 10): Promise<
	Array<{
		id: string;
		owner: string;
		name: string;
		fullName: string;
		stars: number;
		forks: number;
		primaryLanguage: string | null;
		totalLines: number;
		totalFiles: number;
	}>
> {
	const results = await db
		.select({
			id: repositories.id,
			owner: repositories.owner,
			name: repositories.name,
			fullName: repositories.fullName,
			stars: repositories.stars,
			forks: repositories.forks,
			primaryLanguage: repositories.primaryLanguage,
			totalLines: analysisResults.totalLines,
			totalFiles: analysisResults.totalFiles,
		})
		.from(repositories)
		.leftJoin(
			analysisResults,
			eq(repositories.id, analysisResults.repositoryId),
		)
		.where(eq(repositories.analysisStatus, "complete"))
		.orderBy(desc(repositories.stars))
		.limit(limit);

	return results.map((r) => ({
		id: r.id,
		owner: r.owner,
		name: r.name,
		fullName: r.fullName,
		stars: r.stars || 0,
		forks: r.forks || 0,
		primaryLanguage: r.primaryLanguage,
		totalLines: Number(r.totalLines) || 0,
		totalFiles: Number(r.totalFiles) || 0,
	}));
}

/**
 * Get top contributors across all repositories
 */
export async function getTopContributors(limit: number = 20): Promise<
	Array<{
		id: string;
		githubLogin: string;
		avatarUrl: string | null;
		totalContributions: number;
		repoCount: number;
	}>
> {
	const results = await db
		.select({
			id: githubUsers.id,
			githubLogin: githubUsers.githubLogin,
			avatarUrl: githubUsers.avatarUrl,
			totalContributions: sum(repositoryContributors.contributions),
			repoCount: count(),
		})
		.from(repositoryContributors)
		.innerJoin(githubUsers, eq(repositoryContributors.userId, githubUsers.id))
		.innerJoin(
			repositories,
			eq(repositoryContributors.repositoryId, repositories.id),
		)
		.where(eq(repositories.analysisStatus, "complete"))
		.groupBy(githubUsers.id, githubUsers.githubLogin, githubUsers.avatarUrl)
		.orderBy(desc(sum(repositoryContributors.contributions)))
		.limit(limit);

	return results.map((r) => ({
		id: r.id,
		githubLogin: r.githubLogin,
		avatarUrl: r.avatarUrl,
		totalContributions: Number(r.totalContributions) || 0,
		repoCount: Number(r.repoCount) || 0,
	}));
}

/**
 * Get license distribution across all repositories
 */
export async function getLicenseDistribution(): Promise<
	Array<{
		license: string;
		count: number;
	}>
> {
	const results = await db
		.select({
			license: repositories.license,
			count: count(),
		})
		.from(repositories)
		.where(eq(repositories.analysisStatus, "complete"))
		.groupBy(repositories.license)
		.orderBy(desc(count()));

	return results.map((r) => ({
		license: r.license || "None",
		count: Number(r.count) || 0,
	}));
}

/**
 * Get growth timeline - repos added by month
 */
export async function getGrowthTimeline(): Promise<
	Array<{
		month: string;
		count: number;
	}>
> {
	const results = await db
		.select({
			month: sql<string>`TO_CHAR(${repositories.createdAt}, 'YYYY-MM')`,
			count: count(),
		})
		.from(repositories)
		.where(eq(repositories.analysisStatus, "complete"))
		.groupBy(sql`TO_CHAR(${repositories.createdAt}, 'YYYY-MM')`)
		.orderBy(sql`TO_CHAR(${repositories.createdAt}, 'YYYY-MM')`);

	return results.map((r) => ({
		month: r.month,
		count: Number(r.count) || 0,
	}));
}

/**
 * Get star distribution - repos grouped by star ranges
 */
export async function getStarDistribution(): Promise<
	Array<{
		range: string;
		count: number;
	}>
> {
	const results = await db
		.select({
			stars: repositories.stars,
		})
		.from(repositories)
		.where(eq(repositories.analysisStatus, "complete"));

	// Group into ranges client-side
	const ranges: { [key: string]: number } = {};
	ranges["0-100"] = 0;
	ranges["100-1K"] = 0;
	ranges["1K-10K"] = 0;
	ranges["10K-100K"] = 0;
	ranges["100K+"] = 0;

	for (const row of results) {
		const stars = row.stars ?? 0;
		if (stars < 100) ranges["0-100"]++;
		else if (stars < 1000) ranges["100-1K"]++;
		else if (stars < 10000) ranges["1K-10K"]++;
		else if (stars < 100000) ranges["10K-100K"]++;
		else ranges["100K+"]++;
	}

	return Object.entries(ranges).map(([range, count]) => ({ range, count }));
}

/**
 * Get repo size distribution - repos grouped by LOC ranges
 */
export async function getRepoSizeDistribution(): Promise<
	Array<{
		size: string;
		count: number;
	}>
> {
	const results = await db
		.select({
			totalLines: analysisResults.totalLines,
		})
		.from(analysisResults)
		.innerJoin(repositories, eq(analysisResults.repositoryId, repositories.id))
		.where(eq(repositories.analysisStatus, "complete"));

	// Group into ranges
	const sizes: { [key: string]: number } = {};
	sizes["Tiny (<1K)"] = 0;
	sizes["Small (1K-10K)"] = 0;
	sizes["Medium (10K-100K)"] = 0;
	sizes["Large (100K-500K)"] = 0;
	sizes["Massive (500K+)"] = 0;

	for (const row of results) {
		const loc = Number(row.totalLines) || 0;
		if (loc < 1000) sizes["Tiny (<1K)"]++;
		else if (loc < 10000) sizes["Small (1K-10K)"]++;
		else if (loc < 100000) sizes["Medium (10K-100K)"]++;
		else if (loc < 500000) sizes["Large (100K-500K)"]++;
		else sizes["Massive (500K+)"]++;
	}

	return Object.entries(sizes).map(([size, count]) => ({ size, count }));
}

/**
 * Get top languages by total LOC
 */
export async function getTopLanguagesByLoc(limit: number = 10): Promise<
	Array<{
		language: string;
		totalLines: number;
		repoCount: number;
	}>
> {
	const results = await db
		.select({
			language: repositories.primaryLanguage,
			totalLines: sum(analysisResults.totalLines),
			repoCount: count(),
		})
		.from(repositories)
		.innerJoin(
			analysisResults,
			eq(repositories.id, analysisResults.repositoryId),
		)
		.where(eq(repositories.analysisStatus, "complete"))
		.groupBy(repositories.primaryLanguage)
		.orderBy(desc(sum(analysisResults.totalLines)))
		.limit(limit);

	return results.map((r) => ({
		language: r.language || "Unknown",
		totalLines: Number(r.totalLines) || 0,
		repoCount: Number(r.repoCount) || 0,
	}));
}

/**
 * Get stars vs forks distribution for scatter data
 */
export async function getStarsForksDistribution(): Promise<
	Array<{
		name: string;
		owner: string;
		stars: number;
		forks: number;
		language: string | null;
	}>
> {
	const results = await db
		.select({
			owner: repositories.owner,
			name: repositories.name,
			stars: repositories.stars,
			forks: repositories.forks,
			primaryLanguage: repositories.primaryLanguage,
		})
		.from(repositories)
		.where(eq(repositories.analysisStatus, "complete"))
		.orderBy(desc(repositories.stars))
		.limit(50);

	return results.map((r) => ({
		name: r.name,
		owner: r.owner,
		stars: r.stars || 0,
		forks: r.forks || 0,
		language: r.primaryLanguage,
	}));
}

/**
 * Get files count by language across all repos
 */
export async function getFilesByLanguage(): Promise<
	Array<{
		language: string;
		totalFiles: number;
		totalDirs: number;
		repoCount: number;
	}>
> {
	const results = await db
		.select({
			language: repositories.primaryLanguage,
			totalFiles: sum(analysisResults.totalFiles),
			totalDirs: sum(analysisResults.totalDirectories),
			repoCount: count(),
		})
		.from(repositories)
		.innerJoin(
			analysisResults,
			eq(repositories.id, analysisResults.repositoryId),
		)
		.where(eq(repositories.analysisStatus, "complete"))
		.groupBy(repositories.primaryLanguage)
		.orderBy(desc(sum(analysisResults.totalFiles)));

	return results.map((r) => ({
		language: r.language || "Unknown",
		totalFiles: Number(r.totalFiles) || 0,
		totalDirs: Number(r.totalDirs) || 0,
		repoCount: Number(r.repoCount) || 0,
	}));
}

/**
 * Get language LOC vs Files scatter data
 */
export async function getLanguageLocVsFiles(): Promise<
	Array<{
		language: string;
		loc: number;
		files: number;
		repos: number;
	}>
> {
	const results = await db
		.select({
			language: repositories.primaryLanguage,
			loc: sum(analysisResults.totalLines),
			files: sum(analysisResults.totalFiles),
			repos: count(),
		})
		.from(repositories)
		.innerJoin(
			analysisResults,
			eq(repositories.id, analysisResults.repositoryId),
		)
		.where(eq(repositories.analysisStatus, "complete"))
		.groupBy(repositories.primaryLanguage);

	return results.map((r) => ({
		language: r.language || "Unknown",
		loc: Number(r.loc) || 0,
		files: Number(r.files) || 0,
		repos: Number(r.repos) || 0,
	}));
}

/**
 * Get top contributors by number of repos contributed to
 */
export async function getMostActiveContributors(limit: number = 10): Promise<
	Array<{
		githubLogin: string;
		avatarUrl: string | null;
		repoCount: number;
		totalContributions: number;
	}>
> {
	const results = await db
		.select({
			githubLogin: githubUsers.githubLogin,
			avatarUrl: githubUsers.avatarUrl,
			repoCount: count(),
			totalContributions: sum(repositoryContributors.contributions),
		})
		.from(repositoryContributors)
		.innerJoin(githubUsers, eq(repositoryContributors.userId, githubUsers.id))
		.innerJoin(
			repositories,
			eq(repositoryContributors.repositoryId, repositories.id),
		)
		.where(eq(repositories.analysisStatus, "complete"))
		.groupBy(githubUsers.id, githubUsers.githubLogin, githubUsers.avatarUrl)
		.orderBy(desc(count()))
		.limit(limit);

	return results.map((r) => ({
		githubLogin: r.githubLogin,
		avatarUrl: r.avatarUrl,
		repoCount: Number(r.repoCount) || 0,
		totalContributions: Number(r.totalContributions) || 0,
	}));
}
