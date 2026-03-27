import type { Metadata } from "next";
import { env } from "~/env";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ repoId: string }>;
}): Promise<Metadata> {
	const { repoId } = await params;
	const baseUrl = env.NEXT_PUBLIC_BASE_URL;
	const url = `${baseUrl}/dashboard/${repoId}`;

	return {
		title: `Repository ${repoId}`,
		description: `Analysis results for repository ${repoId}`,
		openGraph: {
			title: `Repository ${repoId} Analysis`,
			description: `View detailed analysis for ${repoId}`,
			url,
		},
		alternates: {
			canonical: url,
		},
	};
}
