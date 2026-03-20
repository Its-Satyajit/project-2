/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */

import "~/env";

/** @type {import("next").NextConfig} */
const config = {
	reactCompiler: true,
	images: {
		formats: ["image/avif", "image/webp"],
	},
};

export default config;
