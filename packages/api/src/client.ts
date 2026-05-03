import { treaty } from "@elysiajs/eden";
import type { Elysia } from "elysia";

export interface ApiClientConfig {
	baseURL: string;
	timeout?: number;
	token?: string | null;
}

export function createEdenClient<App extends Elysia<any, any, any, any, any, any, any>>(
	config: ApiClientConfig,
) {
	return treaty<App>(config.baseURL, {
		headers: config.token
			? {
					Authorization: `Bearer ${config.token}`,
			  }
			: undefined,
	});
}
