import type { NextConfig } from "next";
import "~/env";

const config: NextConfig = {
	reactCompiler: true,
	experimental: {},
	cacheComponents: true,
	images: {
		formats: ["image/avif", "image/webp"],
		remotePatterns: [
			{
				hostname: "avatars.githubusercontent.com",
			},
		],
	},
	async headers() {
		return [
			{
				source: "/tree-sitter/:path*\\.wasm",
				headers: [
					{
						key: "Content-Type",
						value: "application/wasm",
					},
				],
			},
		];
	},
};

export default config;
