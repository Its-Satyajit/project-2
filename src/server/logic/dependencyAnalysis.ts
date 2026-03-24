import { parseGo } from "./parsers/go";
import type { ParsedFile } from "./parsers/index";
import { resolveImport } from "./parsers/pathResolver";
import { parsePython } from "./parsers/python";
import { createRegexParser } from "./parsers/regexParser";
import { parseRust } from "./parsers/rust";
import { parseTypescript } from "./parsers/typescript";

export interface GraphNode {
	id: string;
	path: string;
	language: string;
	imports: number;
	loc?: number;
}

export interface GraphEdge {
	source: string;
	target: string;
}

export interface GraphMetadata {
	totalNodes: number;
	totalEdges: number;
	languageBreakdown: Record<string, number>;
	unresolvedImports: number;
}

export interface DependencyGraph {
	nodes: GraphNode[];
	edges: GraphEdge[];
	metadata: GraphMetadata;
}

const MAX_FILE_SIZE = 1024 * 1024;
const MAX_FILES = 1000;

export interface FileContent {
	path: string;
	content: string;
	language: string;
	loc?: number;
}

export interface DependencyAnalysisResult {
	graph: DependencyGraph;
	processedFiles: number;
	skippedFiles: number;
	errorFiles: string[];
}

const LANGUAGE_PARSERS: Record<
	string,
	(content: string, path: string) => Promise<ParsedFile>
