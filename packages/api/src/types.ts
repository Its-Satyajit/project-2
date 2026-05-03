export interface Repository {
	id: string;
	owner: string;
	name: string;
	fullName: string;
	description: string | null;
	stars: number;
	forks: number;
	contributorCount: number;
	primaryLanguage: string | null;
	analysisStatus: string;
}

export interface Contributor {
	id: string;
	githubLogin: string;
	avatarUrl: string;
	htmlUrl: string;
	contributions: number;
	firstContributionAt: string | null;
	lastContributionAt: string | null;
}

export interface FileTreeItem {
	name: string;
	path: string;
	type: "file" | "directory";
	size?: number;
	children?: FileTreeItem[];
}

export interface CommitData {
	sha: string;
	message: string;
	author: string;
	date: string;
	additions: number;
	deletions: number;
}

export interface HotspotData {
	file: string;
	score: number;
	churn: number;
	lines: number;
	dependencies: number;
}

export interface DashboardData {
	id: string;
	owner: string;
	name: string;
	fullName: string;
	description: string | null;
	url: string;
	defaultBranch: string;
	primaryLanguage: string | null;
	isPrivate: boolean;
	stars: number;
	forks: number;
	avatarUrl: string;
	analysisStatus: string;
	analysisPhase: string | null;
	fileTree: FileTreeItem[];
	fileTypeBreakdown?: Record<string, number>;
	dependencyGraph?: Record<string, string[]>;
	hotSpotData?: HotspotData[];
	commits?: CommitData[];
	contributorCount: number;
	totalFiles?: number;
	totalDirectories?: number;
	totalLines?: number;
}

export interface RepoStatus {
	repoId: string;
	status: string;
	phase: string | null;
	metadata: {
		owner: string;
		name: string;
		fullName: string;
		description: string | null;
		defaultBranch: string;
		primaryLanguage: string | null;
		isPrivate: boolean;
		stars: number;
		forks: number;
		avatarUrl: string;
	};
	analysis: {
		totalFiles: number;
		totalDirectories: number;
		totalLines: number;
		fileTypeBreakdown?: Record<string, number>;
		dependencyGraph?: Record<string, string[]>;
		hotSpotData?: HotspotData[];
		summary: Record<string, number> | null;
	} | null;
}

export interface TreemapFile {
	id: string;
	path: string;
	loc: number;
	extension: string;
	hotspotScore: number;
	fanIn: number;
	fanOut: number;
	isExternal: boolean;
}

export interface TreemapData {
	files: TreemapFile[];
	totalFiles: number;
	totalLoc: number;
}

export interface FileContent {
	path: string;
	content: string;
	extension: string;
	size: number;
	lines: number;
}

export interface AlertItem {
	id: string;
	type: "ci_failure" | "pr_update" | "analysis_complete" | "hotspot_detected";
	title: string;
	message: string;
	timestamp: string;
	repoId?: string;
	read: boolean;
}

export interface AnalyzeRequestBody {
	githubUrl: string;
}

export interface AnalyzeSuccessResponse {
	success: true;
	repoId: string;
	owner: string;
	name: string;
	status: string;
	message?: string;
	metadata?: Record<string, unknown>;
}

export interface AnalyzeErrorResponse {
	error: string;
}

export type AnalyzeResponse = AnalyzeSuccessResponse | AnalyzeErrorResponse;

export interface QueryLimit {
	limit?: number;
}

export interface QuerySearch {
	q?: string;
	limit?: number;
}

export interface QueryContributors {
	sort?: "contributions" | "newest";
	limit?: number;
}

export interface QueryFileContent {
	path: string;
}

export interface QueryAlerts {
	repoId?: string;
}
