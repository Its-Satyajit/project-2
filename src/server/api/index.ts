import Elysia, { t } from "elysia";
import { getExtension } from "~/lib/getExtension";
import { getOwnerRepo } from "~/lib/getOwnerRepo";
import { type FileTreeItem, convertToFileTree } from "~/lib/treeUtils";
import { insertCommits } from "../dal/commit";
import { insertFiles } from "../dal/files";
import { getRepositoryData, insertRepositories } from "../dal/repositories";
import { performBasicAnalysis } from "../logic/analysis";
import { getFileContent, getRepoCommits, getRepoMetadata, getRepoTree } from "../octokit";

export const apiHandler = new Elysia()
	.get(
		"/hello-elysia",
		() => {
			return "🦊 I am Alive,";
		},
		{},
	)
	.post(
		"/analyze",
		async (ctx) => {
			const parseResult = getOwnerRepo(ctx.body.githubUrl);

			if (!parseResult) {
				return { error: "Invalid GitHub URL" };
			}

			// 1. Fetch everything from GitHub
			const repoMetadata = await getRepoMetadata(parseResult);

			const [repoTree, repoCommits] = await Promise.all([
				getRepoTree({
					branch: repoMetadata.default_branch,
					...parseResult,
				}),
				getRepoCommits(parseResult),
			]);

			// 2. Insert the repo and get its DB-generated UUID
			const repoRecord = await insertRepositories({
				owner: repoMetadata.owner.login,
				name: repoMetadata.name,
				fullName: repoMetadata.full_name,
				url: repoMetadata.html_url,
				description: repoMetadata.description,
				defaultBranch: repoMetadata.default_branch,
				primaryLanguage: repoMetadata.language ?? "Unknown",
				isPrivate: repoMetadata.private,
				stars: repoMetadata.stargazers_count,
				forks: repoMetadata.forks_count,
			});

			if (!repoRecord?.id) {
				return { error: "Failed to persist repository record" };
			}

			const repoId = repoRecord.id;

			// 3. Map the Commits using the linked repoId
			const mappedCommits = repoCommits.map((item) => ({
				repositoryId: repoId,
				sha: item.sha,
				message: item.commit.message,
				authorName: item.commit.author?.name ?? "Unknown",
				committedAt: item.commit.author?.date
					? new Date(item.commit.author.date)
					: null,
			}));

			// 4. Map the File Tree using the linked repoId (Limit to 1000 files as per spec)
			const limitedTree = repoTree.slice(0, 1000);
			const mappedTree = limitedTree.map((item) => ({
				repositoryId: repoId,
				path: item.path,
				size: item.size,
				sha: item.sha,
				isDirectory: item.type === "tree",
				extension:
					item.type === "blob" && getExtension(item.path) !== "no-extension"
						? getExtension(item.path)
						: null,
				depth: item.path?.split("/").length ?? 0,
			}));

			// 5. Batch insert the commits and files

			const fileTree = convertToFileTree(
				mappedTree.filter(
					(f): f is typeof f & { path: string; isDirectory: boolean } =>
						f.path !== null && f.isDirectory !== null,
				),
			);

			await Promise.all([
				insertCommits(mappedCommits),
				insertFiles(mappedTree),
			]);

			// 6. Perform Basic Analysis (Phase 3)
			const analysisResults = await performBasicAnalysis({
				repoId,
				fullTree: repoTree,
				owner: parseResult.owner,
				repo: parseResult.repo,
				fileTree,
			});

			return {
				success: true,
				repoId,
				metadata: repoMetadata,
				filesCount: limitedTree.length,
				commitsCount: repoCommits.length,
				totalFilesIgnored: Math.max(0, repoTree.length - 1000),
				analysis: analysisResults,
			};
		},
		{
			body: t.Object({
				githubUrl: t.String(),
			}),
		},
	)
	.get(
		"/dashboard/:repoId",
		async ({ params, set }) => {
			const data = await getRepositoryData(params.repoId);
			if (!data) {
				set.status = 404;
				return { error: "Repository not found" };
			}

			// Use the stored fileTree from analysisResults if available
			const fileTree =
				(data.analysisResults[0]?.fileTreeJson as FileTreeItem[]) ?? [];

			return {
				...data,
				fileTree,
			};
		},
		{
			params: t.Object({
				repoId: t.String(),
			}),
		},
	)
	.get(
		"/file-content",
		async ({ query, set }) => {
			const repoData = await getRepositoryData(query.repoId);
			if (!repoData) {
				set.status = 404;
				return { error: "Repository not found" };
			}

			const content = await getFileContent({
				owner: repoData.owner,
				repo: repoData.name,
				path: query.path,
			});

			if (content === null) {
				set.status = 404;
				return { error: "File not found or too large" };
			}

			return { content };
		},
		{
			query: t.Object({
				repoId: t.String(),
				path: t.String(),
			}),
		},
	);
