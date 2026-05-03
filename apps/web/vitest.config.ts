import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"~": path.resolve(__dirname, "."),
		},
	},
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./vitest.setup.ts"],
		include: [
			"server/**/__tests__/**/*.{test,spec}.{ts,tsx}",
			"components/**/*.{test,spec}.{ts,tsx}",
			"lib/**/*.{test,spec}.{ts,tsx}",
			"server/**/*.test.{ts,tsx}",
		],
		css: true,
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			include: ["**/*.{ts,tsx}"],
			exclude: [
				"**/*.{test,spec}.{ts,tsx}",
				"**/*.d.ts",
				"node_modules/**",
				".next/**",
			],
		},
	},
});
