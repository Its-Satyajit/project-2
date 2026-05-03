import { t } from "elysia";

export const repositorySchema = t.Object({
	id: t.String(),
	owner: t.String(),
	name: t.String(),
	fullName: t.String(),
	description: t.Union([t.String(), t.Null()]),
	stars: t.Number(),
	forks: t.Number(),
	contributorCount: t.Number(),
	primaryLanguage: t.Union([t.String(), t.Null()]),
	analysisStatus: t.String(),
});

export const contributorSchema = t.Object({
	id: t.String(),
	githubLogin: t.String(),
	avatarUrl: t.String(),
	htmlUrl: t.String(),
	contributions: t.Number(),
	firstContributionAt: t.Union([t.String(), t.Null()]),
	lastContributionAt: t.Union([t.String(), t.Null()]),
});

export const fileTreeItemSchema = t.Object({
	name: t.String(),
	path: t.String(),
	type: t.Union([t.Literal("file"), t.Literal("directory")]),
	size: t.Optional(t.Number()),
	children: t.Optional(
		t.Array(
			t.Object({
				name: t.String(),
				path: t.String(),
				type: t.Union([t.Literal("file"), t.Literal("directory")]),
				size: t.Optional(t.Number()),
			}),
		),
	),
});

export const commitDataSchema = t.Object({
	sha: t.String(),
	message: t.String(),
	author: t.String(),
	date: t.String(),
	additions: t.Number(),
	deletions: t.Number(),
});

export const hotspotDataSchema = t.Object({
	file: t.String(),
	score: t.Number(),
	churn: t.Number(),
	lines: t.Number(),
	dependencies: t.Number(),
});

export const dashboardDataSchema = t.Object({
	id: t.String(),
	owner: t.String(),
	name: t.String(),
	fullName: t.String(),
	description: t.Union([t.String(), t.Null()]),
	url: t.String(),
	defaultBranch: t.String(),
	primaryLanguage: t.Union([t.String(), t.Null()]),
	isPrivate: t.Boolean(),
	stars: t.Number(),
	forks: t.Number(),
	avatarUrl: t.String(),
	analysisStatus: t.String(),
	analysisPhase: t.Union([t.String(), t.Null()]),
	fileTree: t.Array(fileTreeItemSchema),
	fileTypeBreakdown: t.Optional(t.Record(t.String(), t.Number())),
	dependencyGraph: t.Optional(t.Record(t.String(), t.Array(t.String()))),
	hotSpotData: t.Optional(t.Array(hotspotDataSchema)),
	commits: t.Optional(t.Array(commitDataSchema)),
	contributorCount: t.Number(),
	totalFiles: t.Optional(t.Number()),
	totalDirectories: t.Optional(t.Number()),
	totalLines: t.Optional(t.Number()),
});

export const repoStatusSchema = t.Object({
	repoId: t.String(),
	status: t.String(),
	phase: t.Union([t.String(), t.Null()]),
	metadata: t.Object({
		owner: t.String(),
		name: t.String(),
		fullName: t.String(),
		description: t.Union([t.String(), t.Null()]),
		defaultBranch: t.String(),
		primaryLanguage: t.Union([t.String(), t.Null()]),
		isPrivate: t.Boolean(),
		stars: t.Number(),
		forks: t.Number(),
		avatarUrl: t.String(),
	}),
	analysis: t.Union([
		t.Object({
			totalFiles: t.Number(),
			totalDirectories: t.Number(),
			totalLines: t.Number(),
			fileTypeBreakdown: t.Optional(t.Record(t.String(), t.Number())),
			dependencyGraph: t.Optional(t.Record(t.String(), t.Array(t.String()))),
			hotSpotData: t.Optional(t.Array(hotspotDataSchema)),
			summary: t.Union([t.Record(t.String(), t.Number()), t.Null()]),
		}),
		t.Null(),
	]),
});

export const treemapFileSchema = t.Object({
	id: t.String(),
	path: t.String(),
	loc: t.Number(),
	extension: t.String(),
	hotspotScore: t.Number(),
	fanIn: t.Number(),
	fanOut: t.Number(),
	isExternal: t.Boolean(),
});

export const treemapDataSchema = t.Object({
	files: t.Array(treemapFileSchema),
	totalFiles: t.Number(),
	totalLoc: t.Number(),
});

export const fileContentSchema = t.Object({
	path: t.String(),
	content: t.String(),
	extension: t.String(),
	size: t.Number(),
	lines: t.Number(),
});

export const alertItemSchema = t.Object({
	id: t.String(),
	type: t.Union([
		t.Literal("ci_failure"),
		t.Literal("pr_update"),
		t.Literal("analysis_complete"),
		t.Literal("hotspot_detected"),
	]),
	title: t.String(),
	message: t.String(),
	timestamp: t.String(),
	repoId: t.Optional(t.String()),
	read: t.Boolean(),
});

export const analyzeRequestBodySchema = t.Object({
	githubUrl: t.String(),
});

export const analyzeResponseSchema = t.Union([
	t.Object({
		success: t.Boolean(),
		repoId: t.String(),
		owner: t.String(),
		name: t.String(),
		status: t.String(),
		message: t.Optional(t.String()),
		metadata: t.Optional(t.Any()),
	}),
	t.Object({
		error: t.String(),
	}),
]);

export const queryLimitSchema = t.Object({
	limit: t.Number({ default: 10 }),
});

export const querySearchSchema = t.Object({
	q: t.String({ default: "" }),
	limit: t.Number({ default: 10 }),
});

export const queryContributorsSchema = t.Object({
	sort: t.Union([t.Literal("contributions"), t.Literal("newest")]),
	limit: t.Number({ default: 100 }),
});

export const queryFileContentSchema = t.Object({
	path: t.String(),
});

export const queryAlertsSchema = t.Object({
	repoId: t.Optional(t.String()),
});
