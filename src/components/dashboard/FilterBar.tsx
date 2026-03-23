"use client";

import { motion } from "framer-motion";
import { Check, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";

interface FilterBarProps {
	availableExtensions: string[];
	onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
	selectedExtensions: string[];
	showHotspotsOnly: boolean;
	hotspotThreshold: number;
}

export function FilterBar({
	availableExtensions,
	onFilterChange,
}: FilterBarProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedExtensions, setSelectedExtensions] = useState<string[]>([]);
	const [showHotspotsOnly, setShowHotspotsOnly] = useState(false);
	const [hotspotThreshold, setHotspotThreshold] = useState(0);

	const filteredExtensions = useMemo(() => {
		if (!searchQuery) return availableExtensions.slice(0, 50);
		const query = searchQuery.toLowerCase();
		return availableExtensions
			.filter((ext) => ext.toLowerCase().includes(query))
			.slice(0, 50);
	}, [availableExtensions, searchQuery]);

	const toggleExtension = (ext: string) => {
		setSelectedExtensions((prev) => {
			const next = prev.includes(ext)
				? prev.filter((e) => e !== ext)
				: [...prev, ext];
			return next;
		});
	};

	const clearFilters = () => {
		setSelectedExtensions([]);
		setShowHotspotsOnly(false);
		setHotspotThreshold(0);
	};

	const applyFilters = () => {
		onFilterChange({
			selectedExtensions,
			showHotspotsOnly,
			hotspotThreshold,
		});
	};

	const hasActiveFilters =
		selectedExtensions.length > 0 || showHotspotsOnly || hotspotThreshold > 0;

	return (
		<div className="mb-4 rounded-lg border bg-card p-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
					<span className="font-medium text-sm">Filters</span>
					{hasActiveFilters && (
						<span className="rounded-full bg-primary px-2 py-0.5 text-primary-foreground text-xs">
							Active
						</span>
					)}
				</div>
				<div className="flex gap-2">
					{hasActiveFilters && (
						<Button onClick={clearFilters} size="sm" variant="ghost">
							Clear
						</Button>
					)}
					<Button
						onClick={() => setIsOpen(!isOpen)}
						size="sm"
						variant="outline"
					>
						{isOpen ? "Hide" : "Show"} Filters
					</Button>
				</div>
			</div>

			{isOpen && (
				<motion.div
					animate={{ height: "auto", opacity: 1 }}
					className="mt-4 overflow-hidden"
					exit={{ height: 0, opacity: 0 }}
					initial={{ height: 0, opacity: 0 }}
					transition={{ duration: 0.2 }}
				>
					<div className="grid gap-4 md:grid-cols-2">
						<div>
							<label
								className="mb-2 block font-medium text-sm"
								htmlFor="extension-search"
							>
								File Types
							</label>
							<div className="relative mb-2">
								<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<input
									className="w-full rounded-md border bg-background py-2 pr-4 pl-9 text-sm"
									id="extension-search"
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder="Search extensions..."
									type="text"
									value={searchQuery}
								/>
								{searchQuery && (
									<button
										className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
										onClick={() => setSearchQuery("")}
										type="button"
									>
										<X className="h-4 w-4" />
									</button>
								)}
							</div>
							<div className="flex max-h-40 flex-wrap gap-1 overflow-auto rounded-md border p-2">
								{filteredExtensions.map((ext) => (
									<button
										className={`rounded px-2 py-1 text-xs transition-colors ${
											selectedExtensions.includes(ext)
												? "bg-primary text-primary-foreground"
												: "bg-muted text-muted-foreground hover:text-foreground"
										}`}
										key={ext}
										onClick={() => toggleExtension(ext)}
										type="button"
									>
										{ext}
									</button>
								))}
							</div>
							{selectedExtensions.length > 0 && (
								<p className="mt-1 text-muted-foreground text-xs">
									{selectedExtensions.length} selected
								</p>
							)}
						</div>

						<div>
							<label
								className="mb-2 block font-medium text-sm"
								htmlFor="hotspot-slider"
							>
								Hotspot Filter
							</label>
							<div className="mb-4 flex items-center gap-2">
								<input
									className="h-2 w-full cursor-pointer accent-primary"
									id="hotspot-slider"
									max={100}
									onChange={(e) => setHotspotThreshold(Number(e.target.value))}
									type="range"
									value={hotspotThreshold}
								/>
								<span className="w-12 text-muted-foreground text-sm">
									{hotspotThreshold}%
								</span>
							</div>
							<label className="flex items-center gap-2">
								<input
									checked={showHotspotsOnly}
									className="accent-primary"
									onChange={(e) => setShowHotspotsOnly(e.target.checked)}
									type="checkbox"
								/>
								<span className="text-sm">Show hotspots only</span>
							</label>
						</div>
					</div>

					<div className="mt-4 flex justify-end">
						<Button onClick={applyFilters}>Apply Filters</Button>
					</div>
				</motion.div>
			)}
		</div>
	);
}
