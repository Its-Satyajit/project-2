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

	return (
		<div className="flex items-start gap-4 py-6">
			<div className="flex h-12 w-12 min-w-12 items-center justify-center border border-border bg-secondary">
				<span className="font-(family-name:--font-display) font-semibold text-foreground text-lg">
					{repoData.name[0]?.toUpperCase()}
				</span>
			</div>
			<div className="min-w-0 flex-1">
				<h1 className="font-(family-name:--font-display) truncate text-3xl text-foreground leading-[1.15] tracking-tight md:text-4xl">
					{repoData.fullName}
				</h1>
				{repoData.description && (
					<p className="mt-1 max-w-xl font-mono text-[11px] text-muted-foreground leading-relaxed">
						{repoData.description}
					</p>
				)}
				<div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
					<span>Code Analysis</span>
					<span className="text-border">|</span>
					<span
						className={
							repoData.isPrivate ? "text-amber-500" : "text-emerald-500"
						}
					>
						{repoData.isPrivate ? "Private" : "Public"}
					</span>
					{repoData.primaryLanguage && (
						<>
							<span className="text-border">|</span>
							<span>{repoData.primaryLanguage}</span>
						</>
					)}
					{repoData.license && (
						<>
							<span className="text-border">|</span>
							<span>{repoData.license}</span>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
