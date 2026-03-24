import fs from "node:fs";
import path from "node:path";
import { Language, Parser } from "web-tree-sitter";
import type { ImportStatement, ParsedFile } from "./index";

let pyLanguage: Language | null = null;
let parser: Parser | null = null;

async function getPyParser(): Promise<Parser> {
	if (!parser) {
		await Parser.init();
		parser = new Parser();
		const wasmPath = path.join(
			process.cwd(),
			"public/tree-sitter/wasm/tree-sitter-python.wasm",
		);
		const wasmBuffer = fs.readFileSync(wasmPath);
		pyLanguage = await Language.load(wasmBuffer);
		parser.setLanguage(pyLanguage);
	}
	return parser;
}

export async function parsePython(
	content: string,
	filePath: string,
): Promise<ParsedFile> {
	try {
		const p = await getPyParser();
		const tree = p.parse(content);

		if (!tree?.rootNode) {
			return {
				path: filePath,
				language: "python",
				imports: [],
				parseError: "Failed to parse: no root node",
			};
		}

		const imports: ImportStatement[] = [];

		const walkImportStatements = (node: any) => {
			const nodeType = node.type;

			if (
				nodeType === "import_statement" ||
				nodeType === "import_from_statement"
			) {
				const sourceNode = findChildByPattern(
					node,
					"dotted_name",
					"identifier",
				);

				if (sourceNode) {
					const source = sourceNode.text;

					if (!sourceNode.text.startsWith(".")) {
						const raw = content.slice(node.startIndex, node.endIndex);

						imports.push({
							raw: raw.trim(),
							source,
							isDynamic: false,
						});
					}
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

		return {
			path: filePath,
			language: "python",
			imports,
		};
	} catch (error) {
		return {
			path: filePath,
			language: "python",
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
