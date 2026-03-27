import { desc, eq } from "drizzle-orm";
import type { MetadataRoute } from "next";
import { env } from "~/env";
import { db } from "~/server/db";
import { repositories } from "~/server/db/schema";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = env.NEXT_PUBLIC_BASE_URL;
	const currentDate = new Date();

	// Static pages
	const staticPages: MetadataRoute.Sitemap = [
		{
			url: baseUrl,
			lastModified: currentDate,
			changeFrequency: "daily",
			priority: 1,
		},
		{
			url: `${baseUrl}/features`,
			lastModified: currentDate,
			changeFrequency: "weekly",
			priority: 0.9,
		},
		{
			url: `${baseUrl}/about`,
			lastModified: currentDate,
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: `${baseUrl}/legal`,
			lastModified: currentDate,
			changeFrequency: "monthly",
			priority: 0.3,
		},
	];

	// Fetch all analyzed repositories
	const analyzedRepos = await db
		.select({
			owner: repositories.owner,
			name: repositories.name,
			updatedAt: repositories.updatedAt,
		})
		.from(repositories)
		.where(eq(repositories.analysisStatus, "complete"))
		.orderBy(desc(repositories.updatedAt))
		.limit(1000); // Limit to prevent sitemap from being too large

	// Generate repository pages
	const repoPages: MetadataRoute.Sitemap = analyzedRepos.flatMap((repo) => [
		{
			url: `${baseUrl}/${repo.owner}/${repo.name}`,
			lastModified: repo.updatedAt ?? currentDate,
			changeFrequency: "weekly" as const,
			priority: 0.7,
		},
		{
			url: `${baseUrl}/${repo.owner}/${repo.name}/analysis`,
			lastModified: repo.updatedAt ?? currentDate,
			changeFrequency: "weekly" as const,
			priority: 0.6,
		},
	]);

	return [...staticPages, ...repoPages];
}
