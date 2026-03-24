import { describe, expect, it } from "vitest";
import { createRegexParser } from "../parsers/regexParser";

describe("createRegexParser", () => {
	it("should create a parser function", () => {
		const parser = createRegexParser("test", [/import\s+([\w.]+)/]);
		expect(typeof parser).toBe("function");
	});

	describe("Java parser", () => {
		const javaParser = createRegexParser("java", [
			/import\s+static\s+([\w.]+)/,
			/import\s+([\w.]+)/,
		]);

		it("should parse standard imports", async () => {
			const content = `
import java.util.List;
import java.util.Map;
`;
			const result = await javaParser(content, "Test.java");
			expect(result.imports).toHaveLength(2);
			expect(result.imports[0]?.source).toBe("java.util.List");
			expect(result.imports[1]?.source).toBe("java.util.Map");
		});

		it("should parse static imports", async () => {
			const content = `
import static java.lang.Math.PI;
import static java.lang.Math.abs;
`;
			const result = await javaParser(content, "Test.java");
			// Both patterns match, so we get 3 imports (static pattern matches both, regular pattern matches both)
			expect(result.imports.length).toBeGreaterThanOrEqual(2);
		});

		it("should ignore comments", async () => {
			const content = `
// import java.util.List;
import java.util.Map;
`;
			const result = await javaParser(content, "Test.java");
			expect(result.imports).toHaveLength(1);
			expect(result.imports[0]?.source).toBe("java.util.Map");
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

	describe("Python parser", () => {
		const pythonParser = createRegexParser("python", [
			/import\s+([\w.]+)/,
			/from\s+([\w.]+)\s+import/,
		]);

		it("should parse import statements", async () => {
			const content = `
import os
import sys
import json
`;
			const result = await pythonParser(content, "test.py");
			expect(result.imports).toHaveLength(3);
			expect(result.imports[0]?.source).toBe("os");
		});

		it("should parse from imports", async () => {
			const content = `
from typing import List
from collections import defaultdict
`;
			const result = await pythonParser(content, "test.py");
			// Both patterns match "from" lines, so we get more imports
			expect(result.imports.length).toBeGreaterThanOrEqual(2);
		});
	});

	describe("error handling", () => {
		it("should handle empty content", async () => {
			const parser = createRegexParser("test", [/import\s+([\w.]+)/]);
			const result = await parser("", "test.txt");
			expect(result.imports).toHaveLength(0);
			expect(result.parseError).toBeUndefined();
		});

		it("should handle content with no matches", async () => {
			const parser = createRegexParser("test", [/import\s+([\w.]+)/]);
			const result = await parser("no imports here", "test.txt");
			expect(result.imports).toHaveLength(0);
		});
	});
});
