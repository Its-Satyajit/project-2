"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { GitBranch } from "lucide-react";
import type React from "react";
import { FallbackImage } from "~/components/FallbackImage";

interface Contributor {
	id: string;
	githubLogin: string;
	avatarUrl: string | null;
	htmlUrl: string | null;
	contributions: number;
}

interface ContributorsListProps {
	contributors: Contributor[];
	parentRef: React.RefObject<HTMLDivElement | null>;
}

export function ContributorsList({
	contributors,
	parentRef,
}: ContributorsListProps) {
	const virtualizer = useVirtualizer({
		count: contributors.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 56,
		overscan: 10,
	});

	return (
		<div
			className="relative w-full"
			style={{
				height: `${virtualizer.getTotalSize()}px`,
			}}
		>
			{virtualizer.getVirtualItems().map((virtualItem) => {
				const contributor = contributors[virtualItem.index];
				if (!contributor) return null;

				return (
					<div
						className="absolute top-0 left-0 flex w-full items-center gap-4 border-border border-b py-3 transition-colors last:border-b-0 hover:bg-muted/30"
						key={contributor.id}
						style={{
							height: `${virtualItem.size}px`,
							transform: `translateY(${virtualItem.start}px)`,
						}}
					>
						<span className="w-8 text-right font-mono text-muted-foreground text-xs tabular-nums">
							{virtualItem.index + 1}
						</span>

						{contributor.avatarUrl ? (
							<FallbackImage
								alt={contributor.githubLogin}
								className="shrink-0 rounded-full"
								height={36}
								src={contributor.avatarUrl}
								width={36}
							/>
						) : (
							<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
								<GitBranch className="h-4 w-4 text-muted-foreground" />
							</div>
						)}

						<div className="min-w-0 flex-1">
							<span className="truncate font-medium font-mono text-sm">
								{contributor.githubLogin}
							</span>
						</div>

						<div className="shrink-0 font-mono text-foreground text-sm tabular-nums">
							{contributor.contributions.toLocaleString("en-US")}
						</div>
					</div>
				);
			})}
		</div>
	);
}
