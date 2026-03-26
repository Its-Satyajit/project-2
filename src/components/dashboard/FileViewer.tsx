"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { escape as htmlEscape } from "es-toolkit";
import { Copy, FileCode, Loader2 } from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import React, { Suspense, use, useMemo, useState } from "react";
import { codeToHtml } from "shiki";
import { AIExplainButton } from "~/components/ai";
import { Button } from "~/components/ui/button";
import { env } from "~/env";

interface FileViewerProps {
	filePath: string;
	content: string | null;
	isLoading: boolean;
	error: Error | null;
	repo?: {
		owner: string;
		name: string;
		branch: string;
		isPrivate: boolean;
	};
}

const languageMap: Record<string, string> = {
	ts: "typescript",
	tsx: "typescript",
	js: "javascript",
	jsx: "javascript",
	py: "python",
	rs: "rust",
	go: "go",
	rb: "ruby",
	java: "java",
	cpp: "cpp",
	c: "c",
	css: "css",
	html: "html",
	json: "json",
	yaml: "yaml",
	yml: "yaml",
	md: "markdown",
	sh: "bash",
	bash: "bash",
	zsh: "bash",
	toml: "toml",
	sql: "sql",
	svelte: "svelte",
	vue: "vue",
	astro: "astro",
};

async function highlightLine(
	line: string,
	lang: string,
	isDark: boolean,
): Promise<string> {
	if (!line) return " ";
	try {
		const html = await codeToHtml(line, {
			lang,
			theme: isDark ? "github-dark" : "github-light",
		});
		// Extract just the inner code spans, ignoring the pre and code wrappers that add background colors and block layout
		const match = html.match(/<code[^>]*>([\s\S]*?)<\/code>/);
		return match?.[1] ?? html;
	} catch {
		return htmlEscape(line);
	}
}

function HighlightedLines({
	promise,
	parentRef,
}: {
	promise: Promise<string[]>;
	parentRef: React.RefObject<HTMLDivElement | null>;
}) {
	const lines = use(promise);

	const rowVirtualizer = useVirtualizer({
		count: lines.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 24,
		overscan: 20,
	});

	return (
		<div
			className="relative w-full"
			style={{
				height: `${rowVirtualizer.getTotalSize()}px`,
			}}
		>
			{rowVirtualizer.getVirtualItems().map((virtualRow) => {
				const html = lines[virtualRow.index];
				return (
					<div
						className="absolute top-0 left-0 flex w-full transition-colors hover:bg-muted/50"
						key={virtualRow.key}
						style={{
							height: `${virtualRow.size}px`,
							transform: `translateY(${virtualRow.start}px)`,
						}}
					>
						<div className="w-12 shrink-0 select-none border-border border-r py-0.5 pr-3 text-right font-mono text-muted-foreground text-xs leading-6">
							{virtualRow.index + 1}
						</div>
						<div
							className="flex-1 whitespace-pre px-3 py-0.5 font-mono text-sm leading-6 [&>span]:bg-transparent!"
							// biome-ignore lint/security/noDangerouslySetInnerHtml: Required for Shiki
							dangerouslySetInnerHTML={{ __html: html ?? " " }}
						/>
					</div>
				);
			})}
		</div>
	);
}

