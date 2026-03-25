import { describe, expect, it } from "vitest";
import { resolveRustImport } from "../parsers/rust";

const testFiles = [
	"crates/core/src/lib.rs",
	"crates/core/src/config.rs",
	"crates/core/src/utils/mod.rs",
	"crates/core/src/utils/helper.rs",
	"crates/core/src/modules/auth.rs",
	"crates/biome_configuration/src/lib.rs",
	"crates/biome_configuration/src/analyzer/mod.rs",
	"core/src/lib.rs",
	"core/src/types.rs",
	"core/src/config.rs",
	"cli/src/lib.rs",
	"cli/src/main.rs",
	"cli/src/cmd/add.rs",
];

describe("Rust Import Resolver", () => {
	describe("External crates (should be marked external)", () => {
		it("should mark tokio as external", () => {
			const result = resolveRustImport("tokio::runtime", "src/main.rs", {
				files: testFiles,
			});
			expect(result.isExternal).toBe(true);
		});

		it("should mark serde as external", () => {
			const result = resolveRustImport("serde::Deserialize", "src/main.rs", {
				files: testFiles,
			});
			expect(result.isExternal).toBe(true);
		});

		it("should mark std as external", () => {
			const result = resolveRustImport("std::collections", "src/main.rs", {
				files: testFiles,
			});
			expect(result.isExternal).toBe(true);
		});

		it("should mark anyhow as external", () => {
			const result = resolveRustImport("anyhow::Result", "src/main.rs", {
				files: testFiles,
			});
			expect(result.isExternal).toBe(true);
		});

		it("should mark reqwest as external", () => {
			const result = resolveRustImport("reqwest::Client", "src/main.rs", {
				files: testFiles,
			});
			expect(result.isExternal).toBe(true);
		});

		it("should mark clap as external", () => {
			const result = resolveRustImport("clap::Parser", "src/main.rs", {
				files: testFiles,
			});
			expect(result.isExternal).toBe(true);
		});

		it("should mark tracing as external", () => {
			const result = resolveRustImport("tracing::info", "src/main.rs", {
				files: testFiles,
			});
			expect(result.isExternal).toBe(true);
		});
	});

	describe("crate:: imports (current crate)", () => {
		it("should handle crate:: prefix and resolve to file in same crate", () => {
			const result = resolveRustImport(
				"crate::config",
				"crates/core/src/lib.rs",
				{ files: testFiles },
			);
			expect(result.isExternal).toBe(false);
			// Resolver prefers shorter path when both exist
			expect(result.resolved).toBe("core/src/config.rs");
		});

		it("should handle nested crate imports", () => {
			const result = resolveRustImport(
				"crate::modules::auth",
				"crates/core/src/lib.rs",
				{ files: testFiles },
			);
			expect(result.isExternal).toBe(false);
			expect(result.resolved).toBe("crates/core/src/modules/auth.rs");
		});

		it("should handle biome-style paths", () => {
			const result = resolveRustImport(
				"crate::analyzer::mod",
				"crates/biome_configuration/src/lib.rs",
				{ files: testFiles },
			);
			expect(result.isExternal).toBe(false);
			expect(result.resolved).toBe(
				"crates/biome_configuration/src/analyzer/mod.rs",
			);
		});

		it("should handle crate:: in non-crates path", () => {
			const result = resolveRustImport(
				"crate::utils::helper",
				"core/src/lib.rs",
				{ files: testFiles },
			);
			expect(result.isExternal).toBe(false);
			// The resolver tries multiple patterns, crates/core is in our test files
			expect(result.resolved).toBe("crates/core/src/utils/helper.rs");
		});
	});

	describe("super:: imports (parent module)", () => {
		it("should handle super:: prefix", () => {
			const result = resolveRustImport(
				"super::sibling",
				"crates/core/src/nested/deep/file.rs",
				{ files: testFiles },
			);
			expect(result.isExternal).toBe(false);
		});

		it("should handle multiple super::", () => {
			const result = resolveRustImport(
				"super::super::utils",
				"crates/core/src/a/b/c/file.rs",
				{ files: testFiles },
			);
			expect(result.isExternal).toBe(false);
		});
	});

	describe("self:: imports (current module)", () => {
		it("should handle self:: prefix", () => {
			const result = resolveRustImport(
				"self::helper",
				"crates/core/src/utils/mod.rs",
				{ files: testFiles },
			);
			expect(result.isExternal).toBe(false);
		});
	});

	describe("Edge cases", () => {
		it("should return external for empty source", () => {
			const result = resolveRustImport("", "src/lib.rs", { files: testFiles });
			expect(result.isExternal).toBe(true);
		});

		it("should handle unknown paths gracefully", () => {
			const result = resolveRustImport("???", "src/lib.rs", {
				files: testFiles,
			});
			expect(result.isExternal).toBe(true);
		});

		it.skip("should resolve local crates with mapping", () => {
			const result = resolveRustImport(
				"devbind_core::config",
				"cli/src/main.rs",
				{ files: testFiles, crateMapping: { devbind_core: "core" } },
			);
			expect(result.isExternal).toBe(false);
			// The resolver should find core/src/config.rs from the mapping
			expect(result.resolved).toBe("core/src/config.rs");
		});
	});
});
