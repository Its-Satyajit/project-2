import { describe, expect, it } from "vitest";
import { convertToFileTree, getAllPaths } from "../treeUtils";

describe("convertToFileTree", () => {
	it("should return empty array for null input", () => {
		expect(convertToFileTree(null)).toEqual([]);
	});

	it("should return empty array for undefined input", () => {
		expect(convertToFileTree(undefined)).toEqual([]);
	});

	it("should convert flat file list to tree", () => {
		const files = [
			{ path: "src/app.ts", isDirectory: false },
			{ path: "src/utils.ts", isDirectory: false },
		];
		const tree = convertToFileTree(files);

		expect(tree).toHaveLength(1); // One root: "src"
		expect(tree[0]?.name).toBe("src");
		if ("items" in tree[0]!) {
			expect(tree[0].items).toHaveLength(2);
		}
	});

	it("should handle nested directories", () => {
		const files = [
			{ path: "src/components/Button.tsx", isDirectory: false },
			{ path: "src/components/Input.tsx", isDirectory: false },
			{ path: "src/lib/utils.ts", isDirectory: false },
		];
		const tree = convertToFileTree(files);

		expect(tree).toHaveLength(1); // One root: "src"
		const srcNode = tree[0];
		expect(srcNode?.name).toBe("src");
		if ("items" in srcNode!) {
			expect(srcNode.items).toHaveLength(2); // "components" and "lib"
		}
	});

	it("should handle directory items", () => {
		const files = [
			{ path: "src", isDirectory: true },
			{ path: "src/app.ts", isDirectory: false },
		];
		const tree = convertToFileTree(files);

		expect(tree).toHaveLength(1);
		expect(tree[0]?.name).toBe("src");
	});

	it("should handle multiple root directories", () => {
		const files = [
			{ path: "src/app.ts", isDirectory: false },
			{ path: "docs/README.md", isDirectory: false },
		];
		const tree = convertToFileTree(files);

		expect(tree).toHaveLength(2); // "src" and "docs"
	});
});

describe("getAllPaths", () => {
	it("should return empty array for empty tree", () => {
		expect(getAllPaths([])).toEqual([]);
	});

	it("should get all paths from tree", () => {
		const tree = [
			{
				name: "src",
				items: [{ name: "app.ts" }, { name: "utils.ts" }],
			},
		];
		const paths = getAllPaths(tree);

		expect(paths).toContain("src");
		expect(paths).toContain("src/app.ts");
		expect(paths).toContain("src/utils.ts");
	});

	it("should handle nested directories", () => {
		const tree = [
			{
				name: "src",
				items: [
					{
						name: "components",
						items: [{ name: "Button.tsx" }],
					},
				],
			},
		];
		const paths = getAllPaths(tree);

		expect(paths).toContain("src");
		expect(paths).toContain("src/components");
		expect(paths).toContain("src/components/Button.tsx");
	});

	it("should handle multiple root items", () => {
		const tree = [
			{ name: "README.md" },
			{
				name: "src",
				items: [{ name: "app.ts" }],
			},
		];
		const paths = getAllPaths(tree);

		expect(paths).toContain("README.md");
		expect(paths).toContain("src");
		expect(paths).toContain("src/app.ts");
	});
});
