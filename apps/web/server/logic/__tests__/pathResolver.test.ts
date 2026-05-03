import { describe, expect, it } from "vitest";
import { PathResolver, presets } from "../parsers/pathResolver";

describe("PathResolver", () => {
	describe("basic resolution", () => {
		it("should resolve relative imports", () => {
			const resolver = new PathResolver();
			const result = resolver.resolve("./utils", "src/components/Button.tsx");
			expect(result.isExternal).toBe(false);
			expect(result.resolved).toBe("src/components/utils.ts");
		});

		it("should resolve parent directory imports", () => {
			const resolver = new PathResolver();
			const result = resolver.resolve(
				"../lib/utils",
				"src/components/Button.tsx",
			);
			expect(result.isExternal).toBe(false);
			expect(result.resolved).toBe("src/lib/utils.ts");
		});

		it("should handle imports with extensions", () => {
			const resolver = new PathResolver();
			const result = resolver.resolve(
				"./utils.ts",
				"src/components/Button.tsx",
			);
			expect(result.resolved).toBe("src/components/utils.ts");
		});
	});

	describe("external packages", () => {
		it("should detect external packages", () => {
			const resolver = new PathResolver();
			const result = resolver.resolve("react", "src/App.tsx");
			expect(result.isExternal).toBe(true);
			expect(result.resolved).toBeNull();
		});

		it("should detect scoped packages", () => {
			const resolver = new PathResolver();
			const result = resolver.resolve("@tanstack/react-query", "src/App.tsx");
			expect(result.isExternal).toBe(true);
		});

		it("should detect packages with subpaths", () => {
			const resolver = new PathResolver();
			const result = resolver.resolve("lodash/get", "src/App.tsx");
			expect(result.isExternal).toBe(true);
		});
	});

	describe("alias patterns", () => {
		it("should resolve custom alias patterns", () => {
			const resolver = new PathResolver().addAlias("@/", "src");
			const result = resolver.resolve(
				"@/lib/utils",
				"src/components/Button.tsx",
			);
			expect(result.isExternal).toBe(false);
			expect(result.resolved).toBe("src/lib/utils.ts");
			expect(result.aliasPattern).toBe("@/");
		});

		it("should resolve tilde alias", () => {
			const resolver = new PathResolver().addAlias("~/", "src");
			const result = resolver.resolve(
				"~/lib/utils",
				"src/components/Button.tsx",
			);
			expect(result.isExternal).toBe(false);
			expect(result.resolved).toBe("src/lib/utils.ts");
		});

		it("should resolve hash alias", () => {
			const resolver = new PathResolver().addAlias("#/", "src");
			const result = resolver.resolve(
				"#/lib/utils",
				"src/components/Button.tsx",
			);
			expect(result.isExternal).toBe(false);
			expect(result.resolved).toBe("src/lib/utils.ts");
		});

		it("should handle multiple alias patterns", () => {
			const resolver = new PathResolver()
				.addAlias("@/", "src")
				.addAlias("~/", "app")
				.addAlias("#/", "lib");

			const result1 = resolver.resolve("@/components/Button", "src/App.tsx");
			const result2 = resolver.resolve("~/pages/Home", "src/App.tsx");
			const result3 = resolver.resolve("#/utils/format", "src/App.tsx");

			expect(result1.resolved).toBe("src/components/Button.ts");
			expect(result2.resolved).toBe("app/pages/Home.ts");
			expect(result3.resolved).toBe("lib/utils/format.ts");
		});
	});

	describe("marked external packages", () => {
		it("should mark specific packages as external", () => {
			const resolver = new PathResolver().markExternal("my-package");
			const result = resolver.resolve("my-package", "src/App.tsx");
			expect(result.isExternal).toBe(true);
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

	describe("edge cases", () => {
		it("should handle paths with dots", () => {
			const resolver = new PathResolver();
			const result = resolver.resolve(
				"./file.test",
				"src/components/Button.tsx",
			);
			expect(result.resolved).toBe("src/components/file.test.ts");
		});

		it("should handle deep relative paths", () => {
			const resolver = new PathResolver();
			const result = resolver.resolve("../../../utils", "src/a/b/c/d.ts");
			expect(result.resolved).toBe("src/utils.ts");
		});
	});
});

describe("presets", () => {
	describe("typescript", () => {
		it("should create resolver with common aliases", () => {
			const resolver = presets.typescript();
			const result = resolver.resolve("@/lib/utils", "src/App.tsx");
			expect(result.isExternal).toBe(false);
			expect(result.resolved).toBe("src/lib/utils.ts");
		});

		it("should handle tsconfig paths", () => {
			const resolver = presets.typescript({
				tsconfigAliases: {
					"@/*": ["src/*"],
					"~/*": ["app/*"],
				},
			});
			const result1 = resolver.resolve("@/components/Button", "src/App.tsx");
			const result2 = resolver.resolve("~/pages/Home", "src/App.tsx");
			expect(result1.resolved).toBe("src/components/Button.ts");
			expect(result2.resolved).toBe("app/pages/Home.ts");
		});

		it("should support custom basePath", () => {
			const resolver = presets.typescript({ basePath: "app" });
			const result = resolver.resolve("@/lib/utils", "app/App.tsx");
			expect(result.resolved).toBe("app/lib/utils.ts");
		});

		it("should use basePath from tsconfig aliases", () => {
			const resolver = presets.typescript({
				tsconfigAliases: {
					"@/*": ["lib/*"],
				},
			});
			const result = resolver.resolve("@/utils/format", "src/App.tsx");
			expect(result.resolved).toBe("lib/utils/format.ts");
		});
	});

	describe("nextjs", () => {
		it("should create resolver for Next.js projects", () => {
			const resolver = presets.nextjs();
			const result = resolver.resolve("@/lib/utils", "src/App.tsx");
			expect(result.isExternal).toBe(false);
		});

		it("should support custom basePath", () => {
			const resolver = presets.nextjs("app");
			const result = resolver.resolve("@/components/Header", "app/layout.tsx");
			expect(result.resolved).toBe("app/components/Header.ts");
		});
	});

	describe("nuxt", () => {
		it("should support custom basePath", () => {
			const resolver = presets.nuxt("src");
			const result = resolver.resolve("~/components/Button.vue", "src/App.vue");
			expect(result.resolved).toBe("src/components/Button.vue.ts");
		});
	});

	describe("vite", () => {
		it("should support custom basePath", () => {
			const resolver = presets.vite("lib");
			const result = resolver.resolve("@/utils/format", "src/App.tsx");
			expect(result.resolved).toBe("lib/utils/format.ts");
		});

		it("should use default basePath", () => {
			const resolver = presets.vite();
			const result = resolver.resolve("#/helpers/parse", "src/index.ts");
			expect(result.resolved).toBe("src/helpers/parse.ts");
		});
	});

	describe("python", () => {
		it("should mark Python stdlib as external", () => {
			const resolver = presets.python();
			expect(resolver.resolve("os", "app.py").isExternal).toBe(true);
			expect(resolver.resolve("sys", "app.py").isExternal).toBe(true);
			expect(resolver.resolve("json", "app.py").isExternal).toBe(true);
		});

		it("should mark custom packages as external", () => {
			const resolver = presets.python(["flask", "django"]);
			expect(resolver.resolve("flask", "app.py").isExternal).toBe(true);
			expect(resolver.resolve("django", "app.py").isExternal).toBe(true);
		});
	});

	describe("go", () => {
		it("should mark Go stdlib as external", () => {
			const resolver = presets.go("github.com/user/project");
			expect(resolver.resolve("fmt", "main.go").isExternal).toBe(true);
			expect(resolver.resolve("os", "main.go").isExternal).toBe(true);
		});
	});

	describe("rust", () => {
		it("should mark Rust stdlib as external", () => {
			const resolver = presets.rust(["serde", "tokio"]);
			expect(resolver.resolve("std", "lib.rs").isExternal).toBe(true);
			expect(resolver.resolve("serde", "lib.rs").isExternal).toBe(true);
			expect(resolver.resolve("tokio", "lib.rs").isExternal).toBe(true);
		});
	});

	describe("java", () => {
		it("should mark Java stdlib as external", () => {
			const resolver = presets.java();
			expect(resolver.resolve("java.util.List", "Main.java").isExternal).toBe(
				true,
			);
			expect(resolver.resolve("javax.swing", "Main.java").isExternal).toBe(
				true,
			);
		});
	});

	describe("php", () => {
		it("should mark PHP packages as external", () => {
			const resolver = presets.php();
			expect(
				resolver.resolve("Laravel\\Framework", "index.php").isExternal,
			).toBe(true);
			expect(
				resolver.resolve("GuzzleHttp\\Client", "index.php").isExternal,
			).toBe(true);
		});
	});
});
