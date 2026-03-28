"use client";

import { FileCode2 } from "lucide-react";
import { motion } from "motion/react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "~/components/ui/chart";

interface FilesByLanguageProps {
	data: Array<{
		language: string;
		count: number;
		totalLines: number;
	}>;
}

export function FilesByLanguage({ data }: FilesByLanguageProps) {
	const chartData = data.slice(0, 8).map((item) => ({
		name: item.language,
		repos: item.count,
		lines: Math.round(item.totalLines / 1000),
	}));

	const chartConfig = {
		repos: {
			label: "Repositories",
			color: "var(--chart-1)",
		},
		lines: {
			label: "Lines (K)",
			color: "var(--chart-2)",
		},
	} satisfies Record<string, { label: string; color?: string }>;

	return (
		<div className="p-6">
			<div className="mb-6 flex items-center gap-2">
				<FileCode2 className="h-4 w-4 text-muted-foreground" />
				<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
					Repositories by Language
				</span>
			</div>

			<motion.div
				animate={{ opacity: 1 }}
				initial={{ opacity: 0 }}
				transition={{ duration: 0.5, delay: 0.2 }}
			>
				<ChartContainer
					className="aspect-[2/1] max-h-[280px]"
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
						<YAxis axisLine={false} fontSize={10} tickLine={false} width={40} />
						<ChartTooltip content={<ChartTooltipContent />} cursor={false} />
						<Bar dataKey="repos" fill="var(--chart-1)" radius={[2, 2, 0, 0]} />
					</BarChart>
				</ChartContainer>
			</motion.div>

			{/* Summary Table */}
			<div className="mt-6 border-border border-t pt-4">
				<div className="flex border-border border-b py-2 font-mono text-muted-foreground text-xs uppercase tracking-wider">
					<span className="flex-1">Language</span>
					<span className="w-20 text-right">Repos</span>
					<span className="hidden w-24 text-right sm:block">Total LOC</span>
					<span className="hidden w-20 text-right md:block">Avg LOC/Repo</span>
				</div>
				{data.slice(0, 6).map((item, index) => (
					<motion.div
						animate={{ opacity: 1, x: 0 }}
						className="flex border-border border-b py-2.5 transition-colors last:border-b-0 hover:bg-muted/20"
						initial={{ opacity: 0, x: -10 }}
						key={item.language}
						transition={{ delay: 0.3 + index * 0.03, duration: 0.2 }}
					>
						<span className="flex-1 truncate font-mono text-foreground text-sm">
							{item.language}
						</span>
						<span className="w-20 text-right font-mono text-muted-foreground text-sm tabular-nums">
							{item.count}
						</span>
						<span className="hidden w-24 text-right font-mono text-muted-foreground text-sm tabular-nums sm:block">
							{Math.round(item.totalLines / 1000)}K
						</span>
						<span className="hidden w-20 text-right font-mono text-muted-foreground text-sm tabular-nums md:block">
							{item.count > 0
								? Math.round(item.totalLines / item.count).toLocaleString(
										"en-US",
									)
								: 0}
						</span>
					</motion.div>
				))}
			</div>
		</div>
	);
}
