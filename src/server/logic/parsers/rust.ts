import fs from "node:fs";
import path from "node:path";
import { Language, Parser } from "web-tree-sitter";
import type { ImportStatement, ParsedFile } from "./index";

let rustLanguage: Language | null = null;
let parser: Parser | null = null;

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
	"async-trait",
	"futures",
	"pin_project",
	"once_cell",
	"parking_lot",
	"regex",
	"lazy_static",
	"bytes",
	"uuid",
	"semver",
	"dirs",
]);

interface RustResolverOptions {
	files?: string[];
	crateMapping?: Record<string, string>;
}

let filesCache: { files: string[]; set: Set<string> } | null = null;

function getFilesSet(files: string[]): Set<string> {
	if (filesCache && filesCache.files === files) {
		return filesCache.set;
	}
	const set = new Set(files);
	filesCache = { files, set };
	return set;
}

function findMatchingFile(
	modulePath: string,
	currentCrate: string,
	options: RustResolverOptions,
): string | null {
	const { files, crateMapping } = options;

	if (!files || files.length === 0) {
		return null;
	}

	const filesSet = getFilesSet(files);
	const cratesToTry = [currentCrate];

	// Extract base crate name and apply mapping
	const baseCrate = modulePath.split("::")[0] || "";
	if (
		baseCrate &&
		baseCrate !== "crate" &&
		baseCrate !== "super" &&
		baseCrate !== "self"
	) {
		const mapped = crateMapping?.[baseCrate] || baseCrate;
		cratesToTry.push(mapped, ...Object.values(crateMapping || {}));
	}

	const pathPart = modulePath
		.replace(/^(crate|super|self)::/, "")
		.replace(/::/g, "/");

	for (const crate of [...new Set(cratesToTry)]) {
		const candidates = [
			`${crate}/src/${pathPart}.rs`,
			`${crate}/src/${pathPart}/mod.rs`,
			`${crate}/src/${pathPart}/index.rs`,
			`crates/${crate}/src/${pathPart}.rs`,
			`crates/${crate}/src/${pathPart}/mod.rs`,
			`crates/${crate}/src/${pathPart}/index.rs`,
		];

		for (const candidate of candidates) {
			if (filesSet.has(candidate)) {
				return candidate;
			}
		}
	}

	return null;
}

function getCurrentCrate(filePath: string): string {
	const match = filePath.match(/^(?:crates\/)?([^/]+)\/src\//);
	return match?.[1] || "crate";
}

async function getRustParser(): Promise<Parser> {
	if (!parser) {
		await Parser.init();
		parser = new Parser();
		const wasmPath = path.join(
			process.cwd(),
			"node_modules/@vscode/tree-sitter-wasm/wasm/tree-sitter-rust.wasm",
		);
		const wasmBuffer = fs.readFileSync(wasmPath);
		rustLanguage = await Language.load(wasmBuffer);
		parser.setLanguage(rustLanguage);
	}
	return parser;
}

function isExternalCrate(name: string): boolean {
	return RUST_EXTERNAL_CRATES.has(name);
}

export function resolveRustImport(
	source: string,
	currentFilePath: string,
	options?: RustResolverOptions,
): { resolved: string; isExternal: boolean } {
	if (!source || source.trim() === "") {
		return { resolved: "", isExternal: true };
	}

	const baseImport = source.split("::")[0] || source;

	if (isExternalCrate(baseImport)) {
		return { resolved: "", isExternal: true };
	}

	if (!options?.files) {
		const firstChar = baseImport[0];
		if (firstChar && firstChar >= "a" && firstChar <= "z") {
			return { resolved: "", isExternal: false };
		}
		return { resolved: "", isExternal: true };
	}

	const currentCrate = getCurrentCrate(currentFilePath);
	const resolved = findMatchingFile(source, currentCrate, options);

	if (resolved) {
		return { resolved, isExternal: false };
	}

	const firstChar = baseImport[0];
	if (firstChar && firstChar >= "a" && firstChar <= "z") {
		return { resolved: "", isExternal: false };
	}

	return { resolved: "", isExternal: true };
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
