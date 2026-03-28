"use client";

import { Scale } from "lucide-react";
import { motion } from "motion/react";
import { Cell, Pie, PieChart } from "recharts";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "~/components/ui/chart";

interface LicenseBreakdownProps {
	data: Array<{
		license: string;
		count: number;
	}>;
}

const chartColors = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
];

export function LicenseBreakdown({ data }: LicenseBreakdownProps) {
	const chartData = data.map((item, index) => ({
		...item,
		fill: chartColors[index % chartColors.length],
	}));

	const total = data.reduce((sum, d) => sum + d.count, 0);

	const chartConfig = {
		licenses: {
			label: "Licenses",
		},
	} as Record<string, { label: string; color?: string }>;

	data.forEach((item, index) => {
		chartConfig[item.license] = {
			label: item.license,
			color: chartColors[index % chartColors.length],
		};
	});

	return (
		<div className="grid grid-cols-1 gap-0 md:grid-cols-2">
			{/* Chart */}
			<div className="border-border border-r p-6">
				<div className="mb-6 flex items-center gap-2">
					<Scale className="h-4 w-4 text-muted-foreground" />
					<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
						License Distribution
					</span>
				</div>

				<motion.div
					animate={{ opacity: 1, scale: 1 }}
					className="flex justify-center"
					initial={{ opacity: 0, scale: 0.9 }}
					transition={{ duration: 0.5 }}
				>
					<ChartContainer
						className="mx-auto aspect-square max-h-[240px]"
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
								innerRadius={50}
								nameKey="license"
								strokeWidth={2}
							>
								{chartData.map((entry) => (
									<Cell fill={entry.fill} key={entry.license} />
								))}
							</Pie>
						</PieChart>
					</ChartContainer>
				</motion.div>
			</div>

			{/* Legend */}
			<div className="p-6">
				<div className="mb-6">
					<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
						Breakdown
					</span>
				</div>

				<div className="space-y-0">
					{data.map((item, index) => {
						const pct =
							total > 0 ? ((item.count / total) * 100).toFixed(1) : "0.0";
						return (
							<motion.div
								animate={{ opacity: 1, x: 0 }}
								className="flex items-center border-border border-b py-3 transition-colors last:border-b-0 hover:bg-muted/20"
								initial={{ opacity: 0, x: 10 }}
								key={item.license}
								transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
							>
								<span
									className="mr-3 h-3 w-3 shrink-0"
									style={{
										backgroundColor: chartColors[index % chartColors.length],
									}}
								/>
								<span className="flex-1 truncate font-mono text-foreground text-sm">
									{item.license}
								</span>
								<span className="w-12 text-right font-mono text-muted-foreground text-sm tabular-nums">
									{item.count}
								</span>
								<span className="w-16 text-right font-mono text-muted-foreground text-xs tabular-nums">
									{pct}%
								</span>
							</motion.div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
