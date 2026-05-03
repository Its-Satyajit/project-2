"use client";

import {
	Calendar,
	FileCodeIcon,
	FolderIcon,
	GitBranch,
	HashIcon,
	Shield,
	Users,
} from "lucide-react";
import { motion } from "motion/react";
import React from "react";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";

interface EnhancedStatCardsProps {
	totalFiles: number;
	totalDirectories: number;
	totalLines: number;
	primaryLanguage: string;
	contributorCount?: number;
	defaultBranch?: string;
	license?: string | null;
	createdAt?: string;
	updatedAt?: string;
}

function formatDate(dateString?: string): string {
	if (!dateString) return "N/A";
	const date = new Date(dateString);
	return date.toLocaleDateString("en-US", {
		month: "short",
		year: "numeric",
	});
}

export const EnhancedStatCards = React.memo(function EnhancedStatCards({
	totalFiles,
	totalDirectories,
	totalLines,
	primaryLanguage,
	contributorCount,
	defaultBranch,
	license,
	createdAt,
	updatedAt,
}: EnhancedStatCardsProps) {
	const stats = [
		{
			title: "Total Files",
			value: totalFiles,
			icon: FileCodeIcon,
		},
		{
			title: "Directories",
			value: totalDirectories,
			icon: FolderIcon,
		},
		{
			title: "Lines",
			value: totalLines?.toLocaleString("en-US") ?? "0",
			icon: HashIcon,
		},
		{
			title: "Language",
			value: primaryLanguage || "Unknown",
			icon: GitBranch,
		},
		{
			title: "Contributors",
			value: contributorCount?.toLocaleString("en-US") ?? "N/A",
			icon: Users,
		},
		{
			title: "License",
			value: license || "None",
			icon: Shield,
		},
	];

	// Additional metadata row
	const metaStats = [
		{
			title: "Branch",
			value: defaultBranch || "main",
		},
		{
			title: "Created",
			value: formatDate(createdAt),
		},
		{
			title: "Updated",
			value: formatDate(updatedAt),
		},
	];

	return (
		<div>
			{/* Main stats grid */}
			<div className="grid grid-cols-2 gap-0 md:grid-cols-3 lg:grid-cols-6">
				{stats.map((stat, index) => (
					<motion.div
						animate={{ opacity: 1, y: 0 }}
						className="border-border border-r border-b p-4"
						initial={{ opacity: 0, y: 10 }}
						key={stat.title}
						transition={{ delay: index * 0.04, duration: 0.25 }}
					>
						<div className="mb-2 flex items-center gap-2">
							<stat.icon className="h-3 w-3 text-muted-foreground" />
							<span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
								{stat.title}
							</span>
						</div>
						<span className="font-(family-name:--font-display) text-foreground text-xl">
							{stat.value}
						</span>
					</motion.div>
				))}
			</div>

			{/* Secondary meta row */}
			<div className="grid grid-cols-3 gap-0">
				{metaStats.map((stat, index) => (
					<motion.div
						animate={{ opacity: 1 }}
						className="border-border border-r border-b px-4 py-2.5 last:border-r-0"
						initial={{ opacity: 0 }}
						key={stat.title}
						transition={{ delay: 0.3 + index * 0.03, duration: 0.2 }}
					>
						<div className="flex items-center justify-between">
							<span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
								{stat.title}
							</span>
							<span className="font-mono text-foreground text-xs">
								{stat.value}
							</span>
						</div>
					</motion.div>
				))}
			</div>
		</div>
	);
});
