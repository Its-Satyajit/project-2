"use client";

import { ScatterChart as ScatterIcon } from "lucide-react";
import { motion } from "motion/react";
import { Scatter, ScatterChart, XAxis, YAxis, ZAxis } from "recharts";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "~/components/ui/chart";

interface StarsForksScatterProps {
	data: Array<{
		name: string;
		owner: string;
		stars: number;
		forks: number;
		language: string | null;
	}>;
}

const languageColors: Record<string, string> = {
	TypeScript: "#3178c6",
	JavaScript: "#f7df1e",
	Python: "#3776ab",
	Rust: "#dea584",
	Go: "#00add8",
	Java: "#b07219",
	Ruby: "#cc342d",
	"Objective-C": "#438eff",
	Swift: "#f05138",
	C: "#555555",
	"C++": "#f34b7d",
	PHP: "#4f5d95",
};

function getColor(language: string | null): string {
	if (!language) return "var(--muted-foreground)";
	return languageColors[language] || "var(--chart-1)";
}

export function StarsForksScatter({ data }: StarsForksScatterProps) {
	const chartConfig = {} satisfies Record<
		string,
		{ label: string; color?: string }
	>;

	// Get unique languages for legend
	const languages = [...new Set(data.map((d) => d.language).filter(Boolean))];

	return (
		<div className="p-6">
			<div className="mb-6 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<ScatterIcon className="h-4 w-4 text-muted-foreground" />
					<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
						Stars vs Forks
					</span>
				</div>
				<span className="font-mono text-muted-foreground text-xs">
					Top {data.length} Repos
				</span>
			</div>

			<motion.div
				animate={{ opacity: 1 }}
				initial={{ opacity: 0 }}
				transition={{ duration: 0.5 }}
			>
				<div className="h-[300px] w-full">
					<ChartContainer className="h-full w-full" config={chartConfig}>
						<ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
							<XAxis
								axisLine={false}
								dataKey="stars"
								fontSize={10}
								name="Stars"
								tickLine={false}
								type="number"
							/>
							<YAxis
								axisLine={false}
								dataKey="forks"
								fontSize={10}
								name="Forks"
								tickLine={false}
								type="number"
							/>
							<ZAxis dataKey="stars" range={[30, 200]} />
							<ChartTooltip
								content={({ active, payload }) => {
									if (active && payload?.length && payload[0]?.payload) {
										const data = payload[0].payload;
										return (
											<div className="border border-border bg-card p-3 shadow-lg">
												<p className="font-medium font-mono text-foreground text-xs">
													{data.owner}/{data.name}
												</p>
												<p className="mt-1 font-mono text-muted-foreground text-xs">
													{data.stars.toLocaleString("en-US")} stars
												</p>
												<p className="font-mono text-muted-foreground text-xs">
													{data.forks.toLocaleString("en-US")} forks
												</p>
												{data.language && (
													<p className="font-mono text-[10px] text-muted-foreground">
														{data.language}
													</p>
												)}
											</div>
										);
									}
									return null;
								}}
								cursor={false}
							/>
							{data.map((item) => (
								<Scatter
									data={[item]}
									fill={getColor(item.language)}
									key={`${item.owner}/${item.name}`}
									name={`${item.owner}/${item.name}`}
								/>
							))}
						</ScatterChart>
					</ChartContainer>
				</div>
			</motion.div>

			{/* Language Legend */}
			<div className="mt-4 flex flex-wrap gap-3">
				{languages.map((lang) => (
					<span className="flex items-center gap-1.5" key={lang}>
						<span
							className="h-2 w-2 rounded-full"
							style={{ backgroundColor: getColor(lang) }}
						/>
						<span className="font-mono text-muted-foreground text-xs">
							{lang}
						</span>
					</span>
				))}
			</div>
		</div>
	);
}
