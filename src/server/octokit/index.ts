"server only";
import { App, Octokit } from "octokit";
import { env } from "~/env";

export const octokit = new Octokit({ auth: env.GITHUB_PAT });

export async function getRepoMetadata({
	owner,
	repo,
}: {
	owner: string;
	repo: string;
}) {
	const { data: repository } = await octokit.rest.repos.get({
		owner,
		repo,
	});
	return repository;
}

export async function getRepoTree({
	owner,
	repo,
	branch,
}: {
	owner: string;
	repo: string;
	branch: string;
}) {
	const { data: tree } = await octokit.rest.git.getTree({
		owner,
		repo,
		tree_sha: branch,
		recursive: "1",
	});
	return tree.tree;
}

export async function getRepoCommits({
	owner,
	repo,
}: {
	owner: string;
	repo: string;
}) {
	const { data: commits } = await octokit.rest.repos.listCommits({
		owner,
		repo,
		per_page: 10,
	});
	return commits;
}

export async function getFileContent({
	owner,
	repo,
	path,
}: {
	owner: string;
	repo: string;
	path: string;
}) {
	const { data: file } = await octokit.rest.repos.getContent({
		owner,
		repo,
		path,
	});

	if (Array.isArray(file) || file.type !== "file") {
		return null;
	}

	return Buffer.from(file.content, "base64").toString("utf8");
}
