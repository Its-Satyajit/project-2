import { describe, expect, it, vi } from "vitest";
import {
	detectLanguage,
	performDependencyAnalysis,
} from "../dependencyAnalysis";

// Mock the parsers to avoid tree-sitter dependencies
vi.mock("../parsers/typescript", () => ({
	parseTypescript: vi.fn().mockResolvedValue({
		path: "test.ts",
		language: "typescript",
		imports: [
			{ raw: 'import { foo } from "./bar"', source: "./bar", isDynamic: false },
		],
	}),
}));

vi.mock("../parsers/python", () => ({
	parsePython: vi.fn().mockResolvedValue({
		path: "test.py",
		language: "python",
		imports: [{ raw: "import os", source: "os", isDynamic: false }],
	}),
}));

vi.mock("../parsers/go", () => ({
	parseGo: vi.fn().mockResolvedValue({
		path: "test.go",
		language: "go",
		imports: [{ raw: 'import "fmt"', source: "fmt", isDynamic: false }],
	}),
}));

vi.mock("../parsers/rust", () => ({
	parseRust: vi.fn().mockResolvedValue({
		path: "test.rs",
		language: "rust",
		imports: [{ raw: "use std::io", source: "std::io", isDynamic: false }],
	}),
}));

vi.mock("../parsers/regexParser", () => ({
	createRegexParser: vi.fn().mockReturnValue(
		vi.fn().mockResolvedValue({
			path: "test.java",
			language: "java",
			imports: [
				{
					raw: "import java.util.List",
					source: "java.util.List",
					isDynamic: false,
				},
			],
		}),
	),
}));

describe("detectLanguage", () => {
	describe("TypeScript/JavaScript", () => {
		it("should detect .ts files", () => {
			expect(detectLanguage("src/app.ts")).toBe("typescript");
		});

		it("should detect .tsx files", () => {
			expect(detectLanguage("src/App.tsx")).toBe("typescript");
		});

		it("should detect .js files", () => {
			expect(detectLanguage("src/utils.js")).toBe("javascript");
		});

		it("should detect .jsx files", () => {
			expect(detectLanguage("src/App.jsx")).toBe("javascript");
		});
	});

	describe("Python", () => {
		it("should detect .py files", () => {
			expect(detectLanguage("script.py")).toBe("python");
		});
	});

	describe("Go", () => {
		it("should detect .go files", () => {
			expect(detectLanguage("main.go")).toBe("go");
		});
	});

	describe("Rust", () => {
		it("should detect .rs files", () => {
			expect(detectLanguage("lib.rs")).toBe("rust");
		});
	});

	describe("Java", () => {
		it("should detect .java files", () => {
			expect(detectLanguage("Main.java")).toBe("java");
		});
	});

	describe("C/C++", () => {
		it("should detect .c files", () => {
			expect(detectLanguage("main.c")).toBe("c");
		});

		it("should detect .h files", () => {
			expect(detectLanguage("header.h")).toBe("c");
		});

		it("should detect .cpp files", () => {
			expect(detectLanguage("main.cpp")).toBe("cpp");
		});

		it("should detect .cc files", () => {
			expect(detectLanguage("main.cc")).toBe("cpp");
		});

		it("should detect .cxx files", () => {
			expect(detectLanguage("main.cxx")).toBe("cpp");
		});
	});

	describe("Other languages", () => {
		it("should detect .cs files", () => {
			expect(detectLanguage("Program.cs")).toBe("csharp");
		});

		it("should detect .kt files", () => {
			expect(detectLanguage("Main.kt")).toBe("kotlin");
		});

		it("should detect .swift files", () => {
			expect(detectLanguage("ViewController.swift")).toBe("swift");
		});

		it("should detect .php files", () => {
			expect(detectLanguage("index.php")).toBe("php");
		});

		it("should detect .rb files", () => {
			expect(detectLanguage("app.rb")).toBe("ruby");
		});

		it("should detect .scala files", () => {
			expect(detectLanguage("Main.scala")).toBe("scala");
		});

		it("should detect .sh files", () => {
			expect(detectLanguage("script.sh")).toBe("shell");
		});

		it("should detect .hs files", () => {
			expect(detectLanguage("Main.hs")).toBe("haskell");
		});

		it("should detect .ex files", () => {
			expect(detectLanguage("app.ex")).toBe("elixir");
		});

		it("should detect .sql files", () => {
			expect(detectLanguage("query.sql")).toBe("sql");
		});
	});

	describe("Unknown extensions", () => {
		it("should return null for unknown extensions", () => {
			expect(detectLanguage("file.xyz")).toBeNull();
		});

		it("should return null for files without extension", () => {
			expect(detectLanguage("README")).toBeNull();
		});
	});
});

describe("performDependencyAnalysis", () => {
	it("should analyze files and return graph", async () => {
		const files = [
			{
				path: "src/app.ts",
				content: 'import { foo } from "./bar"',
				language: "typescript",
				loc: 10,
			},
			{
				path: "src/bar.ts",
				content: "export const foo = 1",
				language: "typescript",
				loc: 5,
			},
		];

		const result = await performDependencyAnalysis(files);

		expect(result.processedFiles).toBe(2);
		expect(result.skippedFiles).toBe(0);
		expect(result.graph.nodes).toHaveLength(2);
		expect(result.graph.metadata.totalNodes).toBe(2);
	});

	it("should skip files with unsupported languages", async () => {
		const files = [
			{ path: "README.md", content: "# Hello", language: "markdown", loc: 1 },
		];

		const result = await performDependencyAnalysis(files);

		expect(result.processedFiles).toBe(0);
		expect(result.skippedFiles).toBe(1);
	});

	it("should handle files exceeding max size", async () => {
		const largeContent = "x".repeat(1024 * 1024 + 1); // 1MB + 1 byte
		const files = [
			{
				path: "src/large.ts",
				content: largeContent,
				language: "typescript",
				loc: 1000,
			},
		];

		const result = await performDependencyAnalysis(files);

		expect(result.processedFiles).toBe(0);
		expect(result.skippedFiles).toBe(1);
	});

	it("should respect max files limit", async () => {
		const files = Array.from({ length: 1001 }, (_, i) => ({
			path: `src/file${i}.ts`,
			content: "export {}",
			language: "typescript",
			loc: 1,
		}));

		const result = await performDependencyAnalysis(files);

		expect(result.processedFiles).toBeLessThanOrEqual(1000);
	});

	it("should detect language from extension", () => {
		expect(detectLanguage("src/app.ts")).toBe("typescript");
		expect(detectLanguage("src/app.py")).toBe("python");
		expect(detectLanguage("src/app.go")).toBe("go");
		expect(detectLanguage("src/app.rs")).toBe("rust");
	});
});
