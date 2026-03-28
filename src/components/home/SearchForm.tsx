"use client";

import { SiGithub } from "@icons-pack/react-simple-icons";
import { useForm } from "@tanstack/react-form-nextjs";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ArrowRight,
	ExternalLink,
	GitFork,
	Search,
	Star,
	Users,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { api } from "~/lib/eden";
import { useDebounce } from "~/lib/useDebounce";

interface RecentRepo {
	id: string;
	owner: string;
	name: string;
	fullName: string;
	description: string | null;
	primaryLanguage: string | null;
	stars: number | null;
	forks: number | null;
	contributorCount?: number;
}

export function SearchForm() {
	const queryClient = useQueryClient();
	const [isOpen, setIsOpen] = useState(false);
	const [filter, setFilter] = useState("");
	const debouncedFilter = useDebounce(filter, 300);
	const containerRef = useRef<HTMLDivElement>(null);

	// Fetch recent analyzed repos (when not searching)
	const { data: recentRepos = [] } = useQuery<RecentRepo[]>({
		queryKey: ["recent-repos"],
		queryFn: async () => {
			const res = await api.repos.top.get({ query: { limit: 8 } });
			if (res.error) return [];
			return (res.data as RecentRepo[]) || [];
		},
		staleTime: 5 * 60 * 1000,
		enabled: !debouncedFilter,
	});

	// Search repos from DB when filtering (debounced)
	const { data: searchResults = [] } = useQuery<RecentRepo[]>({
		queryKey: ["repo-search", debouncedFilter],
		queryFn: async () => {
			if (debouncedFilter.length < 2) return [];
			const baseUrl =
				typeof window !== "undefined"
					? window.location.origin
					: "http://localhost:3000";
			const res = await fetch(
				`${baseUrl}/api/repos/search?q=${encodeURIComponent(debouncedFilter)}&limit=8`,
			);
			if (!res.ok) return [];
			return (await res.json()) as RecentRepo[];
		},
		staleTime: 60 * 1000,
		enabled: debouncedFilter.length >= 2,
	});

	// Use search results when filtering, otherwise recent repos
	const displayedRepos =
		debouncedFilter.length >= 2 ? searchResults : recentRepos.slice(0, 8);

	const hasMoreResults =
		debouncedFilter.length >= 2 && searchResults.length >= 8;

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const form = useForm({
		defaultValues: {
			githubUrl: "",
		},
		onSubmit: async ({ value }) => {
			setIsOpen(false);
			const res = await api.analyze.post({ githubUrl: value.githubUrl });
			const data = res.data as {
				repoId?: string;
				owner?: string;
				name?: string;
			} | null;
			if (res.error || !data?.repoId) {
				toast.error(
					"Unable to analyze repository. Check the URL and try again.",
				);
				return;
			}
			queryClient.invalidateQueries({ queryKey: ["top-repos"] });
			queryClient.invalidateQueries({ queryKey: ["recent-repos"] });
			if (data.owner && data.name) {
				redirect(`/${data.owner}/${data.name}`);
			}
			redirect(`/dashboard/${data.repoId}`);
		},
	});

	const handleFocus = useCallback(() => {
		if (recentRepos.length > 0) {
			setIsOpen(true);
		}
	}, [recentRepos.length]);

	return (
		<div className="relative" ref={containerRef}>
			<form
				className="relative"
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				<div className="flex items-center border border-foreground/20 bg-card/50 backdrop-blur-sm transition-shadow focus-within:border-foreground/40 focus-within:shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
					<div className="flex shrink-0 items-center pr-3 pl-5 text-muted-foreground/50">
						<Search className="h-5 w-5" />
					</div>
					<form.Field name="githubUrl">
						{(field) => (
							<div className="min-w-0 flex-1">
								<Label className="sr-only" htmlFor={field.name}>
									GitHub URL
								</Label>
								<Input
									className="h-14 truncate border-0 bg-transparent font-mono text-base text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0"
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => {
										field.handleChange(e.target.value);
										setFilter(e.target.value);
										if (e.target.value) setIsOpen(true);
									}}
									onFocus={handleFocus}
									placeholder="github.com/owner/repo"
									value={field.state.value}
								/>
							</div>
						)}
					</form.Field>
					<form.Subscribe
						selector={(state) => [state.canSubmit, state.isSubmitting]}
					>
						{([canSubmit, isSubmitting]) => (
							<Button
								className="mr-2 h-11 bg-foreground px-6 font-mono text-background text-sm uppercase tracking-widest hover:bg-foreground/90"
								disabled={!canSubmit}
								type="submit"
							>
								{isSubmitting ? (
									<span className="flex items-center gap-2">
										<svg
											aria-hidden="true"
											className="h-4 w-4 animate-spin"
											viewBox="0 0 24 24"
										>
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												fill="none"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
											/>
											<path
												className="opacity-75"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
												fill="currentColor"
											/>
										</svg>
										<span>Analyzing</span>
									</span>
								) : (
									<span className="flex items-center gap-2">
										<Zap className="h-4 w-4" />
										<span>Analyze</span>
									</span>
								)}
							</Button>
						)}
					</form.Subscribe>
				</div>

				{/* Dropdown: Recent Analyzed Repos / Search Results */}
				{isOpen && displayedRepos.length > 0 && (
					<div className="absolute top-full right-0 left-0 z-50 mt-2 border border-border bg-background shadow-xl">
						<div className="border-border border-b px-5 py-3">
							<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
								{debouncedFilter.length >= 2
									? "Search Results"
									: "Recently Analyzed"}
							</span>
						</div>
						<div className="max-h-[400px] overflow-y-auto">
							{displayedRepos.map((repo: RecentRepo) => (
								<Link
									className="group flex items-center justify-between border-border border-b px-5 py-4 transition-colors last:border-b-0 hover:bg-secondary/30"
									href={`/${repo.owner}/${repo.name}`}
									key={repo.id}
									onClick={() => setIsOpen(false)}
								>
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<span
												className="font-(family-name:--font-display) truncate text-foreground text-lg transition-colors group-hover:text-accent"
												title={repo.fullName}
											>
												{repo.fullName}
											</span>
											{repo.primaryLanguage && (
												<span className="flex shrink-0 items-center gap-1.5 border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
													<div className="h-1.5 w-1.5 rounded-full bg-accent" />
													{repo.primaryLanguage}
												</span>
											)}
										</div>
										{repo.description && (
											<p className="mt-1 truncate font-sans text-muted-foreground text-sm">
												{repo.description}
											</p>
										)}
									</div>
									<div className="ml-6 flex shrink-0 items-center gap-5">
										{repo.stars != null && repo.stars > 0 && (
											<span className="flex items-center gap-1.5 font-mono text-muted-foreground text-xs tabular-nums">
												<Star className="h-3 w-3" />
												{repo.stars.toLocaleString("en-US")}
											</span>
										)}
										{repo.forks != null && repo.forks > 0 && (
											<span className="flex items-center gap-1.5 font-mono text-muted-foreground text-xs tabular-nums">
												<GitFork className="h-3 w-3" />
												{repo.forks.toLocaleString("en-US")}
											</span>
										)}
										<ArrowRight className="h-4 w-4 text-muted-foreground/0 transition-all group-hover:translate-x-1 group-hover:text-accent" />
									</div>
								</Link>
							))}
						</div>
						{(recentRepos.length >= 8 || hasMoreResults) && (
							<div className="border-border border-t bg-muted/20 px-5 py-2.5">
								{hasMoreResults ? (
									<span className="font-mono text-[10px] text-muted-foreground">
										Showing {displayedRepos.length} results. Press Enter to
										analyze "{debouncedFilter}"
									</span>
								) : (
									<span className="font-mono text-[10px] text-muted-foreground">
										Recently analyzed
									</span>
								)}
							</div>
						)}
					</div>
				)}

				<p className="mt-3 text-center font-mono text-[10px] text-muted-foreground/50 uppercase tracking-wider">
					Supported: github.com, gist.github.com
				</p>
			</form>
		</div>
	);
}
