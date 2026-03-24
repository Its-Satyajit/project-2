import fs from "node:fs";
import path from "node:path";
import { Language, Parser } from "web-tree-sitter";
import type { ImportStatement, ParsedFile } from "./index";

let rustLanguage: Language | null = null;
let parser: Parser | null = null;

// Common Rust standard library and external crates to mark as external
const RUST_EXTERNAL_CRATES = new Set([
	"std",
	"core",
	"alloc",
	"anyhow",
	"clap",
	"tracing",
	"serde",
	"tokio",
	"reqwest",
	"thiserror",
	"rustls",
	"rcgen",
	"chrono",
	"serde_json",
	"toml",
	"log",
	"env_logger",
]);

// Known crate name to directory mappings (populated from Cargo.toml)
let crateMappings: Map<string, string> | null = null;

async function getRustParser(): Promise<Parser> {
	if (!parser) {
		await Parser.init();
		parser = new Parser();
		const wasmPath = path.join(
			process.cwd(),
			"public/tree-sitter/wasm/tree-sitter-rust.wasm",
		);
		const wasmBuffer = fs.readFileSync(wasmPath);
		rustLanguage = await Language.load(wasmBuffer);
		parser.setLanguage(rustLanguage);
	}
	return parser;
}

/**
 * Load crate mappings from Cargo.toml files in the project
 */
function loadCrateMappings(): Map<string, string> {
	if (crateMappings) return crateMappings;

	crateMappings = new Map();

	try {
		const projectRoot = process.cwd();
		const entries = fs.readdirSync(projectRoot, { withFileTypes: true });

		for (const entry of entries) {
			if (entry.isDirectory()) {
				const cargoTomlPath = path.join(projectRoot, entry.name, "Cargo.toml");
				if (fs.existsSync(cargoTomlPath)) {
					const content = fs.readFileSync(cargoTomlPath, "utf-8");
					const nameMatch = content.match(/^name\s*=\s*"([^"]+)"/m);
					if (nameMatch && nameMatch[1]) {
						crateMappings.set(nameMatch[1], entry.name);
					}
				}
			}
		}
	} catch (error) {
		console.error("[RustParser] Error loading crate mappings:", error);
	}

	return crateMappings;
}

/**
 * Convert a Rust use statement to a file path
 * e.g., "devbind_core::config::DevBindConfig" -> "./core/src/config.rs"
 */
function rustImportToFilePath(
	importSource: string,
	currentFilePath: string,
): { filePath: string; isExternal: boolean } | null {
	const baseImport = importSource.split("::")[0] || importSource;

	if (!baseImport || RUST_EXTERNAL_CRATES.has(baseImport)) {
		return { filePath: "", isExternal: true };
	}

	const mappings = loadCrateMappings();
	const crateDir = mappings.get(baseImport);

	if (crateDir) {
		const moduleParts = importSource.split("::").slice(1);
		if (moduleParts.length > 0) {
			const modulePath = moduleParts.join("/");
			return {
				filePath: `./${crateDir}/src/${modulePath}.rs`,
				isExternal: false,
			};
		}
		return {
			filePath: `./${crateDir}/src/lib.rs`,
			isExternal: false,
		};
	}

	if (importSource.startsWith("crate::")) {
		const crateRoot = currentFilePath.split("/src/")[0];
		if (crateRoot) {
			const modulePath = importSource
				.replace("crate::", "")
				.replace(/::/g, "/");
			return {
				filePath: `./${crateRoot.split("/").pop()}/src/${modulePath}.rs`,
				isExternal: false,
			};
		}
	}

	if (importSource.startsWith("super::")) {
		const currentDir = path.dirname(currentFilePath);
		const parentDir = path.dirname(currentDir);
		const modulePath = importSource.replace("super::", "").replace(/::/g, "/");
		return {
			filePath: `./${parentDir}/${modulePath}.rs`,
			isExternal: false,
		};
	}

	if (importSource.startsWith("self::")) {
		const currentDir = path.dirname(currentFilePath);
		const modulePath = importSource.replace("self::", "").replace(/::/g, "/");
		return {
			filePath: `./${currentDir}/${modulePath}.rs`,
			isExternal: false,
		};
	}

	return null;
}

export async function parseRust(
	content: string,
	filePath: string,
): Promise<ParsedFile> {
	try {
		const p = await getRustParser();
		const tree = p.parse(content);

		if (!tree?.rootNode) {
			return {
				path: filePath,
				language: "rust",
				imports: [],
				parseError: "Failed to parse: no root node",
			};
		}

		const imports: ImportStatement[] = [];

		const walkUseDeclarations = (node: any) => {
			const nodeType = node.type;

			if (nodeType === "use_declaration" || nodeType === "use_list") {
				const text = node.text.trim();
				if (text.startsWith("use ")) {
					const match = text.match(/^use\s+([^;]+)/);
					if (match) {
						const source = match[1].trim();
						// Return the source as-is, let dependency analysis resolve it
						imports.push({
							raw: text,
							source,
							isDynamic: false,
						});
					}
				}
			}

			if (nodeType === "extern_crate_declaration") {
				const text = node.text.trim();
				const match = text.match(/extern\s+crate\s+(\w+)/);
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
					walkUseDeclarations(child);
				}
			}
		};

		walkUseDeclarations(tree.rootNode);
		tree.delete();

		return {
			path: filePath,
			language: "rust",
			imports,
		};
	} catch (error) {
		return {
			path: filePath,
			language: "rust",
			imports: [],
			parseError:
				error instanceof Error ? error.message : "Unknown parse error",
		};
	}
}