export function FileViewer({
	filePath,
	content,
	isLoading,
	error,
	repo,
}: FileViewerProps) {
	const [copied, setCopied] = useState(false);
	const { resolvedTheme } = useTheme();

	const isDark = resolvedTheme === "dark";

	const fileName = useMemo(
		() => filePath.split("/").pop() || filePath,
		[filePath],
	);
	const extension = useMemo(
		() => fileName.split(".").pop()?.toLowerCase() || "",
		[fileName],
	);
	const language = languageMap[extension] || "text";
	const isImage = useMemo(
		() =>
			["png", "jpg", "jpeg", "gif", "svg", "webp", "ico"].includes(extension),
		[extension],
	);

	const lines = useMemo(() => (content ? content.split("\n") : []), [content]);

	const scrollParentRef = React.useRef<HTMLDivElement>(null);

	const highlightingPromise = useMemo(() => {
		if (!content || isImage) return null;
		// Return promise for highlighting all lines
		return Promise.all(
			lines.map((line) => highlightLine(line, language, isDark)),
		);
	}, [content, lines, language, isDark, isImage]);

	const handleCopy = () => {
		if (content) {
			navigator.clipboard.writeText(content);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const getLanguageColor = (ext: string) => {
		const colors: Record<string, string> = {
			ts: "text-primary",
			tsx: "text-primary",
			js: "text-primary/80",
			jsx: "text-primary/80",
			py: "text-accent",
			rs: "text-accent",
			go: "text-accent",
			rb: "text-accent",
			java: "text-accent",
			cpp: "text-primary",
			c: "text-primary",
			css: "text-accent",
			html: "text-accent",
			json: "text-primary/80",
			yaml: "text-accent",
			yml: "text-accent",
			md: "text-muted-foreground",
		};
		return colors[ext] || "text-foreground/60";
	};

	if (isLoading) {
		return (
			<div className="flex h-full min-h-[400px] flex-col items-center justify-center">
				<Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
				<p className="font-mono text-muted-foreground text-sm">
					Loading file...
				</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex h-full min-h-[400px] flex-col items-center justify-center">
				<div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
					<p className="font-mono text-destructive text-sm">
						Failed to load file: {error.message}
					</p>
				</div>
			</div>
		);
	}

	if (!content) {
		return (
			<div className="flex h-full min-h-[400px] flex-col items-center justify-center">
				<p className="font-mono text-muted-foreground text-sm">
					No file selected
				</p>
			</div>
		);
	}

	return (
		<div className="flex h-full min-h-[400px] flex-col">
			<div className="flex items-center justify-between border-border border-b px-4 py-2">
				<div className="flex items-center gap-3">
					<FileCode className="h-4 w-4 text-primary" />
					<span className={`font-mono text-sm ${getLanguageColor(extension)}`}>
						{fileName}
					</span>
					<span className="font-mono text-muted-foreground text-xs">
						{extension.toUpperCase()}
					</span>
				</div>
				{!isImage && (
					<div className="flex items-center gap-1">
						{env.NEXT_PUBLIC_AI_ENABLED && (
							<AIExplainButton
								code={content}
								language={language}
								size="sm"
								variant="ghost"
							/>
						)}
						<Button
							className="h-7 px-2 font-mono text-xs"
							onClick={handleCopy}
							size="sm"
							variant="ghost"
						>
							{copied ? (
								<span className="text-accent">Copied!</span>
							) : (
								<Copy className="mr-1 h-3 w-3" />
							)}
						</Button>
					</div>
				)}
			</div>
			<div
				className="flex h-full min-h-0 overflow-auto bg-card"
				ref={scrollParentRef}
			>
				{isImage ? (
					<div className="relative flex h-full min-h-[400px] w-full items-center justify-center bg-card/50 p-8">
						{repo && !repo.isPrivate ? (
							<Image
								alt={fileName}
								className="rounded-md object-contain"
								fill
								src={`https://raw.githubusercontent.com/${repo.owner}/${repo.name}/refs/heads/${repo.branch}/${filePath}`}
								unoptimized
							/>
						) : (
							<p className="font-mono text-muted-foreground text-sm">
								Image preview not available for private repositories.
							</p>
						)}
					</div>
				) : (
					<Suspense
						fallback={
							<div className="w-full py-2">
								<Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
							</div>
						}
					>
						{highlightingPromise ? (
							<HighlightedLines
								parentRef={scrollParentRef}
								promise={highlightingPromise}
							/>
						) : (
							<div className="w-full whitespace-pre px-4 py-2 font-mono text-sm">
								{content}
							</div>
						)}
					</Suspense>
				)}
			</div>
		</div>
	);
}
