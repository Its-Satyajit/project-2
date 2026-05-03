import { FileCodeIcon, FolderIcon, HashIcon, TerminalIcon } from "lucide-react";
import { motion } from "motion/react";
import React from "react";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";

interface StatCardsProps {
	totalFiles: number;
	totalDirectories: number;
	totalLines: number;
	primaryLanguage: string;
}

export function StatCardsSkeleton() {
	const skeletonKeys = ["stat-1", "stat-2", "stat-3", "stat-4"];
	return (
		<div className="grid grid-cols-2 gap-0 md:grid-cols-4">
			{skeletonKeys.map((key) => (
				<div className="border-border border-r border-b p-4" key={key}>
					<Skeleton className="mb-3 h-3 w-20" />
					<Skeleton className="h-6 w-12" />
				</div>
			))}
		</div>
	);
}

export const StatCards = React.memo(function StatCards({
	totalFiles,
	totalDirectories,
	totalLines,
	primaryLanguage,
}: StatCardsProps) {
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
			title: "Total Lines",
			value: totalLines?.toLocaleString() ?? "0",
			icon: HashIcon,
		},
		{
			title: "Language",
			value: primaryLanguage || "Unknown",
			icon: TerminalIcon,
		},
	];

	return (
		<div className="grid grid-cols-2 gap-0 md:grid-cols-4">
			{stats.map((stat, index) => (
				<motion.div
					animate={{ opacity: 1, y: 0 }}
					className="border-border border-r border-b p-4"
					initial={{ opacity: 0, y: 10 }}
					key={stat.title}
					transition={{ delay: index * 0.05, duration: 0.3 }}
				>
					<span className="mb-2 block font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
						{stat.title}
					</span>
					<span className="font-(family-name:--font-display) text-2xl text-foreground">
						{stat.value}
					</span>
				</motion.div>
			))}
		</div>
	);
});
