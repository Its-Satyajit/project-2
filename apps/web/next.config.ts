import type { NextConfig } from "next";
import "~/env";

const config: NextConfig = {
	reactCompiler: true,
	cacheComponents: true,
	reactStrictMode: true,
	images: {
		formats: ["image/avif", "image/webp"],
		remotePatterns: [
			{
				hostname: "avatars.githubusercontent.com",
			},
		],
	},
	outputFileTracingIncludes: {
		"/api/**/*": ["node_modules/@vscode/tree-sitter-wasm/wasm/*.wasm"],
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
