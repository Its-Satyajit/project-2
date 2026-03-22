import type { NextConfig } from "next";

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "~/env";

const config: NextConfig = {
	reactCompiler: true,
	images: {
		formats: ["image/avif", "image/webp"],
	},
	experimental: {
		// experimental settings
	},
	cacheComponents: true,
};

export default config;
