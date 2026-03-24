import { Elysia } from "elysia";
import { apiHandler } from "~/server/api/index";
import { betterAuthMacro } from "~/server/better-auth/betterAuthMacro";
import { initRateLimitStore } from "~/server/middleware/rate-limit";

// Initialize rate limit store on module load
initRateLimitStore().catch((err) => {
	console.warn("[RateLimit] Failed to initialize:", err);
});

const app = new Elysia({ prefix: "/api" }).use(betterAuthMacro).use(apiHandler);

export const GET = app.fetch;
export const POST = app.fetch;

export type App = typeof app;
