import type {
	AlertItem,
	AnalyzeResponse,
	Contributor,
	DashboardData,
	FileContent,
	HotspotData,
	RepoStatus,
	Repository,
	TreemapData,
} from "@git-insights/api";
import { createEdenClient } from "@git-insights/api/client";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL =
	process.env.EXPO_PUBLIC_API_URL?.replace(/\/api$/, "") ||
	"http://localhost:3000";
const AUTH_TOKEN_KEY = "auth_token";

let _edenClient: ReturnType<typeof createEdenClient<any>> | null = null;

async function getToken(): Promise<string | null> {
	try {
		return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
	} catch {
		return null;
	}
}

export async function setToken(token: string | null): Promise<void> {
	try {
		if (token) {
			await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
		} else {
			await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
		}
	} catch (error) {
		console.error("[Auth] Failed to persist token:", error);
	}
}

export async function getEdenClient() {
	if (!_edenClient) {
		const token = await getToken();
		_edenClient = createEdenClient<any>({
			baseURL: API_BASE_URL,
			token: token ?? undefined,
		});
	}
	return _edenClient;
}

export const api = {
	getTopRepos: async (limit = 10): Promise<Repository[]> => {
		const client = (await getEdenClient()) as any;
		const { data, error } = await client.api.repos.top.get({
			query: { limit },
		});
		if (error) throw error;
		return data as Repository[];
	},
	searchRepos: async (q: string, limit = 10): Promise<Repository[]> => {
		const client = (await getEdenClient()) as any;
		const { data, error } = await client.api.repos.search.get({
			query: { q, limit },
		});
		if (error) throw error;
		return data as Repository[];
	},
	getDashboard: async (repoId: string): Promise<DashboardData> => {
		const client = (await getEdenClient()) as any;
		const { data, error } = await client.api.dashboard({ repoId }).get();
		if (error) throw error;
		return data as DashboardData;
	},
	getStatus: async (repoId: string): Promise<RepoStatus> => {
		const client = (await getEdenClient()) as any;
		const { data, error } = await client.api.dashboard({ repoId }).status.get();
		if (error) throw error;
		return data as RepoStatus;
	},
	getContributors: async (
		repoId: string,
		sort: "contributions" | "newest" = "contributions",
		limit = 100,
	): Promise<Contributor[]> => {
		const client = (await getEdenClient()) as any;
		const { data, error } = await client.api
			.repos({ repoId })
			.contributors.get({
				query: { sort, limit },
			});
		if (error) throw error;
		return data as Contributor[];
	},
	getTreemap: async (repoId: string): Promise<TreemapData> => {
		const client = (await getEdenClient()) as any;
		const { data, error } = await client.api
			.dashboard({ repoId })
			.treemap.get();
		if (error) throw error;
		return data as TreemapData;
	},
	getHotspots: async (repoId: string): Promise<HotspotData[]> => {
		return [];
	},
	getFileContent: async (
		repoId: string,
		path: string,
	): Promise<FileContent> => {
		const client = (await getEdenClient()) as any;
		const { data, error } = await client.api["file-content"].get({
			query: { repoId, path },
		});
		if (error) throw error;
		return data as FileContent;
	},
	getAlerts: async (repoId?: string): Promise<AlertItem[]> => {
		return [];
	},
	analyzeRepo: async (body: {
		githubUrl: string;
	}): Promise<AnalyzeResponse> => {
		const client = (await getEdenClient()) as any;
		const { data, error } = await client.api.analyze.post(body);
		if (error) throw error;
		return data as AnalyzeResponse;
	},
};

export default api;
