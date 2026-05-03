import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	/**
	 * Specify your server-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars.
	 */
	server: {
		BETTER_AUTH_SECRET:
			process.env.NODE_ENV === "production"
				? z.string()
				: z.string().optional(),

		DATABASE_URL: z.url(),
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),
		GITHUB_PAT: z.string(),
		REDIS_URL: z.string().url().optional(),
		REDIS_HOST: z.string().default("localhost"),
		REDIS_PORT: z.string().default("6379"),
		REDIS_PASSWORD: z.string().optional(),
		IDRIVE_E2_ACCESS_KEY: z.string().min(1),
		IDRIVE_E2_SECRET_KEY: z.string().min(1),
		IDRIVE_E2_BUCKET_NAME: z.string().min(1),
		IDRIVE_E2_REGION: z.string().default("eu-central-2"),
		IDRIVE_E2_ENDPOINT: z
			.string()
			.url()
			.default("https://s3.eu-central-2.idrivee2.com"),
	},

	/**
	 * Specify your client-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars. To expose them to the client, prefix them with
	 * `NEXT_PUBLIC_`.
	 */
	client: {
		NEXT_PUBLIC_BASE_URL: z.string().url(),
		NEXT_PUBLIC_AI_ENABLED: z.boolean().default(false),
	},

	/**
	 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
	 * middlewares) or client-side so we need to destruct manually.
	 */
	runtimeEnv: {
		NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
		NEXT_PUBLIC_AI_ENABLED: process.env.NEXT_PUBLIC_AI_ENABLED === "true",
		BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
		DATABASE_URL: process.env.DATABASE_URL,
		NODE_ENV: process.env.NODE_ENV,
		GITHUB_PAT: process.env.GITHUB_PAT,
		REDIS_URL: process.env.REDIS_URL,
		REDIS_HOST: process.env.REDIS_HOST,
		REDIS_PORT: process.env.REDIS_PORT,
		REDIS_PASSWORD: process.env.REDIS_PASSWORD,
		IDRIVE_E2_ACCESS_KEY: process.env.IDRIVE_E2_ACCESS_KEY,
		IDRIVE_E2_SECRET_KEY: process.env.IDRIVE_E2_SECRET_KEY,
		IDRIVE_E2_BUCKET_NAME: process.env.IDRIVE_E2_BUCKET_NAME,
		IDRIVE_E2_REGION: process.env.IDRIVE_E2_REGION,
		IDRIVE_E2_ENDPOINT: process.env.IDRIVE_E2_ENDPOINT,
	},
	/**
	 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
	 * useful for Docker builds.
	 */
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	/**
	 * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
	 * `SOME_VAR=''` will throw an error.
	 */
	emptyStringAsUndefined: true,
});
