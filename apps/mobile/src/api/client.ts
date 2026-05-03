import AsyncStorage from "@react-native-async-storage/async-storage";
import { createEdenClient } from "@git-insights/api/client";
import type { App } from "@git-insights/web/app/api/[[...slugs]]/route";

const API_BASE_URL =
	process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";
const AUTH_TOKEN_KEY = "auth_token";

let _edenClient: ReturnType<typeof createEdenClient<App>> | null = null;

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
		_edenClient = createEdenClient<App>({
			baseURL: API_BASE_URL,
			token: token ?? undefined,
		});
	}
	return _edenClient;
}

export const api = {
	getTopRepos: async (limit = 10) => {
		const client = await getEdenClient();
		const { data, error } = await client.repos.top.get({ query: { limit } });
		if (error) throw error;
		return data;
	},
	searchRepos: async (q: string, limit = 10) => {
		const client = await getEdenClient();
		const { data, error } = await client.repos.search.get({ query: { q, limit } });
		if (error) throw error;
		return data;
	},
	getDashboard: async (repoId: string) => {
		const client = await getEdenClient();
		const { data, error } = await client.dashboard({ repoId }).get();
		if (error) throw error;
		return data;
	},
	getStatus: async (repoId: string) => {
		const client = await getEdenClient();
		const { data, error } = await client.dashboard({ repoId }).status.get();
		if (error) throw error;
		return data;
	},
	getContributors: async (
		repoId: string,
		sort: "contributions" | "newest" = "contributions",
		limit = 100,
	) => {
		const client = await getEdenClient();
		const { data, error } = await client.repos({ repoId }).contributors.get({
			query: { sort, limit },
		});
		if (error) throw error;
		return data;
	},
	getTreemap: async (repoId: string) => {
		const client = await getEdenClient();
		const { data, error } = await client.dashboard({ repoId }).treemap.get();
		if (error) throw error;
		return data;
	},
	getHotspots: async (repoId: string) => {
		return [];
	},
	getFileContent: async (repoId: string, path: string) => {
		const client = await getEdenClient();
		const { data, error } = await client["file-content"].get({
			query: { repoId, path },
		});
		if (error) throw error;
		return data;
	},
	getAlerts: async (repoId?: string) => {
		return [];
	},
	analyzeRepo: async (body: { githubUrl: string }) => {
		const client = await getEdenClient();
		const { data, error } = await client.analyze.post(body);
		if (error) throw error;
		return data;
	},
};

export default api;
