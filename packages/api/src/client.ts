import { treaty } from "@elysiajs/eden";

export interface ApiClientConfig {
	baseURL: string;
	timeout?: number;
	token?: string | null;
}

export function createEdenClient<App>(config: ApiClientConfig) {
	// @ts-expect-error: App is generic to avoid peer dependency mismatch issues
	return treaty<App>(config.baseURL, {
		headers: config.token
			? {
					Authorization: `Bearer ${config.token}`,
				}
			: undefined,
	});
}
