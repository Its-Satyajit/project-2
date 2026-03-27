"use client";

import { SiGithub } from "@icons-pack/react-simple-icons";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Code2, FolderTree, Home, Loader2 } from "lucide-react";
import Link from "next/link";
import React, { Suspense, use, useState } from "react";
import type { FileTreeItem } from "~/components/CollapsibleFileTree";
import { FileViewer } from "~/components/dashboard/FileViewer";
import { VirtualizedFileTree } from "~/components/dashboard/VirtualizedFileTree";
import { Button } from "~/components/ui/button";
import { api } from "~/lib/eden";

export default function FilesPage({
	params,
}: {
	params: Promise<{ owner: string; repo: string }>;
}) {
	return (
		<main className="blueprint-grid relative min-h-screen overflow-hidden bg-background pt-14">
			<Suspense
				fallback={
					<div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
						<div className="flex items-center gap-3 font-mono text-muted-foreground text-sm">
							<Loader2 className="h-4 w-4 animate-spin" />
							<span>Loading files...</span>
						</div>
					</div>
				}
			>
				<FilesContent params={params} />
			</Suspense>
		</main>
	);
}

function FilesContent({
	params,
}: {
	params: Promise<{ owner: string; repo: string }>;
}) {
	const { owner, repo } = use(params);
	const [selectedFile, setSelectedFile] = useState<string | null>(null);

	// Get repo ID
	const { data: repoLookup, isLoading: isLookingUp } = useQuery({
		queryKey: ["repo-lookup", owner, repo],
		queryFn: async () => {
			const res = await fetch(`/api/repos/lookup?owner=${owner}&name=${repo}`);
			if (!res.ok) throw new Error("Failed to lookup repository");
			return res.json() as Promise<{ id: string }>;
		},
	});

	const repoId = repoLookup?.id;

	// Get dashboard data for file tree and metadata
	const { data: response, isLoading } = useQuery({
		queryKey: ["repo-dashboard", repoId],
		queryFn: async () => {
			const res = await api.dashboard({ repoId: repoId! }).get();
			return res;
		},
		enabled: !!repoId,
		retry: false,
	});

	// Get file content
	const {
		data: fileContent,
		isLoading: isFileLoading,
		error: fileError,
	} = useQuery({
		queryKey: ["file-content", repoId, selectedFile],
		queryFn: async () => {
			if (!selectedFile || !response?.data) return null;

			const data = response.data as {
				owner: string;
				name: string;
				defaultBranch: string;
				isPrivate: boolean;
			};

			const ext = selectedFile.split(".").pop()?.toLowerCase();
			const isImage = [
				"png",
				"jpg",
				"jpeg",
				"gif",
				"svg",
				"webp",
				"ico",
			].includes(ext || "");
			if (isImage) {
				return "IMAGE_PLACEHOLDER";
			}

			if (!data.isPrivate) {
				const branch = data.defaultBranch || "main";
				const url = `https://raw.githubusercontent.com/${data.owner}/${data.name}/refs/heads/${branch}/${selectedFile}`;
				const res = await fetch(url);
				if (!res.ok) throw new Error("Failed to fetch file");
				return res.text();
			}

			const res = await api["file-content"].get({
				query: { repoId: repoId!, path: selectedFile },
			});
			if (res.error) {
				const errorVal = res.error.value;
				const errorMsg =
					typeof errorVal === "string"
						? errorVal
						: errorVal && typeof errorVal === "object" && "summary" in errorVal
							? (errorVal as { summary: string }).summary
							: JSON.stringify(errorVal);
				throw new Error(errorMsg);
			}
			return res.data?.content;
		},
		enabled: !!selectedFile && !!response?.data,
	});

	if (isLookingUp || isLoading) {
		return (
			<div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
				<div className="flex items-center gap-3 font-mono text-muted-foreground text-sm">
					<Loader2 className="h-4 w-4 animate-spin" />
					<span>Loading repository...</span>
				</div>
			</div>
		);
	}

	if (!response?.data || typeof response.data !== "object") {
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

	const data = response.data as unknown as {
		id: string;
		owner: string;
		name: string;
		fullName: string;
		defaultBranch: string;
		isPrivate: boolean;
		primaryLanguage: string;
		avatarUrl?: string;
		fileTree: FileTreeItem[];
	};

	const handleFileSelect = (filePath: string) => {
		setSelectedFile(filePath);
	};

	return (
		<div className="flex h-[calc(100vh-3.5rem)] flex-col">
			{/* Header */}
			<header className="shrink-0 border-border border-b bg-card/50">
				<div className="flex items-center justify-between px-4 py-3">
					{/* Left: Navigation */}
					<div className="flex items-center gap-4">
						<Link href={`/${owner}/${repo}`}>
							<Button className="h-8 gap-2" size="sm" variant="ghost">
								<ArrowLeft className="h-3.5 w-3.5" />
								<span className="font-mono text-xs">Dashboard</span>
							</Button>
						</Link>

						<div className="h-4 w-px bg-border" />

						{/* Breadcrumbs */}
						<nav className="flex items-center gap-1.5">
							<Link href={`/${owner}/${repo}`}>
								<Home className="h-3.5 w-3.5 text-muted-foreground transition-colors hover:text-foreground" />
							</Link>
							<span className="text-border">/</span>
							<span className="font-mono text-foreground text-sm">
								{owner}/{repo}
							</span>
							<span className="text-border">/</span>
							<span className="font-mono text-muted-foreground text-sm">
								{selectedFile || "files"}
							</span>
						</nav>
					</div>

					{/* Right: Repo info */}
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2">
							{data.avatarUrl ? (
								<img
									alt={data.owner}
									className="h-5 w-5"
									src={data.avatarUrl}
								/>
							) : (
								<SiGithub className="h-4 w-4 text-muted-foreground" />
							)}
							<span className="font-mono text-muted-foreground text-xs">
								{data.defaultBranch}
							</span>
						</div>
					</div>
				</div>
			</header>

			{/* File Explorer */}
			<div className="flex flex-1 overflow-hidden">
				{/* File Tree - Left Panel */}
				<div className="w-80 shrink-0 border-border border-r bg-card/30">
					<VirtualizedFileTree
						defaultBranch={data.defaultBranch}
						fileTree={data.fileTree ?? []}
						isPrivate={data.isPrivate}
						name={data.name}
						onFileSelect={handleFileSelect}
						owner={data.owner}
						repoId={data.id}
						selectedFile={selectedFile}
					/>
				</div>

				{/* File Viewer - Right Panel */}
				<div className="flex-1 overflow-hidden bg-card/50">
					{selectedFile ? (
						<FileViewer
							content={fileContent ?? null}
							error={fileError ?? null}
							filePath={selectedFile}
							isLoading={isFileLoading ?? false}
							repo={{
								owner: data.owner,
								name: data.name,
								branch: data.defaultBranch || "main",
								isPrivate: data.isPrivate,
							}}
						/>
					) : (
						<div className="flex h-full flex-col items-center justify-center text-muted-foreground">
							<Code2 className="mb-4 h-12 w-12 opacity-20" />
							<p className="font-(family-name:--font-display) mb-2 text-foreground text-lg">
								Select a file to view
							</p>
							<p className="font-mono text-xs uppercase tracking-wider">
								Click on any file in the tree to see its contents
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
