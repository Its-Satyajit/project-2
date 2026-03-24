import { relations } from "drizzle-orm";
import {
	boolean,
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
		analysisStatus: text("analysis_status").default("pending"),
		analysisPhase: text("analysis_phase"),
		createdAt: timestamp("created_at")
			.$defaultFn(() => /* @__PURE__ */ new Date())
			.notNull(),
		updatedAt: timestamp("updated_at")
			.$defaultFn(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(t) => [unique().on(t.owner, t.name)],
);

export const repositoriesRelations = relations(
	repositories,
	({ one, many }) => ({
		files: many(files),
		commits: many(commits),
		analysisResults: many(analysisResults),
	}),
);

export const files = pgTable("files", {
	id: uuid("id").defaultRandom().primaryKey(),
	repositoryId: uuid("repository_id").references(() => repositories.id),
	path: text("path"),
	linesCount: integer("lines_count"),
	size: integer("size"),
	depth: integer("depth"),
	extension: text("extension"),
	isDirectory: boolean("is_directory").default(false),
	content: text("content"),
	createdAt: timestamp("created_at")
		.$defaultFn(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const filesRelations = relations(files, ({ one }) => ({
	repositories: one(repositories, {
		fields: [files.repositoryId],
		references: [repositories.id],
	}),
}));

export const commits = pgTable("commits", {
	id: uuid("id").defaultRandom().primaryKey(),
	repositoryId: uuid("repository_id").references(() => repositories.id),
	sha: text("sha"),
	authorName: text("author_name"),
	message: text("message"),
	committedAt: timestamp("committed_at"),
	createdAt: timestamp("created_at")
		.$defaultFn(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const commitsRelations = relations(commits, ({ one, many }) => ({
	repositories: one(repositories, {
		fields: [commits.repositoryId],
		references: [repositories.id],
	}),
}));
export const analysisResults = pgTable(
	"analysis_results",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		repositoryId: uuid("repository_id").references(() => repositories.id),
		fileTreeJson: json("file_tree"),
		totalFiles: integer("total_files"),
		totalDirectories: integer("total_directories"),
		totalLines: integer("total_lines"),
		fileTypeBreakdownJson: json("file_type_breakdown_json"),
		hotSpotDataJson: json("hot_spot_data_json"),
		dependencyGraphJson: json("dependency_graph_json"),
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
	({ one, many }) => ({
		repositories: one(repositories, {
			fields: [analysisResults.repositoryId],
			references: [repositories.id],
		}),
	}),
);

// export const contributors = pgTable("contributors", {
// 	//table for later
// });
// export const fileChanges = pgTable("file_changes", {
// 	//table for later
// });
// export const analysisRuns = pgTable("analysis_runs", {
// 	//table for later
// });
// export const tags = pgTable("tags", {
// 	//table for later
// });
// export const bookmarks = pgTable("bookmarks", {
// 	//table for later
// });
