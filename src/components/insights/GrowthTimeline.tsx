"use client";

import { TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { Area, AreaChart, XAxis, YAxis } from "recharts";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "~/components/ui/chart";

interface GrowthTimelineProps {
	data: Array<{
		month: string;
		count: number;
	}>;
}

export function GrowthTimeline({ data }: GrowthTimelineProps) {
	const chartData = data.map((item) => ({
		...item,
		label: new Date(`${item.month}-01`).toLocaleDateString("en-US", {
			month: "short",
			year: "2-digit",
		}),
	}));

	const chartConfig = {
		count: {
			label: "Repositories",
			color: "var(--chart-2)",
		},
	} satisfies Record<string, { label: string; color?: string }>;

	return (
		<div className="p-6">
			<div className="mb-6 flex items-center gap-2">
				<TrendingUp className="h-4 w-4 text-muted-foreground" />
				<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
					Growth Timeline
				</span>
			</div>

			<motion.div
				animate={{ opacity: 1 }}
				initial={{ opacity: 0 }}
				transition={{ duration: 0.5, delay: 0.2 }}
			>
				<div className="h-[200px] w-full">
					<ChartContainer className="h-full w-full" config={chartConfig}>
						<AreaChart
							data={chartData}
							margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
						>
							<defs>
								<linearGradient
									fill="url(#colorCount)"
									id="colorCount"
									x1="0"
									x2="0"
									y1="0"
									y2="1"
								>
									<stop
										offset="5%"
										stopColor="var(--chart-2)"
										stopOpacity={0.3}
									/>
									<stop
										offset="95%"
										stopColor="var(--chart-2)"
										stopOpacity={0}
									/>
								</linearGradient>
							</defs>
							<XAxis
								axisLine={false}
								dataKey="label"
								fontSize={10}
								tickLine={false}
							/>
							<YAxis
								axisLine={false}
								fontSize={10}
								tickLine={false}
								width={30}
							/>
							<ChartTooltip content={<ChartTooltipContent />} cursor={false} />
							<Area
								dataKey="count"
								fill="url(#colorCount)"
								stroke="var(--chart-2)"
								strokeWidth={2}
								type="monotone"
							/>
						</AreaChart>
					</ChartContainer>
				</div>
			</motion.div>
		</div>
	);
}
