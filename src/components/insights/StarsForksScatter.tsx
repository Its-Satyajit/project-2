"use client";

import {
	Check,
	ChevronDown,
	Filter,
	ScatterChart as ScatterIcon,
	Search,
	X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
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
	const [isOpen, setIsOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const dropdownRef = useRef<HTMLDivElement>(null);

	const chartConfig = {} satisfies Record<
		string,
		{ label: string; color?: string }
	>;

	const searchableData = data.filter(
		(d) =>
			!search ||
			d.name.toLowerCase().includes(search.toLowerCase()) ||
			d.owner.toLowerCase().includes(search.toLowerCase()),
	);

	const filteredData =
		selected.size > 0
			? data.filter((d) => selected.has(`${d.owner}/${d.name}`))
			: searchableData;

	const languages = [
		...new Set(filteredData.map((d) => d.language).filter(Boolean)),
	];

	const toggleSelect = (repo: string) => {
		const newSelected = new Set(selected);
		if (newSelected.has(repo)) {
			newSelected.delete(repo);
		} else {
			newSelected.add(repo);
		}
		setSelected(newSelected);
	};

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<div className="p-6">
			<div className="mb-6 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<ScatterIcon className="h-4 w-4 text-muted-foreground" />
					<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
						Forks vs Stars
					</span>
					{selected.size > 0 && (
						<span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[10px] text-accent">
							{selected.size} selected
						</span>
					)}
				</div>

				<div className="relative" ref={dropdownRef}>
					<button
						className={`flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 font-mono text-xs transition-all hover:border-accent/50 ${
							isOpen ? "border-accent ring-1 ring-accent/20" : ""
						}`}
						onClick={() => setIsOpen(!isOpen)}
						type="button"
					>
						<Filter className="h-3 w-3 text-muted-foreground" />
						<span className="text-foreground">
							{selected.size > 0 ? `${selected.size} repos` : "Filter repos"}
						</span>
						<ChevronDown
							className={`h-3 w-3 text-muted-foreground transition-transform ${
								isOpen ? "rotate-180" : ""
							}`}
						/>
					</button>

					<AnimatePresence>
						{isOpen && (
							<motion.div
								animate={{ opacity: 1, y: 0 }}
								className="absolute top-full right-0 z-50 mt-2 w-72 rounded-lg border border-border bg-card shadow-xl"
								exit={{ opacity: 0, y: -8 }}
								initial={{ opacity: 0, y: -8 }}
								transition={{ duration: 0.15 }}
							>
								<div className="border-border border-b p-2">
									<div className="relative">
										<Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
										<input
											autoFocus
											className="w-full rounded-md border border-border bg-background py-2 pr-8 pl-9 font-mono text-foreground text-xs placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
											onChange={(e) => setSearch(e.target.value)}
											placeholder="Search repositories..."
											type="text"
											value={search}
										/>
										{search && (
											<button
												className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
												onClick={() => setSearch("")}
												type="button"
											>
												<X className="h-3.5 w-3.5" />
											</button>
										)}
									</div>
								</div>

								<div className="max-h-64 overflow-y-auto p-1">
									{searchableData.length === 0 ? (
										<div className="p-3 text-center font-mono text-muted-foreground text-xs">
											No repos found
										</div>
									) : (
										searchableData.slice(0, 15).map((item) => {
											const repo = `${item.owner}/${item.name}`;
											const isSelected = selected.has(repo);
											return (
												<button
													className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors ${
														isSelected ? "bg-accent/10" : "hover:bg-muted"
													}`}
													key={repo}
													onClick={() => toggleSelect(repo)}
													type="button"
												>
													<span
														className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
															isSelected
																? "border-accent bg-accent"
																: "border-border"
														}`}
													>
														{isSelected && (
															<Check className="h-2.5 w-2.5 text-accent-foreground" />
														)}
													</span>
													<div className="min-w-0 flex-1">
														<span className="block truncate font-mono text-foreground text-xs">
															{repo}
														</span>
														<span className="font-mono text-[10px] text-muted-foreground">
															{item.language || "Unknown"}
														</span>
													</div>
													<span className="shrink-0 font-mono text-[10px] text-muted-foreground">
														{item.stars.toLocaleString()} ★
													</span>
												</button>
											);
										})
									)}
								</div>

								{selected.size > 0 && (
									<div className="border-border border-t p-2">
										<button
											className="flex w-full items-center justify-center gap-2 rounded-md bg-muted py-2 font-mono text-foreground text-xs transition-colors hover:bg-muted/80"
											onClick={() => {
												setSelected(new Set());
												setSearch("");
											}}
											type="button"
										>
											<X className="h-3 w-3" />
											Clear selection
										</button>
									</div>
								)}
							</motion.div>
						)}
					</AnimatePresence>
				</div>
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
								dataKey="forks"
								fontSize={10}
								name="Forks"
								tickLine={false}
								type="number"
							/>
							<YAxis
								axisLine={false}
								dataKey="stars"
								fontSize={10}
								name="Stars"
								tickLine={false}
								type="number"
							/>
							<ZAxis dataKey="stars" range={[30, 200]} />
							<ChartTooltip
								content={({ active, payload }) => {
									if (active && payload?.length && payload[0]?.payload) {
										const item = payload[0].payload;
										return (
											<div className="rounded-lg border border-border bg-card p-3 shadow-lg">
												<p className="font-medium font-mono text-foreground text-xs">
													{item.owner}/{item.name}
												</p>
												<p className="mt-1 font-mono text-muted-foreground text-xs">
													{item.stars.toLocaleString("en-US")} stars
												</p>
												<p className="font-mono text-muted-foreground text-xs">
													{item.forks.toLocaleString("en-US")} forks
												</p>
												{item.language && (
													<p className="font-mono text-[10px] text-muted-foreground">
														{item.language}
													</p>
												)}
											</div>
										);
									}
									return null;
								}}
								cursor={false}
							/>
							{filteredData.map((item) => (
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
