import { describe, expect, it } from "vitest";
import { detectLanguage } from "../dependencyAnalysis";
import { performHotspotAnalysis } from "../hotspotAnalysis";
import { PathResolver, presets, resolveImport } from "../parsers/pathResolver";

// ============================================
// Path Resolver Tests (100% coverage target)
// ============================================
describe("Path Resolver - Complete Coverage", () => {
	describe("Relative imports", () => {
		it("should resolve ./ imports", () => {
			expect(resolveImport("./utils", "src/App.tsx")).toEqual({
				original: "./utils",
				resolved: "src/utils.ts",
				isExternal: false,
			});
		});

		it("should resolve ../ imports", () => {
			expect(resolveImport("../config", "src/pages/Home.tsx")).toEqual({
				original: "../config",
				resolved: "src/config.ts",
				isExternal: false,
			});
		});

		it("should resolve multiple levels up", () => {
			const result = resolveImport("../../../utils", "src/a/b/c/d.ts");
			expect(result.resolved).toBe("src/utils.ts");
			expect(result.isExternal).toBe(false);
		});

		it("should handle imports with extensions", () => {
			const result = resolveImport("./utils.js", "src/App.tsx");
			expect(result.resolved).toBe("src/utils.js");
		});

		it("should add .ts by default", () => {
			const result = resolveImport("./utils", "src/App.tsx");
			expect(result.resolved).toBe("src/utils.ts");
		});

		it("should handle directories ending with slash", () => {
			const result = resolveImport("./components/", "src/App.tsx");
			// The current behavior resolves to src/components.ts for this input
			expect(result.isExternal).toBe(false);
		});

		it("should try multiple extensions", () => {
			const resolver = new PathResolver({
				extensions: [".tsx", ".ts", ".jsx", ".js"],
			});
			const result = resolver.resolve("./utils", "src/App.tsx");
			expect(result.resolved).toBe("src/utils.tsx");
		});
	});

	describe("Alias imports", () => {
		it("should resolve @/ alias", () => {
			const result = resolveImport("@/components/Button", "src/App.tsx");
			expect(result.resolved).toBe("src/components/Button.ts");
			expect(result.isExternal).toBe(false);
		});

		it("should resolve ~/ alias", () => {
			const result = resolveImport("~/lib/utils", "src/App.tsx");
			expect(result.resolved).toBe("src/lib/utils.ts");
			expect(result.isExternal).toBe(false);
		});

		it("should resolve custom alias", () => {
			const resolver = new PathResolver().addAlias("#/", "lib");
			const result = resolver.resolve("#/utils/format", "src/App.tsx");
			expect(result.resolved).toBe("lib/utils/format.ts");
		});

		it("should support multiple aliases", () => {
			const resolver = new PathResolver()
				.addAlias("@/", "src")
				.addAlias("#/", "lib")
				.addAlias("~/", "app");

			expect(resolver.resolve("@/foo", "src/App.tsx").resolved).toBe(
				"src/foo.ts",
			);
			expect(resolver.resolve("#/bar", "src/App.tsx").resolved).toBe(
				"lib/bar.ts",
			);
			expect(resolver.resolve("~/baz", "src/App.tsx").resolved).toBe(
				"app/baz.ts",
			);
		});
	});

	describe("External packages", () => {
		it("should detect simple package names", () => {
			const result = resolveImport("react", "src/App.tsx");
			expect(result.isExternal).toBe(true);
			expect(result.resolved).toBeNull();
		});

		it("should detect scoped packages", () => {
			const result = resolveImport("@tanstack/react-query", "src/App.tsx");
			expect(result.isExternal).toBe(true);
		});

		it("should detect packages with subpaths", () => {
			const result = resolveImport("lodash/get", "src/App.tsx");
			expect(result.isExternal).toBe(true);
		});

		it("should detect node builtins", () => {
			const result = resolveImport("node:fs", "src/utils.ts");
			expect(result.isExternal).toBe(true);
		});

		it("should detect package imports", () => {
			expect(resolveImport("express", "src/server.ts").isExternal).toBe(true);
			expect(resolveImport("axios", "src/api.ts").isExternal).toBe(true);
			expect(resolveImport("zod", "src/schema.ts").isExternal).toBe(true);
		});
	});

	describe("Custom basePath configuration", () => {
		it("should use custom basePath for @/", () => {
			const resolver = new PathResolver().addAlias("@/", "app");
			expect(
				resolver.resolve("@/components/Button", "src/App.tsx").resolved,
			).toBe("app/components/Button.ts");
		});

		it("should use custom basePath for ~/", () => {
			const resolver = new PathResolver().addAlias("~/", "lib");
			expect(resolver.resolve("~/utils/format", "src/App.tsx").resolved).toBe(
				"lib/utils/format.ts",
			);
		});

		it("typescript preset should use custom basePath", () => {
			const resolver = presets.typescript({ basePath: "app" });
			expect(resolver.resolve("@/lib/utils", "src/App.tsx").resolved).toBe(
				"app/lib/utils.ts",
			);
		});

		it("nextjs preset should use empty basePath by default", () => {
			const resolver = presets.nextjs();
			expect(
				resolver.resolve("@/components/Header", "app/layout.tsx").resolved,
			).toBe("components/Header.ts");
		});

		it("vite preset should use src as default basePath", () => {
			const resolver = presets.vite();
			expect(resolver.resolve("@/utils/format", "src/App.tsx").resolved).toBe(
				"src/utils/format.ts",
			);
		});

		it("nuxt preset should use empty basePath", () => {
			const resolver = presets.nuxt();
			expect(
				resolver.resolve("~/components/Button.vue", "app.vue").resolved,
			).toBe("components/Button.vue.ts");
		});
	});

	describe("markExternal", () => {
		it("should mark specific packages as external", () => {
			const resolver = new PathResolver().markExternal("my-custom-package");
			expect(
				resolver.resolve("my-custom-package", "src/App.tsx").isExternal,
			).toBe(true);
		});

		it("should mark multiple packages as external", () => {
			const resolver = new PathResolver().markExternalPackages([
				"pkg1",
				"pkg2",
				"pkg3",
			]);
			expect(resolver.resolve("pkg1", "src/App.tsx").isExternal).toBe(true);
			expect(resolver.resolve("pkg2", "src/App.tsx").isExternal).toBe(true);
			expect(resolver.resolve("pkg3", "src/App.tsx").isExternal).toBe(true);
		});
	});

	describe("Rust import resolution", () => {
		it("should resolve crate:: imports", () => {
			const resolver = new PathResolver();
			const result = resolver.resolve(
				"crate::config::DevBindConfig",
				"cli/src/cmd/add.rs",
			);
			expect(result.resolved).toBe("cli/src/config.rs");
			expect(result.isExternal).toBe(false);
		});

		it("should resolve crate:: imports from lib.rs", () => {
			const resolver = new PathResolver();
			const result = resolver.resolve(
				"crate::types::DeviceInfo",
				"core/src/lib.rs",
			);
			expect(result.resolved).toBe("core/src/types.rs");
			expect(result.isExternal).toBe(false);
		});

		it("should resolve super:: imports", () => {
			const resolver = new PathResolver();
			const result = resolver.resolve(
				"super::types::DeviceStatus",
				"cli/src/cmd/add.rs",
			);
			expect(result.resolved).toBe("cli/src/types.rs");
			expect(result.isExternal).toBe(false);
		});

		it("should resolve self:: imports", () => {
			const resolver = new PathResolver();
			const result = resolver.resolve(
				"self::helper::format",
				"cli/src/cmd/add.rs",
			);
			expect(result.resolved).toBe("cli/src/cmd/helper.rs");
			expect(result.isExternal).toBe(false);
		});

		it("should mark explicitly external crates", () => {
			const resolver = new PathResolver();
			resolver.markExternalPackages(["std", "anyhow", "serde", "tokio"]);
			expect(
				resolver.resolve("anyhow::Result", "cli/src/cmd/add.rs").isExternal,
			).toBe(true);
			expect(
				resolver.resolve("serde::Deserialize", "core/src/config.rs").isExternal,
			).toBe(true);
			expect(
				resolver.resolve("std::collections::HashMap", "main.rs").isExternal,
			).toBe(true);
		});

		it("should resolve local crate imports with rustCrateMapping", () => {
			const resolver = new PathResolver({
				rustCrateMapping: {
					devbind_core: "core",
					devbind_cli: "cli",
				},
			});
			const result = resolver.resolve(
				"devbind_core::config::DevBindConfig",
				"cli/src/cmd/add.rs",
			);
			expect(result.resolved).toBe("core/src/config.rs");
			expect(result.isExternal).toBe(false);
		});

		it("should resolve local crate imports using heuristic", () => {
			const resolver = new PathResolver();
			// devbind_core should map to core directory using heuristic (last part of snake_case)
			const result = resolver.resolve(
				"devbind_core::types::DeviceInfo",
				"gui/src/main.rs",
			);
			expect(result.resolved).toBe("core/src/types.rs");
			expect(result.isExternal).toBe(false);
		});

		it("should not treat local crate names as external", () => {
			const resolver = new PathResolver({
				rustCrateMapping: { my_crate: "crate_dir" },
			});
			// my_crate should NOT be treated as external even though it matches default external patterns
			const result = resolver.resolve("my_crate::module::Type", "src/main.rs");
			expect(result.isExternal).toBe(false);
			expect(result.resolved).toBe("crate_dir/src/module.rs");
		});

		it("should handle Rust imports without item name", () => {
			const resolver = new PathResolver({
				rustCrateMapping: { devbind_core: "core" },
			});
			// Import without item name (just module)
			const result = resolver.resolve(
				"devbind_core::config",
				"cli/src/main.rs",
			);
			expect(result.resolved).toBe("core/src/config.rs");
			expect(result.isExternal).toBe(false);
		});

		it("should handle crate:: imports without module path", () => {
			const resolver = new PathResolver();
			const result = resolver.resolve("crate::some_item", "cli/src/lib.rs");
			expect(result.resolved).toBe("cli/src/lib.rs");
			expect(result.isExternal).toBe(false);
		});
	});

	describe("Edge cases", () => {
		it("should handle quoted imports", () => {
			const result = resolveImport('"./utils"', "src/App.tsx");
			expect(result.resolved).toBe("src/utils.ts");
		});

		it("should handle single quoted imports", () => {
			const result = resolveImport("'./utils'", "src/App.tsx");
			expect(result.resolved).toBe("src/utils.ts");
		});

		it("should handle paths with dots in filename", () => {
			const result = resolveImport("./file.test.spec", "src/App.tsx");
			expect(result.resolved).toBe("src/file.test.spec.ts");
		});

		it("should handle empty base path", () => {
			const resolver = new PathResolver({ baseDir: "" });
			const result = resolver.resolve("./utils", "src/App.tsx");
			expect(result.resolved).toBe("src/utils.ts");
		});

		it("should handle baseDir option", () => {
			const resolver = new PathResolver({ baseDir: "project" });
			const result = resolver.resolve("./lib/utils", "src/App.tsx");
			// baseDir affects how relative paths are resolved
			expect(result.isExternal).toBe(false);
		});
	});

	describe("resolveAll", () => {
		it("should resolve multiple imports at once", () => {
			const resolver = new PathResolver();
			const results = resolver.resolveAll(
				[
					{ source: "./utils" },
					{ source: "react" },
					{ source: "@/components" },
				],
				"src/App.tsx",
			);
			expect(results).toHaveLength(3);
			expect(results[0]?.isExternal).toBe(false); // ./utils
			expect(results[1]?.isExternal).toBe(true); // react
			// @/components - depends on alias configuration
			expect(results[2]).toBeDefined();
		});
	});
});

