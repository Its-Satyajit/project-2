"use client";

import { TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Area, AreaChart, XAxis, YAxis } from "recharts";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "~/components/ui/chart";

interface GrowthTimelineProps {
	data: Array<{
		date: string;
		count: number;
	}>;
}

type TimeScale = "daily" | "weekly" | "monthly";

function aggregateData(
	data: Array<{ date: string; count: number }>,
	scale: TimeScale,
) {
	if (scale === "daily") return data;

	const grouped = new Map<string, number>();

	data.forEach((item) => {
		const d = new Date(item.date);
		let key: string;
		if (scale === "weekly") {
			const weekStart = new Date(d);
			weekStart.setDate(d.getDate() - d.getDay());
			key =
				weekStart.toISOString().split("T")[0] ??
				weekStart.toISOString().slice(0, 10);
		} else {
			key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
		}
		grouped.set(key, (grouped.get(key) || 0) + item.count);
	});

	return Array.from(grouped.entries())
		.map(([date, count]) => ({ date, count }))
		.sort((a, b) => a.date.localeCompare(b.date));
}

export function GrowthTimeline({ data }: GrowthTimelineProps) {
	const [timeScale, setTimeScale] = useState<TimeScale>("daily");
	const [limit, setLimit] = useState(50);

	const aggregatedData = aggregateData(data, timeScale);
	const displayData =
		aggregatedData.length > limit
			? aggregatedData.slice(-limit)
			: aggregatedData;

	const chartData = displayData.map((item) => {
		const d = new Date(item.date);
		let label: string;
		if (timeScale === "daily") {
			label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
		} else if (timeScale === "weekly") {
			label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
		} else {
			label = d.toLocaleDateString("en-US", {
				month: "short",
				year: "2-digit",
			});
		}
		return { ...item, label };
	});

	const chartConfig = {
		count: {
			label: "Repositories",
			color: "var(--chart-2)",
		},
	} satisfies Record<string, { label: string; color?: string }>;

	return (
		<div className="p-6">
			<div className="mb-6 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<TrendingUp className="h-4 w-4 text-muted-foreground" />
					<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
						Growth Timeline
					</span>
				</div>
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-1">
						{(["daily", "weekly", "monthly"] as TimeScale[]).map((scale) => (
							<button
								className={`rounded px-2 py-1 font-mono text-[10px] transition-colors ${
									timeScale === scale
										? "bg-foreground text-background"
										: "text-muted-foreground hover:text-foreground"
								}`}
								key={scale}
								onClick={() => setTimeScale(scale)}
								type="button"
							>
								{scale}
							</button>
						))}
					</div>
					<span className="text-muted-foreground">|</span>
					<select
						className="bg-transparent font-mono text-[10px] text-foreground focus:outline-none"
						onChange={(e) => setLimit(Number(e.target.value))}
						value={limit}
					>
						<option value={25}>25</option>
						<option value={50}>50</option>
						<option value={100}>100</option>
						<option value={0}>All</option>
					</select>
				</div>
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
