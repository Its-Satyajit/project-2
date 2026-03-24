import path from "node:path";

export interface ResolvedImport {
	original: string;
	resolved: string | null;
	isExternal: boolean;
	aliasPattern?: string;
}

export interface AliasPattern {
	prefix: string;
	basePath: string;
	extensions?: string[];
}

export interface PathResolverConfig {
	// Known alias patterns (e.g., @/, ~/, #/)
	aliases?: AliasPattern[];
	// External package patterns (regex patterns that match external packages)
	externalPatterns?: RegExp[];
	// File extensions to try when resolving
	extensions?: string[];
	// Base directory for resolution
	baseDir?: string;
	// Rust crate name to directory mapping
	rustCrateMapping?: Record<string, string>;
}

// Default extensions to try
const DEFAULT_EXTENSIONS = [
	".ts",
	".tsx",
	".js",
	".jsx",
	".mjs",
	".cjs",
	"/index.ts",
	"/index.tsx",
	"/index.js",
	"/index.jsx",
];

// Default external patterns - these match common external package patterns
const DEFAULT_EXTERNAL_PATTERNS: RegExp[] = [
	// Node.js built-ins
	/^(node:)/,
	// Relative paths are NOT external
	// Absolute paths are NOT external
	// Common external package patterns:
	// - Doesn't start with . / ~ # (relative/alias indicators)
	// - Matches: lodash, react, @scope/package, @angular/core
	/^(?!\.)(?!\/)(?!~)(?!#)(?!node:)[\w@][\w.-]*(?:\/[\w.-]+)*$/,
];

// Pre-configured alias patterns for common setups
const COMMON_ALIAS_CONFIGS: Record<string, AliasPattern[]> = {
	// TypeScript/JavaScript with @ alias
	"@alias": [{ prefix: "@/", basePath: "src" }],
	// TypeScript/JavaScript with ~ alias
	tilde: [{ prefix: "~/", basePath: "src" }],
	// Next.js style
	nextjs: [
		{ prefix: "@/", basePath: "" },
		{ prefix: "~/", basePath: "" },
	],
	// Nuxt.js style
	nuxt: [
		{ prefix: "~/", basePath: "" },
		{ prefix: "~~/", basePath: "" },
		{ prefix: "@/", basePath: "" },
		{ prefix: "@@/", basePath: "" },
	],
	// Vite/Webpack style
	vite: [
		{ prefix: "@/", basePath: "src" },
		{ prefix: "#/", basePath: "src" },
	],
	// Python style (absolute imports)
	python: [
		// Python doesn't use prefixes, but packages are external
	],
	// Go style
	go: [
		// Go uses module paths from go.mod
	],
	// Rust style
	rust: [
		// Rust uses crate names from Cargo.toml
	],
	// Java style
	java: [
		// Java uses package names
	],
	// PHP Composer PSR-4
	php: [
		// PHP uses namespace prefixes
	],
};

export class PathResolver {
	private config: PathResolverConfig;
	private externalPatternCache: Set<string> = new Set();

	constructor(config: PathResolverConfig = {}) {
		this.config = {
			aliases: config.aliases ?? [],
			externalPatterns: config.externalPatterns ?? DEFAULT_EXTERNAL_PATTERNS,
			extensions: config.extensions ?? DEFAULT_EXTENSIONS,
			baseDir: config.baseDir ?? "",
			rustCrateMapping: config.rustCrateMapping ?? {},
		};
	}

	/**
	 * Add alias patterns from common configurations
	 */
	addCommonAliases(configName: string): this {
		const patterns = COMMON_ALIAS_CONFIGS[configName];
		if (patterns) {
			this.config.aliases = [...(this.config.aliases ?? []), ...patterns];
		}
		return this;
	}

	/**
	 * Add a custom alias pattern
	 */
	addAlias(prefix: string, basePath: string, extensions?: string[]): this {
		this.config.aliases = this.config.aliases ?? [];
		this.config.aliases.push({ prefix, basePath, extensions });
		return this;
	}

	/**
	 * Add external package patterns
	 */
	addExternalPattern(pattern: RegExp): this {
		this.config.externalPatterns = this.config.externalPatterns ?? [];
		this.config.externalPatterns.push(pattern);
		return this;
	}

	/**
	 * Mark a specific package name as external
	 */
	markExternal(packageName: string): this {
		this.externalPatternCache.add(packageName);
		return this;
	}

	/**
	 * Mark multiple package names as external
	 */
	markExternalPackages(packageNames: string[]): this {
		for (const name of packageNames) {
			this.externalPatternCache.add(name);
		}
		return this;
	}

	/**
	 * Check if a source is an external package
	 */
	private isExternal(source: string): boolean {
		const cleaned = this.cleanSource(source);

		// Check cached external packages
		const packageName = cleaned.split("/")[0];
		if (packageName && this.externalPatternCache.has(packageName)) {
			return true;
		}

		// Check if it matches any alias pattern (not external)
		for (const alias of this.config.aliases ?? []) {
			if (cleaned.startsWith(alias.prefix)) {
				return false;
			}
		}

		// Check external patterns
		for (const pattern of this.config.externalPatterns ?? []) {
			if (pattern.test(cleaned)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Check if a crate name is explicitly marked as external (for Rust imports)
	 * This only checks the explicitly marked packages, not pattern-based detection
	 */
	private isExplicitlyExternal(crateName: string): boolean {
		return this.externalPatternCache.has(crateName);
	}

	/**
	 * Clean source string (remove quotes, trim)
	 */
	private cleanSource(source: string): string {
		let cleaned = source.trim();
		// Remove surrounding quotes
		if (
			(cleaned.startsWith('"') && cleaned.endsWith('"')) ||
			(cleaned.startsWith("'") && cleaned.endsWith("'")) ||
			(cleaned.startsWith("`") && cleaned.endsWith("`"))
		) {
			cleaned = cleaned.slice(1, -1);
		}
		return cleaned;
	}

	/**
	 * Check if source has a known extension
	 */
	private hasKnownExtension(source: string): boolean {
		const ext = source.split(".").pop()?.toLowerCase();
		return ["ts", "tsx", "js", "jsx", "mjs", "cjs", "mts", "cts"].includes(
			ext ?? "",
		);
	}

	/**
	 * Normalize a path (resolve . and ..)
	 */
	private normalizePath(p: string): string {
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

	/**
	 * Convert crate name to directory name (e.g., devbind_core -> core)
	 */
	private crateNameToDir(crateName: string): string {
		// Check configured mapping first
		if (this.config.rustCrateMapping?.[crateName]) {
			return this.config.rustCrateMapping[crateName];
		}
		// Heuristic: convert snake_case crate name to directory name
		// e.g., devbind_core -> core, my_crate -> crate
		const parts = crateName.split("_");
		if (parts.length > 1) {
			// Return the last part as the likely directory name
			const lastPart = parts[parts.length - 1];
			return lastPart ?? crateName;
		}
		// Single word crate name - use as-is
		return crateName;
	}

	/**
	 * Find the crate root directory from a file path
	 * e.g., "cli/src/cmd/add.rs" -> "cli", "core/src/config.rs" -> "core"
	 */
	private findCrateRoot(filePath: string): string | null {
		const parts = filePath.split("/");
		// Look for pattern: <crate>/src/...
		const srcIndex = parts.indexOf("src");
		if (srcIndex > 0) {
			const crateName = parts[srcIndex - 1];
			return crateName ?? null;
		}
		return null;
	}

	/**
	 * Resolve a Rust-style import using :: syntax
	 */
	private resolveRustImport(source: string, filePath: string): ResolvedImport {
		// Handle crate:: imports (relative to crate root)
		if (source.startsWith("crate::")) {
			const modulePath = source.slice(7); // Remove "crate::"
			const crateRoot = this.findCrateRoot(filePath);
			if (crateRoot) {
				// Convert module path to file path: config::DevBindConfig -> config.rs
				const pathParts = modulePath.split("::");
				// Take only the module path, not the type/item name
				const moduleFilePath = pathParts.slice(0, -1).join("/");
				const resolved = moduleFilePath
					? `${crateRoot}/src/${moduleFilePath}.rs`
					: `${crateRoot}/src/lib.rs`;
				return {
					original: source,
					resolved: this.normalizePath(resolved),
					isExternal: false,
				};
			}
			// Fallback if we can't determine crate root
			const modulePath2 = source.slice(7);
			const pathParts2 = modulePath2.split("::");
			const moduleFilePath2 = pathParts2.slice(0, -1).join("/");
			const resolved2 = moduleFilePath2
				? `src/${moduleFilePath2}.rs`
				: "src/lib.rs";
			return {
				original: source,
				resolved: resolved2,
				isExternal: false,
			};
		}

		// Handle super:: imports (parent module)
		if (source.startsWith("super::")) {
			const modulePath = source.slice(7); // Remove "super::"
			const fileDir = filePath.includes("/")
				? filePath.slice(0, filePath.lastIndexOf("/"))
				: "";
			// Go up one directory level
			const parentDir = fileDir.includes("/")
				? fileDir.slice(0, fileDir.lastIndexOf("/"))
				: "";
			const pathParts = modulePath.split("::");
			// For super::module::item, we want "module" (pathParts[0])
			// For super::module, we want "module" (pathParts[0])
			const moduleFilePath =
				pathParts.length > 1
					? pathParts.slice(0, -1).join("/") // Exclude item name
					: (pathParts[0] ?? ""); // Just the module name
			const resolved = moduleFilePath
				? `${parentDir}/${moduleFilePath}.rs`
				: `${parentDir}.rs`;
			return {
				original: source,
				resolved: this.normalizePath(resolved),
				isExternal: false,
			};
		}

		// Handle self:: imports (same module)
		if (source.startsWith("self::")) {
			const modulePath = source.slice(6); // Remove "self::"
			const fileDir = filePath.includes("/")
				? filePath.slice(0, filePath.lastIndexOf("/"))
				: "";
			const pathParts = modulePath.split("::");
			const moduleFilePath = pathParts.slice(0, -1).join("/");
			const resolved = moduleFilePath
				? `${fileDir}/${moduleFilePath}.rs`
				: filePath;
			return {
				original: source,
				resolved: this.normalizePath(resolved),
				isExternal: false,
			};
		}

		// Handle external crate imports (e.g., anyhow::Error, serde::Serialize)
		// Use isExplicitlyExternal to only check explicitly marked packages,
		// not pattern-based detection which would incorrectly match local crate names
		const crateNameParts = source.split("::");
		const crateName = crateNameParts[0] ?? "";
		if (this.isExplicitlyExternal(crateName)) {
			return {
				original: source,
				resolved: null,
				isExternal: true,
			};
		}

		// Handle local crate imports (e.g., devbind_core::config::DevBindConfig)
		// This is a crate import that should be resolved to a local file
		const parts = source.split("::");
		const crateName2 = parts[0] ?? "";
		// For imports like "crate::module::item", we want just "module" (parts[1])
		// For imports like "crate::module", we want "module" (parts[1])
		// So we take parts[1] if it exists (excluding the crate name and item name)
		const modulePath =
			parts.length > 2
				? parts.slice(1, -1).join("/") // Exclude crate name and item name
				: (parts[1] ?? ""); // Just the module name (no item)

		// Try to find which crate directory this belongs to
		const crateDir = this.crateNameToDir(crateName2);
		const resolved = modulePath
			? `${crateDir}/src/${modulePath}.rs`
			: `${crateDir}/src/lib.rs`;

		return {
			original: source,
			resolved: this.normalizePath(resolved),
			isExternal: false,
		};
	}

	/**
	 * Try to resolve a path with different extensions
	 */
	private tryExtensions(
		basePath: string,
		sourceHasExtension: boolean,
		customExtensions?: string[],
	): string | null {
		if (sourceHasExtension) {
			return basePath;
		}

		const extensions = customExtensions ?? this.config.extensions ?? [];

		for (const ext of extensions) {
			const fullPath = basePath + ext;
			if (fullPath) {
				return fullPath;
			}
		}

		return basePath;
	}

	/**
	 * Resolve an import source to a file path
	 */
	resolve(source: string, filePath: string): ResolvedImport {
		const cleanedSource = this.cleanSource(source);

		// Check if external
		if (this.isExternal(cleanedSource)) {
			return {
				original: source,
				resolved: null,
				isExternal: true,
			};
		}

		// Check alias patterns
		for (const alias of this.config.aliases ?? []) {
			if (cleanedSource.startsWith(alias.prefix)) {
				const withoutAlias = cleanedSource.slice(alias.prefix.length);
				const baseDir = this.config.baseDir ?? "";
				const basePath = alias.basePath
					? baseDir
						? `${baseDir}/${alias.basePath}/${withoutAlias}`
						: `${alias.basePath}/${withoutAlias}`
					: baseDir
						? `${baseDir}/${withoutAlias}`
						: withoutAlias;

				const normalizedBasePath = this.normalizePath(basePath);
				const resolved = this.tryExtensions(
					normalizedBasePath,
					this.hasKnownExtension(cleanedSource),
					alias.extensions,
				);

				return {
					original: source,
					resolved,
					isExternal: false,
					aliasPattern: alias.prefix,
				};
			}
		}

		// Handle relative imports
		if (cleanedSource.startsWith("./") || cleanedSource.startsWith("../")) {
			const fileDir = filePath.includes("/")
				? filePath.slice(0, filePath.lastIndexOf("/"))
				: "";
			const basePath = `${fileDir}/${cleanedSource}`;
			const normalizedBasePath = this.normalizePath(basePath);
			const resolved = this.tryExtensions(
				normalizedBasePath,
				this.hasKnownExtension(cleanedSource),
			);

			return {
				original: source,
				resolved,
				isExternal: false,
			};
		}

		// Handle Rust-style imports with :: syntax (crate::, super::, self::, or external/local crate)
		if (cleanedSource.includes("::")) {
			return this.resolveRustImport(cleanedSource, filePath);
		}

		// Bare imports (no ./ or alias prefix) - treat as external
		return {
			original: source,
			resolved: null,
			isExternal: true,
		};
	}

	/**
	 * Resolve multiple imports
	 */
	resolveAll(
		imports: { source: string }[],
		filePath: string,
	): ResolvedImport[] {
		return imports.map((imp) => this.resolve(imp.source, filePath));
	}
}

// Default resolver instance for backward compatibility
const defaultResolver = new PathResolver()
	.addCommonAliases("@alias")
	.addCommonAliases("tilde");

/**
 * Legacy function for backward compatibility
 */
export function resolveImport(
	source: string,
	filePath: string,
	options: Partial<PathResolverConfig> = {},
): ResolvedImport {
	if (Object.keys(options).length > 0) {
		const customResolver = new PathResolver(options);
		return customResolver.resolve(source, filePath);
	}
	return defaultResolver.resolve(source, filePath);
}

/**
 * Legacy function for backward compatibility
 */
export function resolveAllImports(
	imports: { source: string }[],
	filePath: string,
	options?: Partial<PathResolverConfig>,
): ResolvedImport[] {
	if (options && Object.keys(options).length > 0) {
		const customResolver = new PathResolver(options);
		return customResolver.resolveAll(imports, filePath);
	}
	return defaultResolver.resolveAll(imports, filePath);
}

// Export preset configurations for common use cases
export const presets = {
	/**
	 * Create a resolver for TypeScript/JavaScript projects
	 * @param config - Optional configuration
	 * @param config.tsconfigAliases - tsconfig.json paths mapping (e.g., { "@/*": ["src/*"] })
	 * @param config.basePath - Base path for aliases (default: "src" for @/ and ~/, "" for others)
	 */
	typescript(config?: {
		tsconfigAliases?: Record<string, string[]>;
		basePath?: string;
	}): PathResolver {
		const resolver = new PathResolver();
		const basePath = config?.basePath ?? "src";
		const tsconfigAliases = config?.tsconfigAliases ?? {};

		// Add tsconfig aliases first (they take precedence)
		for (const [key, values] of Object.entries(tsconfigAliases)) {
			// tsconfig paths like "@/*": ["src/*"]
			const prefix = key.replace("/*", "/");
			const aliasBasePath =
				values[0]?.replace("/*", "").replace("*", "") ?? basePath;
			resolver.addAlias(prefix, aliasBasePath);
		}

		// Add default @/ and ~/ aliases if not already in tsconfigAliases
		if (!tsconfigAliases["@/*"]) {
			resolver.addAlias("@/", basePath);
		}
		if (!tsconfigAliases["~/*"]) {
			resolver.addAlias("~/", basePath);
		}

		return resolver;
	},

	/**
	 * Create a resolver for Next.js projects
	 * @param basePath - Base path for @/ alias (default: "")
	 */
	nextjs(basePath: string = ""): PathResolver {
		const resolver = new PathResolver();
		resolver.addAlias("@/", basePath);
		resolver.addAlias("~/", basePath);
		return resolver;
	},

	/**
	 * Create a resolver for Nuxt.js projects
	 * @param basePath - Base path for aliases (default: "")
	 */
	nuxt(basePath: string = ""): PathResolver {
		const resolver = new PathResolver();
		resolver.addAlias("~/", basePath);
		resolver.addAlias("~~/", basePath);
		resolver.addAlias("@/", basePath);
		resolver.addAlias("@@/", basePath);
		return resolver;
	},

	/**
	 * Create a resolver for Vite/Webpack projects
	 * @param basePath - Base path for aliases (default: "src")
	 */
	vite(basePath: string = "src"): PathResolver {
		const resolver = new PathResolver();
		resolver.addAlias("@/", basePath);
		resolver.addAlias("#/", basePath);
		return resolver;
	},

	/**
	 * Create a resolver for Python projects
	 * @param packages - Additional external packages
	 */
	python(packages: string[] = []): PathResolver {
		const resolver = new PathResolver();
		// Python external packages
		resolver.markExternalPackages([
			"os",
			"sys",
			"json",
			"re",
			"math",
			"datetime",
			"collections",
			"itertools",
			"functools",
			"pathlib",
			"typing",
			"dataclasses",
			"abc",
			"contextlib",
			"copy",
			"hashlib",
			"hmac",
			"io",
			"logging",
			"operator",
			"pickle",
			"pprint",
			"queue",
			"random",
			"shutil",
			"signal",
			"socket",
			"sqlite3",
			"string",
			"struct",
			"subprocess",
			"tempfile",
			"textwrap",
			"threading",
			"time",
			"traceback",
			"unittest",
			"urllib",
			"uuid",
			"warnings",
			"weakref",
			...packages,
		]);
		return resolver;
	},

	/**
	 * Create a resolver for Go projects
	 * @param modulePath - Go module path (e.g., "github.com/user/project")
	 */
	go(modulePath: string): PathResolver {
		const resolver = new PathResolver();
		// Go standard library packages
		resolver.markExternalPackages([
			"fmt",
			"os",
			"io",
			"strings",
			"strconv",
			"math",
			"time",
			"context",
			"encoding/json",
			"net/http",
			"path/filepath",
			"sort",
			"sync",
			"errors",
			"bytes",
			"bufio",
			"crypto",
			"database/sql",
			"encoding",
			"flag",
			"html",
			"log",
			"net",
			"reflect",
			"regexp",
			"runtime",
			"testing",
			"unicode",
		]);
		return resolver;
	},

	/**
	 * Create a resolver for Rust projects
	 * @param crates - Additional external crates
	 */
	rust(crates: string[] = []): PathResolver {
		const resolver = new PathResolver();
		// Rust standard library
		resolver.markExternalPackages(["std", "core", "alloc", ...crates]);
		return resolver;
	},

	/**
	 * Create a resolver for Java projects
	 * @param packages - Additional external packages
	 */
	java(packages: string[] = []): PathResolver {
		const resolver = new PathResolver();
		// Java standard library
		resolver.markExternalPackages(["java", "javax", ...packages]);
		return resolver;
	},

	/**
	 * Create a resolver for PHP projects
	 * @param namespaces - Additional external namespaces
	 */
	php(namespaces: string[] = []): PathResolver {
		const resolver = new PathResolver();
		// PHP standard library
		resolver.markExternalPackages([
			"PHPUnit",
			"Laravel",
			"Symfony",
			"GuzzleHttp",
			"Monolog",
			"Doctrine",
			"Twig",
			"Smarty",
			...namespaces,
		]);
		return resolver;
	},
};
