"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { GitBranch } from "lucide-react";
import Image from "next/image";
import type React from "react";
import { useState, useEffect } from "react";

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
	const [columns, setColumns] = useState(3);
    const CARD_MIN_WIDTH = 280;
    const CARD_GAP = 16;

    useEffect(() => {
        if (!parentRef.current) return;

        const observer = new ResizeObserver((entries) => {
            if (!entries[0]) return;
            const width = entries[0].contentRect.width;
            const newColumns = Math.max(1, Math.floor((width + CARD_GAP) / (CARD_MIN_WIDTH + CARD_GAP)));
            setColumns(newColumns);
        });

        observer.observe(parentRef.current);
        return () => observer.disconnect();
    }, [parentRef]);

	const rowCount = Math.ceil(contributors.length / columns);

	const rowVirtualizer = useVirtualizer({
		count: rowCount,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 100, // Card height + gap
		overscan: 5,
	});

	return (
		<div
			className="relative w-full"
			style={{
				height: `${rowVirtualizer.getTotalSize()}px`,
			}}
		>
			{rowVirtualizer.getVirtualItems().map((virtualRow) => {
				const startIndex = virtualRow.index * columns;
				const rowContributors = contributors.slice(startIndex, startIndex + columns);

				return (
					<div
						className="absolute top-0 left-0 grid w-full gap-4"
						key={virtualRow.key}
						style={{
							height: `${virtualRow.size}px`,
							transform: `translateY(${virtualRow.start}px)`,
                            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                            padding: "8px 4px",
						}}
					>
                        {rowContributors.map((contributor) => (
                            <div 
                                className="flex h-full items-center gap-4 rounded-lg border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/40"
                                key={contributor.id}
                            >
                                {contributor.avatarUrl ? (
                                    <Image
                                        alt={contributor.githubLogin}
                                        className="rounded-full"
                                        height={48}
                                        src={contributor.avatarUrl}
                                        width={48}
                                    />
                                ) : (
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                        <GitBranch className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium font-mono">
                                        {contributor.githubLogin}
                                    </p>
                                    {contributor.htmlUrl && (
                                        <a
                                            className="block truncate font-mono text-muted-foreground text-xs hover:underline"
                                            href={contributor.htmlUrl}
                                            rel="noopener noreferrer"
                                            target="_blank"
                                        >
                                            {contributor.htmlUrl}
                                        </a>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="font-bold font-mono text-foreground text-lg">
                                        {contributor.contributions}
                                    </p>
                                    <p className="font-mono text-muted-foreground text-xs">
                                        contributions
                                    </p>
                                </div>
                            </div>
                        ))}
					</div>
				);
			})}
		</div>
	);
}
