"server only";
import { App, Octokit } from "octokit";
import { env } from "~/env";

const octokit = new Octokit({ auth: env.GITHUB_PAT });

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
		per_page: 100,
	});
	return commits;
}

export async function getCommitDetails({
	owner,
	repo,
	sha,
}: {
	owner: string;
	repo: string;
	sha: string;
}) {
	const { data: commit } = await octokit.rest.repos.getCommit({
		owner,
		repo,
		ref: sha,
	});
	return commit;
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

export async function getFileContentFromRaw({
	owner,
	repo,
	branch,
	path,
}: {
	owner: string;
	repo: string;
	branch: string;
	path: string;
}): Promise<string | null> {
	try {
		const encodedPath = path
			.split("/")
			.map((segment) => encodeURIComponent(segment))
			.join("/");
		const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${encodedPath}`;
		const res = await fetch(url);
		if (!res.ok) {
			console.log(`[RawFetch] ${res.status} for ${path}`);
			return null;
		}
		return res.text();
	} catch (error) {
		console.error(`[RawFetch] Error for ${path}:`, error);
		return null;
	}
}

export interface Contributor {
	login: string;
	id: number;
	avatar_url: string;
	html_url: string;
	contributions: number;
}

export async function getRepoContributors({
	owner,
	repo,
}: {
	owner: string;
	repo: string;
}): Promise<Contributor[]> {
	const data = await octokit.paginate(octokit.rest.repos.listContributors, {
		owner,
		repo,
		per_page: 100,
	});

	return data
		.filter((c) => c.login !== undefined)
		.map((c) => ({
			login: c.login!,
			id: c.id ?? 0,
			avatar_url: c.avatar_url ?? "",
			html_url: c.html_url ?? "",
			contributions: c.contributions ?? 0,
		})) as Contributor[];
}
