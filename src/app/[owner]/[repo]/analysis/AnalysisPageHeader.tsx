import type { Metadata } from "next";
import { getCachedRepoByPath } from "~/lib/server/data";

interface AnalysisPageHeaderProps {
	owner: string;
	repo: string;
}

export async function generateMetadata({
	params,
}: {
	params: Promise<AnalysisPageHeaderProps>;
}): Promise<Metadata> {
	const { owner, repo } = await params;
	const repoData = await getCachedRepoByPath(owner, repo);

	if (!repoData) {
		return {
			title: "Repository Not Found",
		};
	}

	return {
		title: `${repoData.fullName} - Code Analysis & Hotspots`,
		description: `Comprehensive code analysis for ${repoData.fullName}: dependency graph, hotspot detection, file structure, and ${repoData.primaryLanguage || "multi-language"} codebase insights.`,
		openGraph: {
			title: `${repoData.fullName} Analysis - Git Insights`,
			description: `Deep code analysis for ${repoData.fullName}`,
			images: repoData.avatarUrl ? [repoData.avatarUrl] : undefined,
		},
		keywords: [
			`${owner} ${repo}`,
			"code analysis",
			"dependency graph",
			"hotspot detection",
			repoData.primaryLanguage || "",
		].filter(Boolean),
	};
}

export async function AnalysisPageHeader({
	owner,
	repo,
}: AnalysisPageHeaderProps) {
	const repoData = await getCachedRepoByPath(owner, repo);

	if (!repoData) {
		return null;
	}

	return null;
}