> = {
	typescript: parseTypescript,
	tsx: parseTypescript,
	javascript: parseTypescript,
	jsx: parseTypescript,
	python: parsePython,
	go: parseGo,
	rust: parseRust,
	java: createRegexParser("java", [
		/import\s+static\s+([\w.]+)/,
		/import\s+([\w.]+)/,
	]),
	cpp: createRegexParser("cpp", [/#include\s*[<"]([^>"]+)[>"]/]),
	c: createRegexParser("c", [/#include\s*[<"]([^>"]+)[>"]/]),
	csharp: createRegexParser("csharp", [/using\s+([\w.]+);/]),
	kotlin: createRegexParser("kotlin", [/import\s+([\w.]+)/]),
	swift: createRegexParser("swift", [/import\s+(\w+)/, /@import\s+([\w.]+);/]),
	php: createRegexParser("php", [
		/(?:require|require_once|include|include_once)\s*['"]([^'"]+)['"]/,
		/use\s+([\w\\]+);/,
	]),
	dart: createRegexParser("dart", [
		/import\s+['"]([^'"]+)['"]/,
		/part\s+of\s+['"]([^'"]+)['"]/,
		/part\s+['"]([^'"]+)['"]/,
	]),
	r: createRegexParser("r", [
		/library\s*\(\s*(\w+)\s*\)/,
		/(?:source|suppressPackageStartupMessages)\s*\(\s*['"]([^'"]+)['"]\s*\)/,
	]),
	ruby: createRegexParser("ruby", [
		/require\s+['"]([^'"]+)['"]/,
		/require_relative\s+['"]([^'"]+)['"]/,
	]),
	matlab: createRegexParser("matlab", [
		/(?:import|addpath|genpath)\s+([\w.]+)/,
	]),
	scala: createRegexParser("scala", [/import\s+([\w.]+)/]),
	shell: createRegexParser("shell", [
		/source\s+['"]?([^'";\s]+)['"]?/,
		/\.\s+['"]?([^'";\s]+)['"]?/,
	]),
	bash: createRegexParser("bash", [
		/source\s+['"]?([^'";\s]+)['"]?/,
		/\.\s+['"]?([^'";\s]+)['"]?/,
	]),
	julia: createRegexParser("julia", [/(?:using|import)\s+([\w.]+)/]),
	objective_c: createRegexParser("objective_c", [
		/#import\s+[<"]([^>"]+)[>"]/,
		/#import\s+['"]([^'"]+)['"]/,
	]),
	assembly: createRegexParser("assembly", [/include\s+['"]?([^'";\s]+)['"]?/]),
	groovy: createRegexParser("groovy", [/import\s+([\w.]+)/]),
	haskell: createRegexParser("haskell", [/import\s+(?:qualified\s+)?([\w.]+)/]),
	elixir: createRegexParser("elixir", [
		/(?:import|require|alias|use)\s+([\w.]+)/,
	]),
	sql: createRegexParser("sql", [/(?:SOURCE|INCLUDE)\s+['"]?([^'";\s]+)['"]?/]),
};

export function detectLanguage(filePath: string): string | null {
	const ext = filePath.split(".").pop()?.toLowerCase();
	const basename = filePath.toLowerCase();

	if (ext === "ts" || ext === "tsx") return "typescript";
	if (ext === "js" || ext === "jsx") return "javascript";
	if (ext === "py") return "python";
	if (ext === "go") return "go";
	if (ext === "rs") return "rust";
	if (ext === "java") return "java";
	if (ext === "cpp" || ext === "cc" || ext === "cxx" || ext === "c++")
		return "cpp";
	if (ext === "c" && basename.endsWith(".h")) return "c";
	if (ext === "c") return "c";
	if (ext === "h") return "c";
	if (ext === "cs") return "csharp";
	if (ext === "kt" || ext === "kts") return "kotlin";
	if (ext === "swift") return "swift";
	if (ext === "php") return "php";
	if (ext === "dart") return "dart";
	if (
		ext === "r" &&
		!basename.endsWith(".rs") &&
		!basename.endsWith(".rhistory")
	)
		return "r";
	if (ext === "rb") return "ruby";
	if (ext === "m" || ext === "mm") return "matlab";
	if (ext === "scala") return "scala";
	if (ext === "sh" || ext === "bash" || ext === "zsh") return "shell";
	if (ext === "jl") return "julia";
	if (ext === "m" || ext === "mm") return "objective_c";
	if (ext === "asm" || ext === "s" || ext === "S") return "assembly";
	if (ext === "groovy" || ext === "gradle") return "groovy";
	if (ext === "hs" || ext === "lhs") return "haskell";
	if (ext === "ex" || ext === "exs") return "elixir";
	if (ext === "sql") return "sql";

	return null;
}

function countLoc(content: string): number {
	const lines = content.split("\n");
	let count = 0;
	let inBlockComment = false;

	for (const line of lines) {
		const trimmed = line.trim();

		if (trimmed.startsWith("/*")) inBlockComment = true;
		if (trimmed.includes("*/")) inBlockComment = false;

		if (
			!inBlockComment &&
			trimmed.length > 0 &&
			!trimmed.startsWith("//") &&
			!trimmed.startsWith("#")
		) {
			count++;
		}
	}

	return count;
}

export async function performDependencyAnalysis(
	files: FileContent[],
): Promise<DependencyAnalysisResult> {
	const codeFiles = files
		.filter((f) => {
			const lang = detectLanguage(f.path);
			return lang && LANGUAGE_PARSERS[lang];
		})
		.filter((f) => f.content.length <= MAX_FILE_SIZE)
		.slice(0, MAX_FILES);

	console.log(`[DependencyAnalysis] Processing ${codeFiles.length} code files`);

	const nodes: GraphNode[] = [];
	const edges: GraphEdge[] = [];
	const errorFiles: string[] = [];
	const unresolvedImports: string[] = [];

	// Normalize all file paths to POSIX format for consistent matching
	const normalizedFilePaths = codeFiles.map((f) => f.path.replace(/\\/g, "/"));
	const filePathSet = new Set(normalizedFilePaths);

	// Build Rust crate mapping from file paths
	// e.g., files in core/src/ -> crate name "core" (from Cargo.toml name "devbind_core")
	const rustCrateMapping: Record<string, string> = {};
	const crateDirs = new Set<string>();
	for (const filePath of normalizedFilePaths) {
		// Match patterns like "core/src/lib.rs" or "cli/src/main.rs"
		const match = filePath.match(/^([^/]+)\/src\/.*\.rs$/);
		if (match?.[1]) {
			crateDirs.add(match[1]);
		}
	}
	// Map crate directory names to themselves for now
	// In a real implementation, we'd parse Cargo.toml to get the actual crate names
	for (const dir of crateDirs) {
		rustCrateMapping[dir] = dir;
		// Also try common naming patterns: core -> devbind_core, etc.
		// This is a heuristic and may not work for all projects
	}
	console.log(
		`[DependencyAnalysis] Rust crate directories found:`,
		Array.from(crateDirs),
	);

	console.log(
		`[DependencyAnalysis] File path set (sample):`,
		Array.from(filePathSet).slice(0, 5),
	);

	for (const file of codeFiles) {
		const language = detectLanguage(file.path) || "typescript";

		const parser = LANGUAGE_PARSERS[language];
		if (!parser) continue;

		const parsed = await parser(file.content, file.path);

		if (parsed.parseError) {
			console.log(
				`[DependencyAnalysis] Parse error in ${file.path}: ${parsed.parseError}`,
			);
			errorFiles.push(file.path);
			continue;
		}

		if (parsed.imports.length > 0) {
			console.log(
				`[DependencyAnalysis] ${file.path}: ${parsed.imports.length} imports found`,
			);
			for (const imp of parsed.imports.slice(0, 3)) {
				console.log(`  - source: "${imp.source}"`);
			}
			if (parsed.imports.length > 3) {
				console.log(`  ... and ${parsed.imports.length - 3} more`);
			}
		}

		const fileEdges: GraphEdge[] = [];

		// Normalize source path to match format in filePathSet
		const normalizedSource = file.path.replace(/\\/g, "/");

		for (const imp of parsed.imports) {
			const resolved = resolveImport(imp.source, file.path);

			if (resolved.isExternal) {
				// External package - skip
			} else if (resolved.resolved) {
				// Normalize the target path to match the format in filePathSet
				const normalizedTarget = resolved.resolved.replace(/\\/g, "/");

				// Debug: log the resolution
				console.log(
					`[DependencyAnalysis] "${normalizedSource}" → "${imp.source}" resolved to "${normalizedTarget}" (in set: ${filePathSet.has(normalizedTarget)})`,
				);

				if (filePathSet.has(normalizedTarget)) {
					if (normalizedSource !== normalizedTarget) {
						fileEdges.push({
							source: normalizedSource,
							target: normalizedTarget,
						});
						console.log(
							`[DependencyAnalysis]   Edge created: ${normalizedSource} → ${normalizedTarget}`,
						);
					}
				} else {
					console.log(
						`[DependencyAnalysis]   Not in filePathSet: ${normalizedTarget}`,
					);
					unresolvedImports.push(`${normalizedSource} → ${imp.source}`);
				}
			} else {
				console.log(
					`[DependencyAnalysis]   No resolution: ${normalizedSource} → ${imp.source} (isExternal: ${resolved.isExternal})`,
				);
			}
		}

		nodes.push({
			id: normalizedSource,
			path: normalizedSource,
			language,
			imports: parsed.imports.length,
			loc: countLoc(file.content),
		});

		edges.push(...fileEdges);
	}

	const seenEdges = new Set<string>();
	const dedupedEdges = edges.filter((edge) => {
		const key = `${edge.source}:${edge.target}`;
		if (seenEdges.has(key)) return false;
		seenEdges.add(key);
		return true;
	});

	const languageBreakdown: Record<string, number> = {};
	for (const node of nodes) {
		languageBreakdown[node.language] =
			(languageBreakdown[node.language] || 0) + 1;
	}

	const graph: DependencyGraph = {
		nodes,
		edges: dedupedEdges,
		metadata: {
			totalNodes: nodes.length,
			totalEdges: dedupedEdges.length,
			languageBreakdown,
			unresolvedImports: unresolvedImports.length,
		},
	};

	return {
		graph,
		processedFiles: codeFiles.length,
		skippedFiles: files.length - codeFiles.length,
		errorFiles,
	};
}
