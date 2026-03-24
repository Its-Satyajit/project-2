"use client";

import { memo } from "react";
import { Label, Pie, PieChart } from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "~/components/ui/chart";
import { cn } from "~/lib/utils";

interface FileTypeChartProps {
	data: Record<string, number>;
}

export const FileTypeChart = memo(function FileTypeChart({
	data,
}: FileTypeChartProps) {
	const chartData = Object.entries(data)
		.map(([name, value]) => ({
			name,
			value,
			fill: `var(--color-${name}, var(--color-default))`,
		}))
		.sort((a, b) => b.value - a.value);

	const chartConfig = Object.keys(data).reduce((acc, key, index) => {
		acc[key] = {
			label: key.toUpperCase(),
			color: `hsl(var(--chart-${(index % 5) + 1}))`,
		};
		return acc;
	}, {} as ChartConfig);

	const totalFiles = Object.values(data).reduce((acc, curr) => acc + curr, 0);

	return (
		<Card className="flex flex-col border-white/10 bg-white/[0.02] shadow-sm">
			<CardHeader className="items-center pb-0">
				<CardTitle className="text-white">File Type Distribution</CardTitle>
				<CardDescription className="text-white/50">
					Breakdown by extension
				</CardDescription>
			</CardHeader>
			<CardContent className="flex-1 pb-0">
				<ChartContainer
					className="mx-auto aspect-square max-h-62.5"
					config={chartConfig}
				>
					<PieChart>
						<ChartTooltip
							content={
								<ChartTooltipContent className="border-zinc-700 bg-zinc-900" />
							}
							cursor={false}
						/>
						<Pie
							data={chartData}
							dataKey="value"
							innerRadius={60}
							nameKey="name"
							strokeWidth={5}
						>
							<Label
								content={({ viewBox }) => {
									if (viewBox && "cx" in viewBox && "cy" in viewBox) {
										return (
											<text
												dominantBaseline="middle"
												textAnchor="middle"
												x={viewBox.cx}
												y={viewBox.cy}
											>
												<tspan
													className={cn("fill-white font-bold text-3xl")}
													x={viewBox.cx}
													y={viewBox.cy}
												>
													{totalFiles.toLocaleString()}
												</tspan>
												<tspan
													className="fill-white/50"
													x={viewBox.cx}
													y={(viewBox.cy || 0) + 24}
												>
													Files
												</tspan>
											</text>
										);
									}
								}}
							/>
						</Pie>
					</PieChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
});
