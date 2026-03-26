import { and, count, desc, eq } from "drizzle-orm";
import { db } from "../db";
import { githubUsers, repositoryContributors } from "../db/schema";

export async function getContributors(
	repositoryId: string,
	sort: "contributions" | "newest" = "contributions",
	limit: number = 100,
) {
	const query = db
		.select({
			id: repositoryContributors.id,
			githubLogin: githubUsers.githubLogin,
			avatarUrl: githubUsers.avatarUrl,
			htmlUrl: githubUsers.htmlUrl,
			contributions: repositoryContributors.contributions,
			firstContributionAt: repositoryContributors.firstContributionAt,
			lastContributionAt: repositoryContributors.lastContributionAt,
			createdAt: repositoryContributors.createdAt,
			updatedAt: repositoryContributors.updatedAt,
		})
		.from(repositoryContributors)
		.innerJoin(githubUsers, eq(repositoryContributors.userId, githubUsers.id))
		.where(eq(repositoryContributors.repositoryId, repositoryId));

	if (sort === "newest") {
		return query.orderBy(desc(repositoryContributors.createdAt)).limit(limit);
	}
	return query.orderBy(desc(repositoryContributors.contributions)).limit(limit);
}
export async function getContributorByLogin(
	repositoryId: string,
	githubLogin: string,
) {
	const [result] = await db
		.select({
			id: repositoryContributors.id,
			githubLogin: githubUsers.githubLogin,
			avatarUrl: githubUsers.avatarUrl,
			htmlUrl: githubUsers.htmlUrl,
			contributions: repositoryContributors.contributions,
			firstContributionAt: repositoryContributors.firstContributionAt,
			lastContributionAt: repositoryContributors.lastContributionAt,
			createdAt: repositoryContributors.createdAt,
			updatedAt: repositoryContributors.updatedAt,
		})
		.from(repositoryContributors)
		.innerJoin(githubUsers, eq(repositoryContributors.userId, githubUsers.id))
		.where(
			and(
				eq(repositoryContributors.repositoryId, repositoryId),
				eq(githubUsers.githubLogin, githubLogin),
			),
		);
	return result ?? null;
}

export async function getContributorCount(repositoryId: string) {
	const [result] = await db
		.select({ value: count() })
		.from(repositoryContributors)
		.where(eq(repositoryContributors.repositoryId, repositoryId));
	return result?.value ?? 0;
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
	for (const item of data) {
		// 1. Ensure global user exists (Normalization)
		const [user] = await db
			.insert(githubUsers)
			.values({
				githubLogin: item.githubLogin,
				avatarUrl: item.avatarUrl,
				htmlUrl: item.htmlUrl,
			})
			.onConflictDoUpdate({
				target: githubUsers.githubLogin,
				set: {
					avatarUrl: item.avatarUrl,
					htmlUrl: item.htmlUrl,
					updatedAt: new Date(),
				},
			})
			.returning({ id: githubUsers.id });

		if (!user) continue;

		// 2. Link user to repository with metrics
		await db
			.insert(repositoryContributors)
			.values({
				repositoryId: item.repositoryId,
				userId: user.id,
				contributions: item.contributions,
				firstContributionAt: item.firstContributionAt,
				lastContributionAt: item.lastContributionAt,
			})
			.onConflictDoUpdate({
				target: [
					repositoryContributors.repositoryId,
					repositoryContributors.userId,
				],
				set: {
					contributions: item.contributions,
					firstContributionAt: item.firstContributionAt,
					lastContributionAt: item.lastContributionAt,
					updatedAt: new Date(),
				},
			});
	}
}

export async function deleteContributorsByRepoId(repositoryId: string) {
	await db
		.delete(repositoryContributors)
		.where(eq(repositoryContributors.repositoryId, repositoryId));
}

