import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type {
	Contributor,
	DashboardData,
	RepoStatus,
	Repository,
} from "@git-insights/api";

export function useTopRepos(limit = 10) {
	return useQuery({
		queryKey: ["repos", "top", limit],
		queryFn: () => api.getTopRepos(limit),
		staleTime: 60 * 1000,
	});
}

export function useSearchRepos(query: string, limit = 10) {
	return useQuery({
		queryKey: ["repos", "search", query, limit],
		queryFn: () => api.searchRepos(query, limit),
		staleTime: 30 * 1000,
		enabled: query.length > 0,
	});
}

export function useDashboard(repoId: string) {
	return useQuery({
		queryKey: ["dashboard", repoId],
		queryFn: () => api.getDashboard(repoId),
		staleTime: 2 * 60 * 1000,
		enabled: !!repoId,
	});
}

export function useRepoStatus(repoId: string) {
	return useQuery({
		queryKey: ["status", repoId],
		queryFn: () => api.getStatus(repoId),
		staleTime: 30 * 1000,
		enabled: !!repoId,
	});
}

export function useContributors(
	repoId: string,
	sort: "contributions" | "newest" = "contributions",
	limit = 20,
) {
	return useQuery({
		queryKey: ["contributors", repoId, sort, limit],
		queryFn: () => api.getContributors(repoId, sort, limit),
		staleTime: 5 * 60 * 1000,
		enabled: !!repoId,
	});
}

export function useTreemap(repoId: string) {
	return useQuery({
		queryKey: ["treemap", repoId],
		queryFn: () => api.getTreemap(repoId),
		staleTime: 5 * 60 * 1000,
		enabled: !!repoId,
	});
}

export function useHotspots(repoId: string) {
	return useQuery({
		queryKey: ["hotspots", repoId],
		queryFn: () => api.getHotspots(repoId),
		staleTime: 5 * 60 * 1000,
		enabled: !!repoId,
	});
}

export function useFileContent(repoId: string, path: string) {
	return useQuery({
		queryKey: ["file", repoId, path],
		queryFn: () => api.getFileContent(repoId, path),
		staleTime: 10 * 60 * 1000,
		enabled: !!repoId && !!path,
	});
}

export function useAnalyzeRepo() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (githubUrl: string) => api.analyzeRepo({ githubUrl }),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ["repos"] });
		},
	});
}
