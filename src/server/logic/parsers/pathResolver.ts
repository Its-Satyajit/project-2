import path from "node:path";

export interface ResolvedImport {
	original: string;
	resolved: string | null;
	isExternal: boolean;
}

export interface PathResolverOptions {
	aliasPrefix: string;
	aliasBase: string;
	baseDir: string;
}

const DEFAULT_OPTIONS: PathResolverOptions = {
	aliasPrefix: "~/",
	aliasBase: "src",
	baseDir: "",
};

const EXTENSIONS = [
	".ts",
	".tsx",
	".js",
	".jsx",
	"/index.ts",
	"/index.tsx",
	"/index.js",
];

const EXTERNAL_PATTERNS = [
	/^[^./@~]/, // doesn't start with ./, ../, @/, or ~/
	/^@?[a-z-]+\//, // @scope/package or package/subpath
];

function isExternal(source: string): boolean {
	// Clean the source first - remove quotes
	const cleaned = cleanSource(source);
	return EXTERNAL_PATTERNS.some((pattern) => pattern.test(cleaned));
}

function normalizePath(p: string): string {
	// Resolve . and .. manually since path.posix.normalize doesn't fully resolve them
	const parts = p.split("/");
	const resolved: string[] = [];

	for (const part of parts) {
		if (part === "..") {
			resolved.pop();
		} else if (part !== "." && part !== "") {
			resolved.push(part);
		}
	}

	return resolved.join("/");
}

function cleanSource(source: string): string {
	// Remove surrounding quotes (single or double) if present
	let cleaned = source.trim();
	if (
		(cleaned.startsWith('"') && cleaned.endsWith('"')) ||
		(cleaned.startsWith("'") && cleaned.endsWith("'"))
	) {
		cleaned = cleaned.slice(1, -1);
	}
	return cleaned;
}

function hasKnownExtension(source: string): boolean {
	const ext = source.split(".").pop()?.toLowerCase();
	return ["ts", "tsx", "js", "jsx", "mjs", "cjs"].includes(ext || "");
}

function tryExtensions(
	basePath: string,
	sourceHasExtension: boolean,
): string | null {
	// If source already has a known extension, don't add more extensions
	if (sourceHasExtension) {
		return basePath;
	}
	// Try adding extensions in order of preference
	for (const ext of EXTENSIONS) {
		const fullPath = basePath + ext;
		if (fullPath) {
			return fullPath;
		}
	}
	return null;
}

export function resolveImport(
	source: string,
	filePath: string,
	options: Partial<PathResolverOptions> = {},
): ResolvedImport {
	const opts = { ...DEFAULT_OPTIONS, ...options };

	// Clean the source - remove quotes and whitespace
	const cleanedSource = cleanSource(source);

	if (isExternal(cleanedSource)) {
		return {
			original: source,
			resolved: null,
			isExternal: true,
		};
	}

	let resolved: string | null = null;
	const sourceHasExt = hasKnownExtension(cleanedSource);

	// Handle alias imports (e.g., @/components/Button or ~/components/Button)
	if (cleanedSource.startsWith("~/") || cleanedSource.startsWith("@/")) {
		const prefix = cleanedSource.startsWith("~/") ? "~/" : "@/";
		const withoutAlias = cleanedSource.slice(prefix.length);
		const basePath = opts.baseDir
			? `${opts.baseDir}/${opts.aliasBase}/${withoutAlias}`
			: `${opts.aliasBase}/${withoutAlias}`;
		const normalizedBasePath = normalizePath(basePath);
		resolved = tryExtensions(normalizedBasePath, sourceHasExt);
		console.log(`[PathResolver] Resolved alias ${source} -> ${resolved}`);
	}
	// Handle relative imports
	else if (source.startsWith("./") || source.startsWith("../")) {
		const fileDir = filePath.includes("/")
			? filePath.slice(0, filePath.lastIndexOf("/"))
			: "";
		const basePath = `${fileDir}/${source}`;
		const normalizedBasePath = normalizePath(basePath);
		resolved = tryExtensions(normalizedBasePath, sourceHasExt);
	}
	// Bare imports without ./ or @/ - treat as external
	else {
		return {
			original: source,
			resolved: null,
			isExternal: true,
		};
	}

	return {
		original: source,
		resolved,
		isExternal: false,
	};
}

export function resolveAllImports(
	imports: { source: string }[],
	filePath: string,
	options?: Partial<PathResolverOptions>,
): ResolvedImport[] {
	return imports.map((imp) => resolveImport(imp.source, filePath, options));
}
