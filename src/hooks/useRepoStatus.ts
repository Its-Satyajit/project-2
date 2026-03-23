"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "~/lib/eden";
import type { RepoSummary } from "~/server/logic/repoSummary";

export type AnalysisStatus =
	| "pending"
	| "queued"
	| "fetching"
	| "basic-analysis"
	| "dependency-analysis"
	| "complete"
	| "failed";

export interface RepoStatus {
	repoId: string;
	status: AnalysisStatus;
	phase: string | null;
	metadata: {
		owner: string;
		name: string;
		fullName: string;
		description: string | null;
		defaultBranch: string;
		primaryLanguage: string | null;
		isPrivate: boolean;
		stars: number | null;
		forks: number | null;
	};
	analysis: {
		totalFiles: number | null;
		totalDirectories: number | null;
		totalLines: number | null;
		fileTypeBreakdown: Record<string, number> | null;
		dependencyGraph: {
			nodes: Array<{
				id: string;
				path: string;
				language: string;
				imports: number;
				loc?: number;
			}>;
			edges: Array<{
				source: string;
				target: string;
			}>;
			metadata: {
				totalNodes: number;
				totalEdges: number;
				languageBreakdown: Record<string, number>;
				unresolvedImports: number;
			};
		} | null;
		hotSpotData: Array<{
			path: string;
			language: string;
			fanIn: number;
			fanOut: number;
			loc: number;
			score: number;
			rank: number;
		}> | null;
		summary: RepoSummary;
	} | null;
}

export function useRepoStatus(repoId: string) {
	return useQuery({
		queryKey: ["repo-status", repoId],
		queryFn: async () => {
			const res = await api.dashboard({ repoId }).status.get();
			if (res.error) {
				const error = res.error as any;
				throw new Error(
					error.message || error.value || "Failed to fetch status",
				);
			}
			return res.data as RepoStatus;
		},
		enabled: !!repoId,
		refetchInterval: (query) => {
			const status = query.state.data?.status;
			if (status === "complete" || status === "failed") {
				return false;
			}
			return 2000;
		},
	});
}
