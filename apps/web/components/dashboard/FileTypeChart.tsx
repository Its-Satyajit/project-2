"use client";

import { memo } from "react";
import type { LabelProps } from "recharts";
import { Label, Pie, PieChart } from "recharts";
import type { ChartConfig } from "~/components/ui/chart";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "~/components/ui/chart";

interface FileTypeChartProps {
	data: Record<string, number>;
}

// Architectural palette
const CHART_COLORS = [
	"var(--color-primary)",
	"var(--color-accent)",
	"#3d5a99",
	"#c4953a",
	"#5a7d5a",
	"#6b6d7a",
	"#5a7ec2",
	"#7a7c88",
];

export const FileTypeChart = memo(function FileTypeChart({
	data,
}: FileTypeChartProps) {
	const chartData = Object.entries(data)
		.map(([name, value], index) => ({
			name,
			value,
			fill: CHART_COLORS[index % CHART_COLORS.length],
		}))
		.sort((a, b) => b.value - a.value);

	const chartConfig = Object.keys(data).reduce((acc, key, index) => {
		acc[key] = {
			label: key.toUpperCase(),
			color: CHART_COLORS[index % CHART_COLORS.length],
		};
		return acc;
	}, {} as ChartConfig);

	const totalFiles = Object.values(data).reduce((acc, curr) => acc + curr, 0);

	return (
		<div className="flex flex-col">
			{/* Header */}
			<div className="mb-4 flex items-center justify-between">
				<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
					File Types
				</span>
				<span className="font-(family-name:--font-display) text-2xl text-foreground">
					{totalFiles.toLocaleString()}
				</span>
			</div>

			{/* Chart */}
			<div className="flex justify-center">
				<ChartContainer
					className="mx-auto aspect-square max-h-48"
					config={chartConfig}
				>
					<PieChart>
						<ChartTooltip
							content={
								<ChartTooltipContent className="border border-border bg-background" />
							}
							cursor={false}
						/>
						<Pie
							data={chartData}
							dataKey="value"
							innerRadius={40}
							nameKey="name"
							stroke="var(--color-background)"
							strokeWidth={1}
						>
							<Label
								content={({ viewBox }: LabelProps) => {
									if (viewBox && "cx" in viewBox && "cy" in viewBox) {
										return (
											<text
												dominantBaseline="middle"
												textAnchor="middle"
												x={viewBox.cx}
												y={viewBox.cy}
											>
												<tspan
													className="font-(family-name:--font-display) fill-foreground text-2xl"
													x={viewBox.cx}
													y={viewBox.cy}
												>
													{totalFiles.toLocaleString()}
												</tspan>
												<tspan
													className="fill-muted-foreground"
													style={{ fontSize: "8px" }}
													x={viewBox.cx}
													y={(viewBox.cy || 0) + 16}
												>
													FILES
												</tspan>
											</text>
										);
									}
								}}
							/>
						</Pie>
					</PieChart>
				</ChartContainer>
			</div>

			{/* Legend - minimal list */}
			<div className="mt-4 space-y-1.5">
				{chartData.slice(0, 6).map((entry) => (
					<div className="flex items-center justify-between" key={entry.name}>
						<div className="flex items-center gap-2">
							<div
								className="h-2 w-2"
								style={{ backgroundColor: entry.fill }}
							/>
							<span className="font-mono text-muted-foreground text-xs uppercase">
								{entry.name}
							</span>
						</div>
						<span className="font-mono text-foreground text-xs tabular-nums">
							{entry.value}
						</span>
					</div>
				))}
			</div>
		</div>
	);
});
