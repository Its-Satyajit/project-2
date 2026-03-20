import type { PgTable } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import * as s from "../db/schema";

function schemas<T extends PgTable>(table: T) {
	return {
		insert: createInsertSchema(table),
		select: createSelectSchema(table),
	};
}
export const dbSchema = {
	user: schemas(s.user),
	posts: schemas(s.posts),
	session: schemas(s.session),
	account: schemas(s.account),
	verification: schemas(s.verification),
} as const;
