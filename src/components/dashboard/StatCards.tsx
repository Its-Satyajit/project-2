import { motion } from "framer-motion";
import { FileCodeIcon, FolderIcon, HashIcon, TerminalIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
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
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{skeletonKeys.map((key) => (
				<Card key={key}>
					<CardHeader
						className={cn(
							"flex flex-row items-center justify-between space-y-0",
							"pb-2",
							"text-muted-foreground",
						)}
					>
						<Skeleton className="h-4 w-25" />
						<Skeleton className="h-4 w-4" />
					</CardHeader>
					<CardContent>
						<Skeleton className="mb-2 h-8 w-15" />
						<Skeleton className="h-3 w-30" />
					</CardContent>
				</Card>
			))}
		</div>
	);
}

export function StatCards({
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
			description: "Individual files in the repository",
		},
		{
			title: "Directories",
			value: totalDirectories,
			icon: FolderIcon,
			description: "Full directory tree count",
		},
		{
			title: "Total Lines",
			value: totalLines?.toLocaleString() ?? "0",
			icon: HashIcon,
			description: "Estimated lines of code (LOC)",
		},
		{
			title: "Language",
			value: primaryLanguage || "Unknown",
			icon: TerminalIcon,
			description: "Primary detected language",
		},
	];

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{stats.map((stat, index) => (
				<motion.div
					animate={{ opacity: 1, y: 0 }}
					initial={{ opacity: 0, y: 16 }}
					key={stat.title}
					transition={{
						delay: index * 0.05,
						duration: 0.3,
						ease: "easeOut",
					}}
				>
					<Card>
						<CardHeader
							className={cn(
								"flex flex-row items-center justify-between space-y-0",
								"pb-2",
								"text-muted-foreground",
							)}
						>
							<CardTitle className="font-medium text-sm">
								{stat.title}
							</CardTitle>
							<stat.icon className="h-4 w-4" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">{stat.value}</div>
							<p className="text-muted-foreground text-xs">
								{stat.description}
							</p>
						</CardContent>
					</Card>
				</motion.div>
			))}
		</div>
	);
}
