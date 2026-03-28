"use client";

import { HardDrive } from "lucide-react";
import { motion } from "motion/react";
import { Cell, Pie, PieChart } from "recharts";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "~/components/ui/chart";

interface RepoSizeDistributionProps {
	data: Array<{
		size: string;
		count: number;
	}>;
}

const sizeColors = [
	"#5a7d5a", // Tiny - green
	"#3d5a99", // Small - blue
	"#c4953a", // Medium - amber
	"#d64534", // Large - red
	"#1a1d2e", // Massive - dark
];

export function RepoSizeDistribution({ data }: RepoSizeDistributionProps) {
	const chartData = data.map((item, index) => ({
		...item,
		fill: sizeColors[index % sizeColors.length],
	}));

	const total = data.reduce((sum, d) => sum + d.count, 0);

	const chartConfig: Record<string, { label: string; color?: string }> = {
		size: {
			label: "Size",
		},
	};

	data.forEach((item, index) => {
		chartConfig[item.size] = {
			label: item.size,
			color: sizeColors[index % sizeColors.length],
		};
	});

	return (
		<div className="p-6">
			<div className="mb-6 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<HardDrive className="h-4 w-4 text-muted-foreground" />
					<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
						Repo Size Distribution
					</span>
				</div>
				<span className="font-mono text-muted-foreground text-xs">
					By Lines of Code
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
						className="aspect-square max-h-[200px]"
						config={chartConfig}
					>
						<PieChart>
							<ChartTooltip
								content={<ChartTooltipContent hideLabel />}
								cursor={false}
							/>
							<Pie
								data={chartData}
								dataKey="count"
								innerRadius={40}
								nameKey="size"
								strokeWidth={2}
							>
								{chartData.map((entry) => (
									<Cell fill={entry.fill} key={entry.size} />
								))}
							</Pie>
						</PieChart>
					</ChartContainer>
				</motion.div>

				{/* Legend */}
				<div className="flex-1 space-y-2">
					{data.map((item, index) => {
						const pct =
							total > 0 ? ((item.count / total) * 100).toFixed(1) : "0";
						return (
							<motion.div
								animate={{ opacity: 1, x: 0 }}
								className="flex items-center justify-between"
								initial={{ opacity: 0, x: 10 }}
								key={item.size}
								transition={{ delay: 0.2 + index * 0.05, duration: 0.3 }}
							>
								<div className="flex items-center gap-2">
									<span
										className="h-3 w-3"
										style={{
											backgroundColor: sizeColors[index % sizeColors.length],
										}}
									/>
									<span className="font-mono text-foreground text-xs">
										{item.size}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="font-mono text-muted-foreground text-xs tabular-nums">
										{item.count}
									</span>
									<span className="font-mono text-[10px] text-muted-foreground tabular-nums">
										({pct}%)
									</span>
								</div>
							</motion.div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
