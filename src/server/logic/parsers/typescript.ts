import fs from "node:fs";
import path from "node:path";
import { Language, Parser } from "web-tree-sitter";
import type { ImportStatement, ParsedFile } from "./index";

let tsLanguage: Language | null = null;
let parser: Parser | null = null;

async function getTsParser(): Promise<Parser> {
	if (!parser) {
		await Parser.init();
		parser = new Parser();
		const wasmPath = path.join(
			process.cwd(),
			"public/tree-sitter/wasm/tree-sitter-typescript.wasm",
		);
		const wasmBuffer = fs.readFileSync(wasmPath);
		tsLanguage = await Language.load(wasmBuffer);
		parser.setLanguage(tsLanguage);
	}
	return parser;
}

export async function parseTypescript(
	content: string,
	filePath: string,
): Promise<ParsedFile> {
	try {
		const p = await getTsParser();
		const tree = p.parse(content);

		if (!tree?.rootNode) {
			return {
				path: filePath,
				language: "typescript",
				imports: [],
				parseError: "Failed to parse: no root node",
			};
		}

		const imports: ImportStatement[] = [];

		const walkImportStatements = (node: any) => {
			const nodeType = node.type;

			if (
				nodeType === "import_statement" ||
				nodeType === "import_clause" ||
				nodeType === "call_expression"
			) {
				const sourceNode = findChildByPattern(
					node,
					"string_fragment",
					"string",
				);

				if (sourceNode) {
					const source = sourceNode.text;
					const isDynamic =
						nodeType === "call_expression" ||
						findChildByPattern(node, "import")?.text === "import";

					// Check if this is a require() call
					const isRequire =
						nodeType === "call_expression" &&
						findChildByPattern(node, "identifier")?.text === "require";

					const raw = content.slice(node.startIndex, node.endIndex);

					imports.push({
						raw: raw.trim(),
						source,
						isDynamic: isDynamic && !isRequire,
					});
				}
			}

			if (node.children) {
				for (const child of node.children) {
					walkImportStatements(child);
				}
			}
		};

		walkImportStatements(tree.rootNode);
		tree.delete();

		console.log(
			`[TypeScriptParser] ${filePath}: parsed ${imports.length} imports`,
		);
		for (const imp of imports.slice(0, 5)) {
			console.log(`  - "${imp.source}" (dynamic: ${imp.isDynamic})`);
		}

		return {
			path: filePath,
			language: "typescript",
			imports,
		};
	} catch (error) {
		return {
			path: filePath,
			language: "typescript",
			imports: [],
			parseError:
				error instanceof Error ? error.message : "Unknown parse error",
		};
	}
}

function findChildByPattern(
	node: any,
	...patterns: string[]
): { text: string } | null {
	if (!node.children) return null;

	for (const child of node.children) {
		if (patterns.includes(child.type)) {
			return { text: child.text };
		}
	}
	return null;
}
