"use client";

import { Code2 } from "lucide-react";
import { motion } from "motion/react";

interface LanguageDistributionProps {
	data: Array<{
		language: string;
		count: number;
		totalLines: number;
	}>;
}

function formatNumber(num: number): string {
	if (num >= 1_000_000) {
		return `${(num / 1_000_000).toFixed(1)}M`;
	}
	if (num >= 1_000) {
		return `${(num / 1_000).toFixed(1)}K`;
	}
	return num.toLocaleString("en-US");
}

const languageColors: Record<string, string> = {
	TypeScript: "bg-blue-500",
	JavaScript: "bg-yellow-500",
	Python: "bg-green-500",
	Rust: "bg-orange-500",
	Go: "bg-cyan-500",
	Java: "bg-red-500",
	"C++": "bg-pink-500",
	C: "bg-gray-500",
	Ruby: "bg-red-600",
	PHP: "bg-indigo-400",
	Swift: "bg-orange-400",
	Kotlin: "bg-purple-500",
	Unknown: "bg-muted",
};

export function LanguageDistribution({ data }: LanguageDistributionProps) {
	const maxCount = Math.max(...data.map((d) => d.count), 1);
	const totalRepos = data.reduce((sum, d) => sum + d.count, 0);

	return (
		<div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
			{/* Bar Chart */}
			<div className="border-border border-r p-6">
				<div className="mb-6 flex items-center gap-2">
					<Code2 className="h-4 w-4 text-muted-foreground" />
					<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
						Language Distribution
					</span>
				</div>

				<div className="space-y-3">
					{data.slice(0, 8).map((item, index) => {
						const percentage = (item.count / maxCount) * 100;
						const colorClass =
							languageColors[item.language] || "bg-muted-foreground";
						return (
							<motion.div
								animate={{ opacity: 1, x: 0 }}
								className="flex items-center gap-3"
								initial={{ opacity: 0, x: -20 }}
								key={item.language}
								transition={{ delay: index * 0.05, duration: 0.3 }}
							>
								<span className="w-24 shrink-0 truncate font-mono text-foreground text-sm">
									{item.language}
								</span>
								<div className="h-5 flex-1 overflow-hidden bg-muted/30">
									<motion.div
										animate={{ width: `${percentage}%` }}
										className={`h-full ${colorClass}`}
										initial={{ width: 0 }}
										transition={{
											delay: index * 0.05,
											duration: 0.5,
											ease: "easeOut",
										}}
									/>
								</div>
								<span className="w-16 shrink-0 text-right font-mono text-muted-foreground text-xs tabular-nums">
									{item.count}
								</span>
							</motion.div>
						);
					})}
				</div>
			</div>

			{/* Table */}
			<div className="p-6">
				<div className="mb-6">
					<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
						Details
					</span>
				</div>

				<div className="space-y-0">
					<div className="flex border-border border-b py-2 font-mono text-muted-foreground text-xs uppercase tracking-wider">
						<span className="flex-1">Language</span>
						<span className="w-16 text-right">Repos</span>
						<span className="w-24 text-right">Lines</span>
						<span className="w-16 text-right">%</span>
					</div>
					{data.slice(0, 10).map((item, index) => {
						const pct =
							totalRepos > 0
								? ((item.count / totalRepos) * 100).toFixed(1)
								: "0.0";
						return (
							<motion.div
								animate={{ opacity: 1 }}
								className="flex border-border border-b py-3 transition-colors last:border-b-0 hover:bg-muted/20"
								initial={{ opacity: 0 }}
								key={item.language}
								transition={{ delay: 0.3 + index * 0.03, duration: 0.3 }}
							>
								<span className="flex-1 truncate font-mono text-foreground text-sm">
									{item.language}
								</span>
								<span className="w-16 text-right font-mono text-muted-foreground text-sm tabular-nums">
									{item.count}
								</span>
								<span className="w-24 text-right font-mono text-muted-foreground text-sm tabular-nums">
									{formatNumber(item.totalLines)}
								</span>
								<span className="w-16 text-right font-mono text-muted-foreground text-sm tabular-nums">
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
