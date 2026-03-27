import type { Metadata } from "next";
import { env } from "~/env";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ repoId: string }>;
}): Promise<Metadata> {
	const { repoId } = await params;
	const baseUrl = env.NEXT_PUBLIC_BASE_URL;
	const url = `${baseUrl}/dashboard/${repoId}/analysis`;

	return {
		title: `Analysis - ${repoId}`,
		description: `Comprehensive analysis of ${repoId} including dependencies, hotspots, and structure`,
		openGraph: {
			title: `${repoId} - Comprehensive Analysis`,
			description: `View dependency graph, hotspots, and detailed code analysis for ${repoId}`,
			url,
		},
		alternates: {
			canonical: url,
		},
	};
}
