"use client";

import { FolderTree, Layers } from "lucide-react";
import { motion } from "motion/react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "~/components/ui/chart";

interface FilesByLanguageChartProps {
	data: Array<{
		language: string;
		totalFiles: number;
		totalDirs: number;
		repoCount: number;
	}>;
}

export function FilesByLanguageChart({ data }: FilesByLanguageChartProps) {
	const chartData = data.slice(0, 8).map((item) => ({
		name: item.language,
		files: item.totalFiles,
		dirs: item.totalDirs,
	}));

	const chartConfig = {
		files: {
			label: "Files",
			color: "var(--chart-4)",
		},
		dirs: {
			label: "Directories",
			color: "var(--chart-5)",
		},
	} satisfies Record<string, { label: string; color?: string }>;

	const totalFiles = data.reduce((sum, d) => sum + d.totalFiles, 0);
	const totalDirs = data.reduce((sum, d) => sum + d.totalDirs, 0);

	return (
		<div className="p-6">
			<div className="mb-6 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<FolderTree className="h-4 w-4 text-muted-foreground" />
					<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
						Files by Language
					</span>
				</div>
				<div className="flex items-center gap-4 font-mono text-muted-foreground text-xs">
					<span>{totalFiles.toLocaleString("en-US")} files</span>
					<span>{totalDirs.toLocaleString("en-US")} dirs</span>
				</div>
			</div>

			<motion.div
				animate={{ opacity: 1 }}
				initial={{ opacity: 0 }}
				transition={{ duration: 0.5 }}
			>
				<ChartContainer
					className="aspect-[2/1] max-h-[250px]"
					config={chartConfig}
				>
					<BarChart
						data={chartData}
						margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
					>
						<XAxis
							axisLine={false}
							dataKey="name"
							fontSize={10}
							tickLine={false}
						/>
						<YAxis axisLine={false} fontSize={10} tickLine={false} width={50} />
						<ChartTooltip content={<ChartTooltipContent />} cursor={false} />
						<Bar
							dataKey="files"
							fill="var(--chart-4)"
							name="Files"
							radius={[2, 2, 0, 0]}
						/>
					</BarChart>
				</ChartContainer>
			</motion.div>

			{/* Summary table */}
			<div className="mt-6 border-border border-t pt-4">
				<div className="flex border-border border-b py-2 font-mono text-muted-foreground text-xs uppercase tracking-wider">
					<span className="flex-1">Language</span>
					<span className="w-24 text-right">Files</span>
					<span className="hidden w-24 text-right sm:block">Dirs</span>
					<span className="hidden w-20 text-right md:block">Files/Repo</span>
				</div>
				{data.slice(0, 6).map((item, index) => {
					const filesPerRepo =
						item.repoCount > 0
							? Math.round(item.totalFiles / item.repoCount)
							: 0;
					return (
						<motion.div
							animate={{ opacity: 1 }}
							className="flex border-border border-b py-2 transition-colors last:border-b-0 hover:bg-muted/20"
							initial={{ opacity: 0 }}
							key={item.language}
							transition={{ delay: 0.2 + index * 0.03, duration: 0.2 }}
						>
							<span className="flex-1 truncate font-mono text-foreground text-sm">
								{item.language}
							</span>
							<span className="w-24 text-right font-mono text-muted-foreground text-sm tabular-nums">
								{item.totalFiles.toLocaleString("en-US")}
							</span>
							<span className="hidden w-24 text-right font-mono text-muted-foreground text-sm tabular-nums sm:block">
								{item.totalDirs.toLocaleString("en-US")}
							</span>
							<span className="hidden w-20 text-right font-mono text-muted-foreground text-sm tabular-nums md:block">
								{filesPerRepo.toLocaleString("en-US")}
							</span>
						</motion.div>
					);
				})}
			</div>
		</div>
	);
}
