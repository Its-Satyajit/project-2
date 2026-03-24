import { resolveImport } from "../../src/server/logic/parsers/pathResolver.js";

const testCases = [
	{
		source: "~/hooks/useRepoStatus",
		filePath: "src/app/dashboard/[repoId]/dependencies/page.tsx",
	},
	{
		source: "~/components/ui/button",
		filePath: "src/app/dashboard/[repoId]/dependencies/page.tsx",
	},
	{
		source: "react",
		filePath: "src/app/dashboard/[repoId]/dependencies/page.tsx",
	},
	{
		source: "../lib/utils",
		filePath: "src/components/ui/button.tsx",
	},
];

testCases.forEach(({ source, filePath }) => {
	const result = resolveImport(source, filePath);
	console.log(`Source: ${source}`);
	console.log(`From file: ${filePath}`);
	console.log(`Result:`, result);
	console.log("---");
});
