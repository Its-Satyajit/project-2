"use client";

import { BarChart3 } from "lucide-react";
import { motion } from "motion/react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "~/components/ui/chart";

interface StarDistributionProps {
	data: Array<{
		range: string;
		count: number;
	}>;
}

export function StarDistribution({ data }: StarDistributionProps) {
	const chartConfig = {
		count: {
			label: "Repositories",
			color: "var(--chart-3)",
		},
	} satisfies Record<string, { label: string; color?: string }>;

	const total = data.reduce((sum, d) => sum + d.count, 0);

	return (
		<div className="p-6">
			<div className="mb-6 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<BarChart3 className="h-4 w-4 text-muted-foreground" />
					<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
						Stars Distribution
					</span>
				</div>
				<span className="font-mono text-muted-foreground text-xs">
					{total.toLocaleString("en-US")} repos
				</span>
			</div>

			<motion.div
				animate={{ opacity: 1 }}
				initial={{ opacity: 0 }}
				transition={{ duration: 0.5 }}
			>
				<ChartContainer
					className="aspect-[2/1] max-h-[200px]"
					config={chartConfig}
				>
					<BarChart
						data={data}
						margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
					>
						<XAxis
							axisLine={false}
							dataKey="range"
							fontSize={10}
							tickLine={false}
						/>
						<YAxis axisLine={false} fontSize={10} tickLine={false} width={40} />
						<ChartTooltip content={<ChartTooltipContent />} cursor={false} />
						<Bar dataKey="count" fill="var(--chart-3)" radius={[2, 2, 0, 0]} />
					</BarChart>
				</ChartContainer>
			</motion.div>

			{/* Legend */}
			<div className="mt-4 flex flex-wrap gap-3">
				{data.map((item, index) => {
					const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : "0";
					return (
						<span className="flex items-center gap-1.5" key={item.range}>
							<span
								className="h-2 w-2"
								style={{
									backgroundColor: "var(--chart-3)",
									opacity: 1 - index * 0.15,
								}}
							/>
							<span className="font-mono text-muted-foreground text-xs">
								{item.range}: {pct}%
							</span>
						</span>
					);
				})}
			</div>
		</div>
	);
}
