import { getFileContentFromRaw } from "../src/server/octokit";

const content = await getFileContentFromRaw({
	owner: "vercel",
	repo: "next.js",
	branch: "canary",
	path: "packages/next/src/client/index.tsx",
});

console.log("Content length:", content?.length);
console.log("Content preview:", content?.slice(0, 500));
