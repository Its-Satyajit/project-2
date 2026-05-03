import type { ImportStatement, ParsedFile } from "./index";

export function createRegexParser(
	language: string,
	patterns: RegExp[],
	commentPrefixes: string[] = ["//", "#", "*", "--"],
): (content: string, path: string) => Promise<ParsedFile> {
	return async (content: string, filePath: string): Promise<ParsedFile> => {
		try {
			const imports: ImportStatement[] = [];
			const lines = content.split("\n");

			for (const line of lines) {
				const trimmed = line.trim();

				if (commentPrefixes.some((prefix) => trimmed.startsWith(prefix))) {
					continue;
				}

				for (const pattern of patterns) {
					const match = trimmed.match(pattern);
					if (match && match[1]) {
						const source = match[1].trim();
						if (source && !imports.some((i) => i.source === source)) {
							imports.push({
								raw: trimmed,
								source,
								isDynamic: false,
							});
						}
					}
				}
			}

			return {
				path: filePath,
				language,
				imports,
			};
		} catch (error) {
			return {
				path: filePath,
				language,
				imports: [],
				parseError:
					error instanceof Error ? error.message : "Unknown parse error",
			};
		}
	};
}
