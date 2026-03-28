"use client";

import { PieChartIcon } from "lucide-react";
import { motion } from "motion/react";
import { Cell, Pie, PieChart } from "recharts";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "~/components/ui/chart";

interface LocByLanguageProps {
	data: Array<{
		language: string;
		totalLines: number;
		repoCount: number;
	}>;
}

const languageColors = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
	"color-mix(in srgb, var(--chart-1), white 30%)",
	"color-mix(in srgb, var(--chart-2), white 30%)",
	"color-mix(in srgb, var(--chart-3), white 30%)",
];

export function LocByLanguage({ data }: LocByLanguageProps) {
	const chartData = data.slice(0, 8).map((item, index) => ({
		name: item.language,
		value: item.totalLines,
		fill: languageColors[index % languageColors.length],
	}));

	const total = data.reduce((sum, d) => sum + d.totalLines, 0);

	const chartConfig: Record<string, { label: string; color?: string }> = {
		value: {
			label: "Lines of Code",
		},
	};

	data.slice(0, 8).forEach((item, index) => {
		chartConfig[item.language] = {
			label: item.language,
			color: languageColors[index % languageColors.length],
		};
	});

	return (
		<div className="p-6">
			<div className="mb-6 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<PieChartIcon className="h-4 w-4 text-muted-foreground" />
					<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
						Lines of Code by Language
					</span>
				</div>
				<span className="font-mono text-muted-foreground text-xs">
					{(total / 1_000_000).toFixed(1)}M total LOC
				</span>
			</div>

			<div className="flex flex-col items-center gap-6 sm:flex-row">
				<motion.div
					animate={{ opacity: 1, scale: 1 }}
					className="shrink-0"
					initial={{ opacity: 0, scale: 0.9 }}
					transition={{ duration: 0.5 }}
				>
					<ChartContainer
						className="aspect-square max-h-[220px]"
						config={chartConfig}
					>
						<PieChart>
							<ChartTooltip
								content={<ChartTooltipContent hideLabel />}
								cursor={false}
							/>
							<Pie
								data={chartData}
								dataKey="value"
								innerRadius={50}
								nameKey="name"
								strokeWidth={2}
							>
								{chartData.map((entry) => (
									<Cell fill={entry.fill} key={entry.name} />
								))}
							</Pie>
						</PieChart>
					</ChartContainer>
				</motion.div>

				{/* Legend with percentages */}
				<div className="flex-1 space-y-2">
					{data.slice(0, 6).map((item, index) => {
						const pct =
							total > 0 ? ((item.totalLines / total) * 100).toFixed(1) : "0";
						return (
							<motion.div
								animate={{ opacity: 1, x: 0 }}
								className="flex items-center justify-between"
								initial={{ opacity: 0, x: 10 }}
								key={item.language}
								transition={{ delay: 0.2 + index * 0.04, duration: 0.3 }}
							>
								<div className="flex items-center gap-2">
									<span
										className="h-3 w-3"
										style={{
											backgroundColor:
												languageColors[index % languageColors.length],
										}}
									/>
									<span className="font-mono text-foreground text-xs">
										{item.language}
									</span>
								</div>
								<div className="flex items-center gap-3">
									<span className="font-mono text-muted-foreground text-xs tabular-nums">
										{Math.round(item.totalLines / 1000)}K
									</span>
									<span className="w-12 text-right font-mono text-[10px] text-muted-foreground tabular-nums">
										{pct}%
									</span>
								</div>
							</motion.div>
						);
					})}
				</div>
			</div>

			{/* Repo count per language */}
			<div className="mt-6 border-border border-t pt-4">
				<div className="flex border-border border-b py-2 font-mono text-muted-foreground text-xs uppercase tracking-wider">
					<span className="flex-1">Language</span>
					<span className="w-20 text-right">Repos</span>
					<span className="hidden w-24 text-right sm:block">Avg LOC/Repo</span>
				</div>
				{data.slice(0, 5).map((item, index) => (
					<motion.div
						animate={{ opacity: 1 }}
						className="flex border-border border-b py-2 transition-colors last:border-b-0 hover:bg-muted/20"
						initial={{ opacity: 0 }}
						key={item.language}
						transition={{ delay: 0.4 + index * 0.03, duration: 0.2 }}
					>
						<span className="flex-1 truncate font-mono text-foreground text-sm">
							{item.language}
						</span>
						<span className="w-20 text-right font-mono text-muted-foreground text-sm tabular-nums">
							{item.repoCount}
						</span>
						<span className="hidden w-24 text-right font-mono text-muted-foreground text-sm tabular-nums sm:block">
							{item.repoCount > 0
								? Math.round(item.totalLines / item.repoCount).toLocaleString(
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
