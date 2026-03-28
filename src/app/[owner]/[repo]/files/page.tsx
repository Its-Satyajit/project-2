import { SiGithub } from "@icons-pack/react-simple-icons";
import { ArrowLeft, Code2, Home, Loader2 } from "lucide-react";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { cache, Suspense } from "react";
import type { FileTreeItem } from "~/components/CollapsibleFileTree";
import { Button } from "~/components/ui/button";
import { api } from "~/lib/eden";
import { getRepositoryByOwnerAndName } from "~/server/dal/repositories";
import { FilesClient } from "./FilesClient";

interface FilesPageProps {
	params: Promise<{ owner: string; repo: string }>;
}

const getRepoData = cache(async (owner: string, repo: string) => {
	return getRepositoryByOwnerAndName(owner, repo);
});

const getDashboardData = cache(async (repoId: string) => {
	const res = await api.dashboard({ repoId }).get();
	if (res.error || !res.data) return null;
	return res.data;
});

export async function generateMetadata({
	params,
}: FilesPageProps): Promise<Metadata> {
	const { owner, repo } = await params;
	return {
		title: `${owner}/${repo} Files — Analyze`,
		description: `Browse file structure and contents for ${owner}/${repo}`,
	};
}

function LoadingState() {
	return (
		<div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
			<div className="flex items-center gap-3 font-mono text-muted-foreground text-sm">
				<Loader2 className="h-4 w-4 animate-spin" />
				<span>Loading files...</span>
			</div>
		</div>
	);
}

function NotFoundState({ owner, repo }: { owner: string; repo: string }) {
	return (
		<div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
			<div className="text-center">
				<div className="mb-4 border border-destructive/30 bg-destructive/5 px-4 py-2 font-mono text-destructive text-sm">
					Repository not found
				</div>
				<Link href="/">
					<Button variant="outline">Go Home</Button>
				</Link>
			</div>
		</div>
	);
}

async function FilesContent({
	owner,
	repo,
	repoId,
}: {
	owner: string;
	repo: string;
	repoId: string;
}) {
	const dashboardData = (await getDashboardData(repoId)) as {
		owner: string;
		name: string;
		fullName: string;
		defaultBranch: string;
		isPrivate: boolean;
		avatarUrl?: string;
		fileTree?: FileTreeItem[];
	} | null;

	if (!dashboardData) {
		return <NotFoundState owner={owner} repo={repo} />;
	}

	return (
		<FilesClient
			avatarUrl={dashboardData.avatarUrl}
			defaultBranch={dashboardData.defaultBranch}
			fileTree={dashboardData.fileTree ?? []}
			isPrivate={dashboardData.isPrivate}
			name={dashboardData.name}
			owner={dashboardData.owner}
			repo={repo}
			repoId={repoId}
		/>
	);
}

export default async function FilesPage({ params }: FilesPageProps) {
	const { owner, repo } = await params;
	const repoData = await getRepoData(owner, repo);

	if (!repoData) {
		return (
			<main className="blueprint-grid relative mx-auto min-h-screen max-w-7xl overflow-hidden bg-background pt-8">
				<NotFoundState owner={owner} repo={repo} />
			</main>
		);
	}

	return (
		<main className="blueprint-grid relative mx-auto min-h-screen max-w-7xl overflow-hidden bg-background pt-8">
			<Suspense fallback={<LoadingState />}>
				<FilesContent owner={owner} repo={repo} repoId={repoData.id} />
			</Suspense>
		</main>
	);
}
