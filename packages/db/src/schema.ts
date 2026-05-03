import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	json,
	pgTable,
	pgTableCreator,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `pg-drizzle_${name}`);

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified")
		.$defaultFn(() => false)
		.notNull(),
	image: text("image"),
	createdAt: timestamp("created_at")
		.$defaultFn(() => /* @__PURE__ */ new Date())
		.notNull(),
	updatedAt: timestamp("updated_at")
		.$defaultFn(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").$defaultFn(
		() => /* @__PURE__ */ new Date(),
	),
	updatedAt: timestamp("updated_at").$defaultFn(
		() => /* @__PURE__ */ new Date(),
	),
});

export const userRelations = relations(user, ({ many }) => ({
	account: many(account),
	session: many(session),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const repositories = pgTable(
	"repositories",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id").references(() => user.id),
		owner: text("owner").notNull(),
		name: text("name").notNull(),
		fullName: text("full_name").notNull(),
		url: text("url"),
		description: text("description"),
		defaultBranch: text("default_branch"),
		primaryLanguage: text("primary_language"),
		isPrivate: boolean("is_private").default(false),
		stars: integer("stars"),
		forks: integer("forks"),
		avatarUrl: text("avatar_url"),
		license: text("license"),
		analysisStatus: text("analysis_status").default("pending"),
		analysisPhase: text("analysis_phase"),
		createdAt: timestamp("created_at")
			.$defaultFn(() => /* @__PURE__ */ new Date())
			.notNull(),
		updatedAt: timestamp("updated_at")
			.$defaultFn(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(t) => [
		unique().on(t.owner, t.name),
		index("repositories_user_id_idx").on(t.userId),
	],
);

export const repositoriesRelations = relations(repositories, ({ many }) => ({
	analysisResults: many(analysisResults),
	contributors: many(repositoryContributors),
}));

export const analysisResults = pgTable(
	"analysis_results",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		repositoryId: uuid("repository_id").references(() => repositories.id),
		s3StorageKey: text("s3_storage_key"),
		totalFiles: integer("total_files"),
		totalDirectories: integer("total_directories"),
		totalLines: integer("total_lines"),
		summaryText: text("summary_text"),
		createdAt: timestamp("created_at")
			.$defaultFn(() => /* @__PURE__ */ new Date())
			.notNull(),
		updatedAt: timestamp("updated_at")
			.$defaultFn(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(t) => [unique().on(t.repositoryId)],
);

export const analysisResultsRelations = relations(
	analysisResults,
	({ one }) => ({
		repositories: one(repositories, {
			fields: [analysisResults.repositoryId],
			references: [repositories.id],
		}),
	}),
);

export const analysisLogs = pgTable(
	"analysis_logs",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		repositoryId: uuid("repository_id").references(() => repositories.id),
		event: text("event").notNull(),
		status: text("status").notNull(),
		phase: text("phase"),
		message: text("message"),
		metadata: json("metadata"),
		durationMs: integer("duration_ms"),
		createdAt: timestamp("created_at")
			.$defaultFn(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(t) => [
		index("analysis_logs_repo_id_idx").on(t.repositoryId),
		index("analysis_logs_created_at_idx").on(t.createdAt),
	],
);

export const analysisLogsRelations = relations(analysisLogs, ({ one }) => ({
	repositories: one(repositories, {
		fields: [analysisLogs.repositoryId],
		references: [repositories.id],
	}),
}));

export const githubUsers = pgTable("github_users", {
	id: uuid("id").defaultRandom().primaryKey(),
	githubLogin: text("github_login").notNull().unique(),
	avatarUrl: text("avatar_url"),
	htmlUrl: text("html_url"),
	createdAt: timestamp("created_at")
		.$defaultFn(() => /* @__PURE__ */ new Date())
		.notNull(),
	updatedAt: timestamp("updated_at")
		.$defaultFn(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const repositoryContributors = pgTable(
	"repository_contributors",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		repositoryId: uuid("repository_id").references(() => repositories.id, {
			onDelete: "cascade",
		}),
		userId: uuid("user_id").references(() => githubUsers.id, {
			onDelete: "cascade",
		}),
		contributions: integer("contributions").default(0),
		firstContributionAt: timestamp("first_contribution_at"),
		lastContributionAt: timestamp("last_contribution_at"),
		createdAt: timestamp("created_at")
			.$defaultFn(() => /* @__PURE__ */ new Date())
			.notNull(),
		updatedAt: timestamp("updated_at")
			.$defaultFn(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(t) => [
		unique().on(t.repositoryId, t.userId),
		index("repo_contributor_repo_id_idx").on(t.repositoryId),
	],
);

export const githubUsersRelations = relations(githubUsers, ({ many }) => ({
	repositoryContributors: many(repositoryContributors),
}));

export const repositoryContributorsRelations = relations(
	repositoryContributors,
	({ one }) => ({
		repository: one(repositories, {
			fields: [repositoryContributors.repositoryId],
			references: [repositories.id],
		}),
		user: one(githubUsers, {
			fields: [repositoryContributors.userId],
			references: [githubUsers.id],
		}),
	}),
);
