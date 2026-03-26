import fs from "node:fs";
import path from "node:path";
import { Language, Parser } from "web-tree-sitter";
import {
	ensureParserInit,
	type ImportStatement,
	type ParsedFile,
} from "./index";

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
		await ensureParserInit();
		parser = new Parser();
		const wasmPath = path.join(
			process.cwd(),
			"node_modules/@vscode/tree-sitter-wasm/wasm/tree-sitter-rust.wasm",
		);
		const wasmBuffer = fs.readFileSync(wasmPath);
		// Explicitly cast to Uint8Array for compatibility
		rustLanguage = await Language.load(new Uint8Array(wasmBuffer));
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
): { resolved: string | null; isExternal: boolean } {
	if (!source || source.trim() === "") {
		return { resolved: null, isExternal: true };
	}

	const baseImport = source.split("::")[0] || source;

	// Check if it's a known local crate first
	const isLocalCrate = options?.crateMapping?.[baseImport] !== undefined;

	if (isExternalCrate(baseImport) && !isLocalCrate) {
		return { resolved: null, isExternal: true };
	}

	if (!options?.files) {
		return { resolved: null, isExternal: true };
	}

	const currentCrate = getCurrentCrate(currentFilePath);
	const resolved = findMatchingFile(source, currentCrate, options);

	if (resolved) {
		return { resolved, isExternal: false };
	}

	return { resolved: null, isExternal: true };
}

export async function parseRust(
	content: string | null | undefined,
	filePath: string,
): Promise<ParsedFile> {
	if (!content) {
		return {
			path: filePath,
			language: "rust",
			imports: [],
		};
	}
	const imports: ImportStatement[] = [];

	const splitRespectingBraces = (text: string, separator: string): string[] => {
		const parts: string[] = [];
		let current = "";
		let braceLevel = 0;

		for (let i = 0; i < text.length; i++) {
			const char = text[i];
			if (char === "{") braceLevel++;
			if (char === "}") braceLevel--;

			if (char === separator && braceLevel === 0) {
				parts.push(current.trim());
				current = "";
			} else {
				current += char;
			}
		}
		if (current?.trim()) {
			parts.push(current.trim());
		}
		return parts;
	};

	const expandUseClause = (base: string, part: string): string[] => {
		part = part.trim();
		if (!part) return [];

		if (part.startsWith("{") && part.endsWith("}")) {
			const inner = part.slice(1, -1);
			const segments = splitRespectingBraces(inner, ",");
			return segments.flatMap((s) => expandUseClause(base, s));
		}

		const nestedMatch = part.match(/^([^{]+)\s*::\s*(\{.*\})$/);
		if (nestedMatch && nestedMatch[1] && nestedMatch[2]) {
			const subPath = nestedMatch[1].trim();
			const nextBase = base ? `${base}::${subPath}` : subPath;
			return expandUseClause(nextBase, nestedMatch[2]);
		}

		if (part.endsWith("::*")) {
			const source = part.slice(0, -3);
			return [base ? `${base}::${source}::*` : `${source}::*`];
		}

		const pathOnly = part.split(/\s+as\s+/)[0] || part;
		const trimmedPath = pathOnly.trim();

		if (!trimmedPath) return [];

		return [base ? `${base}::${trimmedPath}` : trimmedPath];
	};

	const runRegexFallback = () => {
		const lines = content.split("\n");
		for (const line of lines) {
			const trimmed = line.trim();
			if (trimmed.startsWith("use ")) {
				const useContent = trimmed.replace(/^use\s+/, "").replace(/;$/, "");
				const sources = expandUseClause("", useContent);
				for (const source of sources) {
					if (source && !imports.some((i) => i.source === source)) {
						imports.push({ raw: trimmed, source, isDynamic: false });
					}
				}
			}
		}
	};

	try {
		const p = await getRustParser();
		const tree = p.parse(content);

		if (tree && tree.rootNode) {
			const walkTree = (node: { type: string; text: string; childCount: number; child: (i: number) => any }) => {
				const type = node.type;
				if (type === "use_declaration") {
					const text = node.text.trim();
					if (text.startsWith("use ")) {
						const uc = text.replace(/^use\s+/, "").replace(/;$/, "");
						const sources = expandUseClause("", uc);
						for (const source of sources) {
							if (source && !imports.some((i) => i.source === source)) {
								imports.push({ raw: text, source, isDynamic: false });
							}
						}
					}
				} else if (type === "extern_crate_declaration") {
					const text = node.text.trim();
					const match = text.match(/extern\s+crate\s+(\w+)/);
					if (match) {
						const source = match[1] || "";
						if (source && !imports.some((i) => i.source === source)) {
							imports.push({ raw: text, source, isDynamic: false });
						}
					}
				} else if (type === "mod_declaration") {
					const text = node.text.trim();
					const match = text.match(/^mod\s+(\w+)\s*;/);
					if (match) {
						const source = match[1] || "";
						if (source && !imports.some((i) => i.source === source)) {
							imports.push({ raw: text, source, isDynamic: false });
						}
					}
				}

				for (let i = 0; i < node.childCount; i++) {
					const child = node.child(i);
					if (type !== "use_declaration") {
						walkTree(child);
					}
				}
			};

			walkTree(tree.rootNode);
			tree.delete();
		}
	} catch (error) {
		fs.appendFileSync(
			"rust_parser_debug.log",
			`[RustParser] Error during Tree-sitter parsing: ${error instanceof Error ? error.message : String(error)}. Falling back to regex.\n`,
		);
	}

	if (imports.length === 0) {
		runRegexFallback();
	}

	return {
		path: filePath,
		language: "rust",
		imports,
	};
}
