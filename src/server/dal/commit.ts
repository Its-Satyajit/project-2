import "server-only";
import type { Static } from "elysia";
import type { dbSchema } from "../api/dbSchema";
import { db } from "../db";
import { commits } from "../db/schema";

type Insert = Static<typeof dbSchema.commits.insert>;

export async function insertCommits(data: Insert | Insert[]) {
	const values = Array.isArray(data) ? data : [data];
	await db.insert(commits).values(values);
}
