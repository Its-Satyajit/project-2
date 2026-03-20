import { treaty } from "@elysiajs/eden";
import type { App } from "~/app/api/[[...slugs]]/route";

import { env } from "~/env";

/**
 * Resolve the API base URL based on the environment.
 * Optimized for VPS/Node.js hosting.
 */
const getBaseUrl = () => {
	if (typeof window !== "undefined") {
		return window.location.origin;
	}

	if (env.NEXT_PUBLIC_BASE_URL) {
		return env.NEXT_PUBLIC_BASE_URL;
	}

	return `http://localhost:3000`;
};

/**
 * Type-safe Eden (Treaty) client.
 *
 * Usage:
 * import { api } from "~/server/eden/client";
 * const { data, error } = await api.health.get();
 */
export const api = treaty<App>(getBaseUrl()).api;
