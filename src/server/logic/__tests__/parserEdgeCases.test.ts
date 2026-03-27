import { describe, expect, it } from "vitest";
import { createRegexParser } from "../parsers/regexParser";

describe("Regex Parser Edge Cases", () => {
	describe("createRegexParser", () => {
		it("should handle files with only whitespace", async () => {
			const parser = createRegexParser("test", [/import\s+(\w+)/]);
			const result = await parser("   \n   \n   ", "test.txt");
			expect(result.imports).toHaveLength(0);
			expect(result.parseError).toBeUndefined();
		});

		it("should handle single quoted require paths", async () => {
			const parser = createRegexParser(
				"test",
				[/require\s*\(['"]([^'"]+)['"]\)/],
				[],
			);
			const content = "require('lodash');";
			const result = await parser(content, "test.txt");
			expect(result.imports[0]?.source).toBe("lodash");
		});

		it("should handle very long lines without crashing", async () => {
			const parser = createRegexParser("test", [/import\s+(\w+)/]);
			const longLine = "import " + "a".repeat(10000);
			const result = await parser(longLine, "test.txt");
			expect(result.imports[0]?.source).toBe("a".repeat(10000));
		});

		it("should handle multiple patterns matching same line", async () => {
			const parser = createRegexParser("test", [
				/import\s+(\w+)/,
				/require\s+(\w+)/,
			]);
			const result = await parser("import foo", "test.txt");
			expect(result.imports).toHaveLength(1);
			expect(result.imports[0]?.source).toBe("foo");
		});

		it("should return correct metadata for empty file", async () => {
			const parser = createRegexParser("myLang", [/import\s+(\w+)/]);
			const result = await parser("", "empty.myLang");
			expect(result.language).toBe("myLang");
			expect(result.path).toBe("empty.myLang");
			expect(result.imports).toHaveLength(0);
		});

		it("should handle multiple newlines between imports", async () => {
			const parser = createRegexParser("test", [/import\s+(\w+)/]);
			const result = await parser(
				"import a\n\nimport b\n\nimport c",
				"test.txt",
			);
			expect(result.imports).toHaveLength(3);
		});

		it("should handle null-like values in patterns", async () => {
			const parser = createRegexParser("test", [/import\s+([\w.]+)/]);
			const result = await parser("import com.example.Class", "test.txt");
			expect(result.imports).toHaveLength(1);
			expect(result.imports[0]?.source).toBe("com.example.Class");
		});

		it("should deduplicate imports across lines", async () => {
			const parser = createRegexParser("test", [/import\s+(\w+)/]);
			const result = await parser("import a\nimport a", "test.txt");
			expect(result.imports).toHaveLength(1);
		});

		it("should handle trailing newlines", async () => {
			const parser = createRegexParser("test", [/import\s+(\w+)/]);
			const result = await parser("import a\nimport b\n", "test.txt");
			expect(result.imports).toHaveLength(2);
		});

		it("should handle custom comment prefixes", async () => {
			const parser = createRegexParser("custom", [/import\s+(\w+)/], ["--"]);
			const result = await parser("-- import a\nimport b", "test.txt");
			expect(result.imports).toHaveLength(1);
			expect(result.imports[0]?.source).toBe("b");
		});

		it("should handle single quoted imports", async () => {
			const parser = createRegexParser("test", [/import\s+[']([^']+)[']/]);
			const result = await parser("import 'lodash'", "test.txt");
			expect(result.imports).toHaveLength(1);
		});

		it("should handle double quoted imports", async () => {
			const parser = createRegexParser("test", [/import\s+["]([^"]+)["]/]);
			const result = await parser('import "lodash"', "test.txt");
			expect(result.imports).toHaveLength(1);
		});

		it("should return parseError as undefined on success", async () => {
			const parser = createRegexParser("test", [/import\s+(\w+)/]);
			const result = await parser("import foo", "test.txt");
			expect(result.parseError).toBeUndefined();
		});
	});

	describe("error handling", () => {
		it("should handle empty string content", async () => {
			const parser = createRegexParser("test", [/import\s+(\w+)/]);
			const result = await parser("", "empty.txt");
			expect(result.imports).toHaveLength(0);
			expect(result.parseError).toBeUndefined();
		});

		it("should handle content with no pattern matches", async () => {
			const parser = createRegexParser("test", [/import\s+(\w+)/]);
			const result = await parser("export const foo = 1", "test.txt");
			expect(result.imports).toHaveLength(0);
		});

		it("should preserve result metadata on empty imports", async () => {
			const parser = createRegexParser("lang", [/import\s+(\w+)/]);
			const result = await parser("only code", "path/lang");
			expect(result.language).toBe("lang");
			expect(result.path).toBe("path/lang");
		});

		it("should handle empty patterns array", async () => {
			const parser = createRegexParser("test", []);
			const result = await parser("import foo", "test.txt");
			expect(result.imports).toHaveLength(0);
			expect(result.parseError).toBeUndefined();
		});
	});

	describe("Java imports", () => {
		const javaParser = createRegexParser("java", [/import\s+([\w.]+);/]);

		it("should parse simple import", async () => {
			const result = await javaParser("import java.util.List;", "Test.java");
			expect(result.imports[0]?.source).toBe("java.util.List");
		});

		it("should parse nested package imports", async () => {
			const result = await javaParser(
				"import com.example.project.utils.StringHelper;",
				"Test.java",
			);
			expect(result.imports[0]?.source).toBe(
				"com.example.project.utils.StringHelper",
			);
		});

		it("should handle multiple imports in one file", async () => {
			const content = `
import java.util.List;
import java.util.Map;
import java.io.File;
`;
			const result = await javaParser(content, "Test.java");
			expect(result.imports).toHaveLength(3);
		});

		it("should deduplicate imports", async () => {
			const content = `
import java.util.List;
import java.util.List;
`;
			const result = await javaParser(content, "Test.java");
			expect(result.imports).toHaveLength(1);
		});
	});

	describe("Ruby imports", () => {
		const rubyParser = createRegexParser("ruby", [
			/require\s+['"]([^'"]+)['"]/,
			/require_relative\s+['"]([^'"]+)['"]/,
		]);

		it("should parse require statements", async () => {
			const result = await rubyParser("require 'json'", "test.rb");
			expect(result.imports[0]?.source).toBe("json");
		});

		it("should parse require_relative", async () => {
			const result = await rubyParser(
				"require_relative './helpers'",
				"test.rb",
			);
			expect(result.imports[0]?.source).toBe("./helpers");
		});

		it("should handle nested require paths", async () => {
			const result = await rubyParser(
				"require 'active_support/core_ext/object/try'",
				"test.rb",
			);
			expect(result.imports[0]?.source).toBe(
				"active_support/core_ext/object/try",
			);
		});
	});
});