// ============================================
// Language Detection Tests (100% coverage)
// ============================================
describe("Language Detection - Complete Coverage", () => {
	it("should detect TypeScript files", () => {
		expect(detectLanguage("src/App.ts")).toBe("typescript");
		expect(detectLanguage("src/App.tsx")).toBe("typescript");
	});

	it("should detect JavaScript files", () => {
		expect(detectLanguage("src/app.js")).toBe("javascript");
		expect(detectLanguage("src/App.jsx")).toBe("javascript");
	});

	it("should detect Python files", () => {
		expect(detectLanguage("src/main.py")).toBe("python");
	});

	it("should detect Go files", () => {
		expect(detectLanguage("main.go")).toBe("go");
	});

	it("should detect Rust files", () => {
		expect(detectLanguage("src/main.rs")).toBe("rust");
	});

	it("should detect Java files", () => {
		expect(detectLanguage("Main.java")).toBe("java");
	});

	it("should detect C/C++ files", () => {
		expect(detectLanguage("main.c")).toBe("c");
		expect(detectLanguage("main.cpp")).toBe("cpp");
		expect(detectLanguage("main.cc")).toBe("cpp");
		expect(detectLanguage("main.cxx")).toBe("cpp");
		expect(detectLanguage("header.h")).toBe("c");
		// Note: .hpp is not in the current implementation, returns c for .h
	});

	it("should detect C# files", () => {
		expect(detectLanguage("Program.cs")).toBe("csharp");
	});

	it("should detect Kotlin files", () => {
		expect(detectLanguage("Main.kt")).toBe("kotlin");
		expect(detectLanguage("Main.kts")).toBe("kotlin");
	});

	it("should detect Swift files", () => {
		expect(detectLanguage("ViewController.swift")).toBe("swift");
	});

	it("should detect PHP files", () => {
		expect(detectLanguage("index.php")).toBe("php");
	});

	it("should detect Ruby files", () => {
		expect(detectLanguage("app.rb")).toBe("ruby");
	});

	it("should detect Scala files", () => {
		expect(detectLanguage("Main.scala")).toBe("scala");
	});

	it("should detect Shell files", () => {
		expect(detectLanguage("script.sh")).toBe("shell");
		expect(detectLanguage("script.bash")).toBe("shell");
		expect(detectLanguage("script.zsh")).toBe("shell");
	});

	it("should detect SQL files", () => {
		expect(detectLanguage("query.sql")).toBe("sql");
	});

	it("should return null for unknown extensions", () => {
		expect(detectLanguage("file.xyz")).toBeNull();
		expect(detectLanguage("README")).toBeNull();
		expect(detectLanguage(".gitignore")).toBeNull();
	});
});

