export function getOwnerRepo(
	url: string,
): { owner: string; repo: string } | null {
	try {
		if (url.startsWith("git@")) {
			const match = url.match(/git@github\.com:([^/]+)\/(.+?)(\.git)?$/);
			if (!match) return null;

			if (match[1] && match[2]) {
				return {
					owner: match[1],
					repo: match[2],
				};
			} else {
				return null;
			}
		}

		const parsed = new URL(url);

		if (parsed.hostname !== "github.com") return null;

		const parts = parsed.pathname.split("/").filter(Boolean);

		const owner = parts[0];
		const repo = parts[1];

		if (!owner || !repo) return null;

		return {
			owner,
			repo: repo.replace(/\.git$/, ""),
		};
	} catch {
		return null;
	}
}
