"use client";

import { SiGithub } from "@icons-pack/react-simple-icons";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Code2, Home, Loader2 } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import type { FileTreeItem } from "~/components/CollapsibleFileTree";
import { FileViewer } from "~/components/dashboard/FileViewer";
import { VirtualizedFileTree } from "~/components/dashboard/VirtualizedFileTree";
import { Button } from "~/components/ui/button";
import { api } from "~/lib/eden";

interface FilesClientProps {
	owner: string;
	repo: string;
	repoId: string;
	avatarUrl?: string | null;
	defaultBranch: string | null;
	isPrivate: boolean | null;
	name: string;
	fileTree: FileTreeItem[];
}

export function FilesClient({
	owner,
	repo,
	repoId,
	avatarUrl,
	defaultBranch,
	isPrivate,
	name,
	fileTree,
}: FilesClientProps) {
	const [selectedFile, setSelectedFile] = useState<string | null>(null);

	const {
		data: fileContent,
		isLoading: isFileLoading,
		error: fileError,
	} = useQuery({
		queryKey: ["file-content", repoId, selectedFile],
		queryFn: async () => {
			if (!selectedFile) return null;

			const branch = defaultBranch || "main";
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

			if (!isPrivate) {
				const url = `https://raw.githubusercontent.com/${owner}/${name}/refs/heads/${branch}/${selectedFile}`;
				const res = await fetch(url);
				if (!res.ok) throw new Error("Failed to fetch file");
				return res.text();
			}

			const res = await api["file-content"].get({
				query: { repoId, path: selectedFile },
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
		enabled: !!selectedFile,
	});

	const handleFileSelect = (filePath: string) => {
		setSelectedFile(filePath);
	};

	return (
		<div className="flex h-[calc(100vh-3.5rem)] flex-col border-border border-r border-l">
			<header className="shrink-0 border-border border-b bg-card/50">
				<div className="flex items-center justify-between px-4 py-3">
					<div className="flex items-center gap-4">
						<Link href={`/${owner}/${repo}`}>
							<Button className="h-8 gap-2" size="sm" variant="ghost">
								<ArrowLeft className="h-3.5 w-3.5" />
								<span className="font-mono text-xs">Dashboard</span>
							</Button>
						</Link>

						<div className="h-4 w-px bg-border" />

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

					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2">
							{avatarUrl ? (
								<img alt={owner} className="h-5 w-5" src={avatarUrl} />
							) : (
								<SiGithub className="h-4 w-4 text-muted-foreground" />
							)}
							<span className="font-mono text-muted-foreground text-xs">
								{defaultBranch}
							</span>
						</div>
					</div>
				</div>
			</header>

			<div className="flex flex-1 overflow-hidden">
				<div className="w-80 shrink-0 border-border border-r bg-card/30">
					<VirtualizedFileTree
						defaultBranch={defaultBranch ?? undefined}
						fileTree={fileTree}
						isPrivate={isPrivate ?? undefined}
						name={name}
						onFileSelect={handleFileSelect}
						owner={owner}
						repoId={repoId}
						selectedFile={selectedFile}
					/>
				</div>

				<div className="flex-1 overflow-hidden bg-card/50">
					{selectedFile ? (
						<FileViewer
							content={fileContent ?? null}
							error={fileError ?? null}
							filePath={selectedFile}
							isLoading={isFileLoading ?? false}
							repo={{
								owner,
								name,
								branch: defaultBranch || "main",
								isPrivate: isPrivate ?? false,
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
