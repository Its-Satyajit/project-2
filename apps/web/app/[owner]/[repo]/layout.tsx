import type { Metadata } from "next";
import { env } from "~/env";

interface RepoLayoutProps {
	children: React.ReactNode;
	params: Promise<{ owner: string; repo: string }>;
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ owner: string; repo: string }>;
}): Promise<Metadata> {
	const { owner, repo } = await params;
	const title = `${owner}/${repo} — Analyze`;
	const description = `Comprehensive code analysis for ${owner}/${repo}. View repository structure, dependency graphs, hotspot analysis, and code quality metrics.`;
	const url = `${env.NEXT_PUBLIC_BASE_URL}/${owner}/${repo}`;

	return {
		title,
		description,
		alternates: {
			canonical: url,
		},
		openGraph: {
			type: "website",
			locale: "en_US",
			url,
			siteName: "Analyze",
			title,
			description,
			images: [
				{
					url: "/og-image.png",
					width: 1200,
					height: 630,
					alt: `${owner}/${repo} Dashboard`,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			images: ["/og-image.png"],
		},
		robots: {
			index: true,
			follow: true,
			googleBot: {
				index: true,
				follow: true,
				"max-video-preview": -1,
				"max-image-preview": "large",
				"max-snippet": -1,
			},
		},
	};
}

export default function RepoLayout({ children }: RepoLayoutProps) {
	return children;
}
