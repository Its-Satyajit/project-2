import "server-only";
import type { Static } from "elysia";
import type { dbSchema } from "../api/dbSchema";
import { db } from "../db";
import { files } from "../db/schema";

type Insert = Static<typeof dbSchema.files.insert>;

export async function insertFiles(data: Insert | Insert[]) {
	const values = Array.isArray(data) ? data : [data];
	await db.insert(files).values(values);
}
