import axios, { type AxiosInstance } from "axios";

const API_BASE_URL =
	process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";

let _apiClient: AxiosInstance | null = null;

export function createApiClient(): AxiosInstance {
	if (_apiClient) return _apiClient;

	const client = axios.create({
		baseURL: API_BASE_URL,
		timeout: 30000,
		headers: {
			"Content-Type": "application/json",
		},
	});

	client.interceptors.response.use(
		(response) => response,
		(error) => {
			console.error("[API Error]", error.message);
			return Promise.reject(error);
		},
	);

	_apiClient = client;
	return client;
}

export function setApiClient(client: AxiosInstance): void {
	_apiClient = client;
}

export function getApiClient(): AxiosInstance {
	if (!_apiClient) {
		return createApiClient();
	}
	return _apiClient;
}

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

export const api = {
	getTopRepos: async (limit = 10): Promise<Repository[]> => {
		const { data } = await getApiClient().get("/repos/top", {
			params: { limit },
		});
		return data;
	},

	searchRepos: async (q: string, limit = 10): Promise<Repository[]> => {
		const { data } = await getApiClient().get("/repos/search", {
			params: { q, limit },
		});
		return data;
	},

	getDashboard: async (repoId: string): Promise<DashboardData> => {
		const { data } = await getApiClient().get(`/dashboard/${repoId}`);
		return data;
	},

	getStatus: async (repoId: string): Promise<RepoStatus> => {
		const { data } = await getApiClient().get(`/dashboard/${repoId}/status`);
		return data;
	},

	getContributors: async (
		repoId: string,
		sort: "contributions" | "newest" = "contributions",
		limit = 100,
	): Promise<Contributor[]> => {
		const { data } = await getApiClient().get(`/repos/${repoId}/contributors`, {
			params: { sort, limit },
		});
		return data;
	},
};

export default getApiClient();
