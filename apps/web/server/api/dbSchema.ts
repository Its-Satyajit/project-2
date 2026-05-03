import { Type } from "@sinclair/typebox";
import type { PgTable } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import * as s from "../db/schema";

function schemas<T extends PgTable>(table: T) {
	const insertSchema = createInsertSchema(table);
	return {
		insert: Type.Omit(insertSchema, ["id", "createdAt", "updatedAt"]),
		select: createSelectSchema(table),
	};
}
export const dbSchema = {
	user: schemas(s.user),
	session: schemas(s.session),
	account: schemas(s.account),
	verification: schemas(s.verification),
	repositories: schemas(s.repositories),
	analysisResults: schemas(s.analysisResults),
	githubUsers: schemas(s.githubUsers),
	repositoryContributors: schemas(s.repositoryContributors),
	analysisLogs: schemas(s.analysisLogs),
} as const;