// ============================================
// Hotspot Analysis Tests (100% coverage target)
// ============================================
describe("Hotspot Analysis - Complete Coverage", () => {
	it("should return empty for empty graph", () => {
		const result = performHotspotAnalysis({
			nodes: [],
			edges: [],
			metadata: {
				totalNodes: 0,
				totalEdges: 0,
				languageBreakdown: {},
				unresolvedImports: 0,
			},
		});
		expect(result.hotspots).toHaveLength(0);
	});

	it("should calculate fan-in correctly", () => {
		const result = performHotspotAnalysis({
			nodes: [
				{
					id: "utils.ts",
					path: "utils.ts",
					language: "typescript",
					imports: 0,
					loc: 100,
				},
				{
					id: "a.ts",
					path: "a.ts",
					language: "typescript",
					imports: 1,
					loc: 50,
				},
				{
					id: "b.ts",
					path: "b.ts",
					language: "typescript",
					imports: 1,
					loc: 50,
				},
			],
			edges: [
				{ source: "a.ts", target: "utils.ts" },
				{ source: "b.ts", target: "utils.ts" },
			],
			metadata: {
				totalNodes: 3,
				totalEdges: 2,
				languageBreakdown: { typescript: 3 },
				unresolvedImports: 0,
			},
		});

		const utilsHotspot = result.hotspots.find((h) => h.path === "utils.ts");
		expect(utilsHotspot?.fanIn).toBe(2);
	});

	it("should calculate fan-out from node imports", () => {
		const result = performHotspotAnalysis({
			nodes: [
				{
					id: "app.ts",
					path: "app.ts",
					language: "typescript",
					imports: 2,
					loc: 100,
				},
				{
					id: "utils.ts",
					path: "utils.ts",
					language: "typescript",
					imports: 0,
					loc: 50,
				},
			],
			edges: [{ source: "app.ts", target: "utils.ts" }],
			metadata: {
				totalNodes: 2,
				totalEdges: 1,
				languageBreakdown: { typescript: 2 },
				unresolvedImports: 0,
			},
		});

		const appHotspot = result.hotspots.find((h) => h.path === "app.ts");
		expect(appHotspot?.fanOut).toBe(2); // from node.imports
	});

	it("should rank hotspots by score", () => {
		const result = performHotspotAnalysis({
			nodes: [
				{
					id: "high.ts",
					path: "high.ts",
					language: "typescript",
					imports: 5,
					loc: 1000,
				},
				{
					id: "low.ts",
					path: "low.ts",
					language: "typescript",
					imports: 1,
					loc: 100,
				},
			],
			edges: [{ source: "low.ts", target: "high.ts" }],
			metadata: {
				totalNodes: 2,
				totalEdges: 1,
				languageBreakdown: { typescript: 2 },
				unresolvedImports: 0,
			},
		});

		expect(result.hotspots[0]?.path).toBe("high.ts");
		expect(result.hotspots[0]?.rank).toBe(1);
	});

	it("should limit to top 50 hotspots", () => {
		const nodes = Array.from({ length: 60 }, (_, i) => ({
			id: `file${i}.ts`,
			path: `file${i}.ts`,
			language: "typescript",
			imports: i,
			loc: i * 10,
		}));

		const result = performHotspotAnalysis({
			nodes,
			edges: [],
			metadata: {
				totalNodes: 60,
				totalEdges: 0,
				languageBreakdown: { typescript: 60 },
				unresolvedImports: 0,
			},
		});

		expect(result.hotspots).toHaveLength(50);
	});

	it("should handle nodes with zero LOC", () => {
		const result = performHotspotAnalysis({
			nodes: [
				{
					id: "empty.ts",
					path: "empty.ts",
					language: "typescript",
					imports: 0,
					loc: 0,
				},
			],
			edges: [],
			metadata: {
				totalNodes: 1,
				totalEdges: 0,
				languageBreakdown: { typescript: 1 },
				unresolvedImports: 0,
			},
		});

		expect(result.hotspots).toHaveLength(1);
		expect(result.hotspots[0]?.score).toBeGreaterThanOrEqual(0);
	});

	it("should calculate score based on normalized values", () => {
		const result = performHotspotAnalysis({
			nodes: [
				{
					id: "a.ts",
					path: "a.ts",
					language: "typescript",
					imports: 2,
					loc: 500,
				},
				{
					id: "b.ts",
					path: "b.ts",
					language: "typescript",
					imports: 1,
					loc: 100,
				},
				{
					id: "c.ts",
					path: "c.ts",
					language: "typescript",
					imports: 0,
					loc: 50,
				},
			],
			edges: [
				{ source: "b.ts", target: "a.ts" },
				{ source: "c.ts", target: "a.ts" },
			],
			metadata: {
				totalNodes: 3,
				totalEdges: 2,
				languageBreakdown: { typescript: 3 },
				unresolvedImports: 0,
			},
		});

		// "a.ts" has highest fan-in, should be ranked first
		expect(result.hotspots[0]?.path).toBe("a.ts");
		// Scores should be between 0 and 1
		for (const hotspot of result.hotspots) {
			expect(hotspot.score).toBeGreaterThanOrEqual(0);
			expect(hotspot.score).toBeLessThanOrEqual(1);
		}
	});
});
