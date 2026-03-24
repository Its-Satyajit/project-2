import fs from "node:fs";
import path from "node:path";
import { Language, Parser } from "web-tree-sitter";
import type { ImportStatement, ParsedFile } from "./index";

let goLanguage: Language | null = null;
let parser: Parser | null = null;

async function getGoParser(): Promise<Parser> {
	if (!parser) {
		await Parser.init();
		parser = new Parser();
		const wasmPath = path.join(
			process.cwd(),
			"public/tree-sitter/wasm/tree-sitter-go.wasm",
		);
		const wasmBuffer = fs.readFileSync(wasmPath);
		goLanguage = await Language.load(wasmBuffer);
		parser.setLanguage(goLanguage);
	}
	return parser;
}

export async function parseGo(
	content: string,
	filePath: string,
): Promise<ParsedFile> {
	try {
		const p = await getGoParser();
		const tree = p.parse(content);

		if (!tree?.rootNode) {
			return {
				path: filePath,
				language: "go",
				imports: [],
				parseError: "Failed to parse: no root node",
			};
		}

		const imports: ImportStatement[] = [];

		const walkImportDeclarations = (node: any) => {
			const nodeType = node.type;

			if (nodeType === "import_declaration") {
				const text = node.text.trim();
				const match = text.match(/import\s+(?:"([^"]+)"|(\w+))/);
				if (match) {
					const source = match[1] || match[2];
					if (source) {
						imports.push({
							raw: text,
							source,
							isDynamic: false,
						});
					}
				}
			}

			if (nodeType === "import_spec") {
				const text = node.text.trim();
				const match = text.match(/"([^"]+)"/);
				if (match) {
					const source = match[1];
					imports.push({
						raw: text,
						source,
						isDynamic: false,
					});
				}
			}

			if (node.children) {
				for (const child of node.children) {
					walkImportDeclarations(child);
				}
			}
		};

		walkImportDeclarations(tree.rootNode);
		tree.delete();

		console.log(`[GoParser] ${filePath}: parsed ${imports.length} imports`);
		for (const imp of imports.slice(0, 5)) {
			console.log(`  - "${imp.source}"`);
		}

		return {
			path: filePath,
			language: "go",
			imports,
		};
	} catch (error) {
		return {
			path: filePath,
			language: "go",
			imports: [],
			parseError:
				error instanceof Error ? error.message : "Unknown parse error",
		};
	}
}
