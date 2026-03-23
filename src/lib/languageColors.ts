const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
	ts: "TypeScript",
	tsx: "TypeScript",
	js: "JavaScript",
	jsx: "JavaScript",
	py: "Python",
	rs: "Rust",
	go: "Go",
	java: "Java",
	kt: "Kotlin",
	c: "C",
	cpp: "C++",
	cs: "C#",
	rb: "Ruby",
	php: "PHP",
	swift: "Swift",
	scala: "Scala",
	html: "HTML",
	css: "CSS",
	scss: "SCSS",
	json: "JSON",
	yaml: "YAML",
	yml: "YAML",
	md: "Markdown",
	sql: "SQL",
	sh: "Shell",
	bash: "Shell",
	zsh: "Shell",
	dockerfile: "Dockerfile",
	prisma: "Prisma",
	toml: "TOML",
	env: "Env",
	gitignore: "Gitignore",
	lua: "Lua",
	r: "R",
	pl: "Perl",
	ex: "Elixir",
	exs: "Elixir",
	erl: "Erlang",
	hs: "Haskell",
	clj: "Clojure",
	elm: "Elm",
	vue: "Vue",
	svelte: "Svelte",
};

const LANGUAGE_COLORS: Record<string, string> = {
	TypeScript: "#3178c6",
	JavaScript: "#f7df1e",
	Python: "#3572A5",
	Rust: "#dea584",
	Go: "#00ADD8",
	Java: "#b07219",
	Kotlin: "#A97BFF",
	C: "#555555",
	"C++": "#f34b7d",
	"C#": "#178600",
	Ruby: "#701516",
	PHP: "#4F5D95",
	Swift: "#F05138",
	Scala: "#c22d40",
	HTML: "#e34c26",
	CSS: "#563d7c",
	SCSS: "#c6538c",
	JSON: "#292929",
	YAML: "#cb171e",
	Markdown: "#083fa1",
	SQL: "#e38c00",
	Shell: "#89e051",
	Dockerfile: "#384d54",
	Prisma: "#2d3748",
	TOML: "#9c4121",
	Env: "#ecd53f",
	Gitignore: "#fudge",
	Lua: "#000080",
	R: "#198CE7",
	Perl: "#0298c3",
	Elixir: "#6e4a7e",
	Erlang: "#B83998",
	Haskell: "#5e5086",
	Clojure: "#db5855",
	Elm: "#60B5BC",
	Vue: "#41b883",
	Svelte: "#ff3e00",
	Other: "#6b7280",
};

export function getLanguageFromExtension(
	extension: string | undefined,
): string {
	if (!extension) return "Other";
	return EXTENSION_LANGUAGE_MAP[extension.toLowerCase()] ?? "Other";
}

export function getLanguageColor(extension: string | undefined): string {
	const language = getLanguageFromExtension(extension);
	const color = LANGUAGE_COLORS[language];
	return color ?? "#6b7280";
}

export function getHotspotColor(score: number): string {
	if (score === 0) return "#e5e7eb";
	const r = Math.round(255 - score * 155);
	const g = Math.round(200 - score * 150);
	const b = Math.round(50 - score * 50);
	return `rgb(${r},${g},${b})`;
}
