"use client";

import { BarChart3 } from "lucide-react";
import { motion } from "motion/react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "~/components/ui/chart";

interface LanguageLocVsFilesProps {
	data: Array<{
		language: string;
		loc: number;
		files: number;
		repos: number;
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
	Unknown: "#888888",
};

function getColor(language: string): string {
	return languageColors[language] || "var(--chart-1)";
}

export function LanguageLocVsFiles({ data }: LanguageLocVsFilesProps) {
	const chartData = data
		.filter((d) => d.language !== "Unknown")
		.slice(0, 10)
		.map((item) => ({
			name: item.language,
			loc: Math.round(item.loc / 1000),
			files: item.files,
			repos: item.repos,
		}));

	const chartConfig = {
		loc: {
			label: "Lines of Code (K)",
			color: "var(--chart-1)",
		},
		files: {
			label: "Files",
			color: "var(--chart-2)",
		},
	} satisfies Record<string, { label: string; color?: string }>;

	return (
		<div className="p-6">
			<div className="mb-6 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<BarChart3 className="h-4 w-4 text-muted-foreground" />
					<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
						LOC vs Files by Language
					</span>
				</div>
				<span className="font-mono text-muted-foreground text-xs">
					Top {chartData.length} Languages
				</span>
			</div>

			<motion.div
				animate={{ opacity: 1 }}
				initial={{ opacity: 0 }}
				transition={{ duration: 0.5 }}
			>
				<ChartContainer
					className="aspect-[2/1] max-h-[300px]"
					config={chartConfig}
				>
					<BarChart
						data={chartData}
						margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
					>
						<XAxis
							axisLine={false}
							dataKey="name"
							fontSize={10}
							tickLine={false}
						/>
						<YAxis axisLine={false} fontSize={10} tickLine={false} width={50} />
						<ChartTooltip content={<ChartTooltipContent />} cursor={false} />
						<Bar
							dataKey="loc"
							fill="var(--chart-1)"
							name="LOC (K)"
							radius={[2, 2, 0, 0]}
						/>
					</BarChart>
				</ChartContainer>
			</motion.div>

			{/* Scatter-like view */}
			<div className="mt-6 border-border border-t pt-4">
				<div className="flex border-border border-b py-2 font-mono text-muted-foreground text-xs uppercase tracking-wider">
					<span className="flex-1">Language</span>
					<span className="w-20 text-right">LOC (K)</span>
					<span className="w-20 text-right">Files</span>
					<span className="w-16 text-right">Repos</span>
					<span className="hidden w-20 text-right sm:block">Avg LOC/File</span>
				</div>
				{data.slice(0, 8).map((item, index) => {
					const avgLocPerFile =
						item.files > 0 ? Math.round(item.loc / item.files) : 0;
					return (
						<motion.div
							animate={{ opacity: 1 }}
							className="flex items-center border-border border-b py-2.5 transition-colors last:border-b-0 hover:bg-muted/20"
							initial={{ opacity: 0 }}
							key={item.language}
							transition={{ delay: 0.1 + index * 0.03, duration: 0.2 }}
						>
							<span className="min-w-0 flex-1">
								<span
									className="mr-2 inline-block h-2 w-2 rounded-full"
									style={{ backgroundColor: getColor(item.language) }}
								/>
								<span className="truncate font-mono text-foreground text-sm">
									{item.language}
								</span>
							</span>
							<span className="w-20 text-right font-mono text-muted-foreground text-sm tabular-nums">
								{Math.round(item.loc / 1000)}K
							</span>
							<span className="w-20 text-right font-mono text-muted-foreground text-sm tabular-nums">
								{item.files.toLocaleString("en-US")}
							</span>
							<span className="w-16 text-right font-mono text-muted-foreground text-sm tabular-nums">
								{item.repos}
							</span>
							<span className="hidden w-20 text-right font-mono text-muted-foreground text-sm tabular-nums sm:block">
								{avgLocPerFile}
							</span>
						</motion.div>
					);
				})}
			</div>
		</div>
	);
}
