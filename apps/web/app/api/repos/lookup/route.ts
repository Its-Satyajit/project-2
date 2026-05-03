import { NextResponse } from "next/server";
import { getRepositoryByOwnerAndName } from "~/server/dal/repositories";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const owner = searchParams.get("owner");
	const name = searchParams.get("name");

	if (!owner || !name) {
		return NextResponse.json(
			{ error: "owner and name are required" },
			{ status: 400 },
		);
	}

	try {
		const repo = await getRepositoryByOwnerAndName(owner, name);

		if (!repo) {
			return NextResponse.json(
				{ error: "Repository not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ id: repo.id });
	} catch (error) {
		console.error("Lookup error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
