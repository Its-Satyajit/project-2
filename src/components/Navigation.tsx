"use client";

import {
	Database,
	FileJson,
	GitBranch,
	Home,
	LayoutDashboard,
	ListTodo,
	Moon,
	RefreshCw,
	Sun,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { api } from "~/lib/eden";

export function Navigation() {
	const params = useParams();
	const pathname = usePathname();
	const repoId = params.repoId as string | undefined;
	const isDev = process.env.NODE_ENV === "development";
	const { theme, setTheme } = useTheme();
	const [isPending, startTransition] = React.useTransition();

	const handleAction = async (
		action: string,
		callback: () => Promise<void>,
	) => {
		startTransition(async () => {
			try {
				await callback();
				toast.success(`${action} completed`);
			} catch (error) {
				toast.error(
					`${action} failed: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		});
	};

	const callDebugAction = async (action: string) => {
		if (!repoId) return;
		const res = await api.debug.post({ repoId, action });
		if (res.error) {
			const errorMsg =
				typeof res.error === "object" &&
				res.error !== null &&
				"value" in res.error
					? String(res.error.value)
					: "Debug action failed";
			throw new Error(errorMsg);
		}
		return res.data;
	};

	const triggerAnalysis = async () => {
		if (!repoId) return;
		await handleAction("Trigger analysis", async () => {
			const res = await api.dashboard({ repoId }).get();
			if (
				res.data &&
				typeof res.data === "object" &&
				"owner" in res.data &&
				"name" in res.data
			) {
				const { owner, name } = res.data as { owner: string; name: string };
				const githubUrl = `https://github.com/${owner}/${name}`;
				await api.analyze.post({ githubUrl });
			} else {
				throw new Error("Could not determine repository URL");
			}
		});
	};

	const clearAnalysis = async () => {
		if (!repoId) return;
		if (
			!confirm(
				"Are you sure you want to clear all analysis results? This cannot be undone.",
			)
		) {
			return;
		}
		await handleAction("Clear analysis", async () => {
			await callDebugAction("clear-analysis");
		});
	};

	const resetStatus = async () => {
		if (!repoId) return;
		if (!confirm("Reset repository status to pending?")) {
			return;
		}
		await handleAction("Reset status", async () => {
			await callDebugAction("reset-status");
		});
	};

	const viewDependencyGraph = async () => {
		if (!repoId) return;
		await handleAction("View graph", async () => {
			const res = await api.debug.post({ repoId, action: "inspect-graph" });
			if (res.error) {
				throw new Error("Failed to inspect graph");
			}
			alert(`Dependency Graph Stats:\n${JSON.stringify(res.data, null, 2)}`);
		});
	};

	const resetDatabase = async () => {
		if (!confirm("Are you sure you want to reset the entire database?")) {
			return;
		}
		await handleAction("Reset database", async () => {
			await callDebugAction("reset-database");
		});
	};

	const checkQueueStatus = async () => {
		if (!repoId) return;
		await handleAction("Check queue", async () => {
			await callDebugAction("queue-status");
		});
	};

	return (
		<nav className="fixed top-0 right-0 left-0 z-50 border-border border-b bg-background/80 backdrop-blur-xl">
			<div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
				<div className="flex items-center gap-1">
					<Link
						className="group flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-all hover:bg-accent hover:text-accent-foreground"
						href="/"
					>
						<div className="flex h-6 w-6 items-center justify-center rounded bg-amber-500/10 text-amber-500">
							<Home className="h-3.5 w-3.5" />
						</div>
						<span className="font-medium font-mono text-muted-foreground text-xs uppercase tracking-wider transition-colors group-hover:text-foreground">
							Home
						</span>
					</Link>

					{repoId && (
						<>
							<span className="mx-1 text-muted-foreground">/</span>
							<Link
								className={`group flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-all ${
									pathname === `/dashboard/${repoId}`
										? "bg-accent"
										: "hover:bg-accent"
								}`}
								href={`/dashboard/${repoId}`}
							>
								<div
									className={`flex h-6 w-6 items-center justify-center rounded transition-colors ${
										pathname === `/dashboard/${repoId}`
											? "bg-amber-500/20 text-amber-500"
											: "bg-muted text-muted-foreground group-hover:text-foreground"
									}`}
								>
									<LayoutDashboard className="h-3.5 w-3.5" />
								</div>
								<span
									className={`font-medium font-mono text-xs uppercase tracking-wider transition-colors ${
										pathname === `/dashboard/${repoId}`
											? "text-foreground"
											: "text-muted-foreground group-hover:text-foreground"
									}`}
								>
									Dashboard
								</span>
							</Link>

							<span className="mx-1 text-muted-foreground">/</span>
							<Link
								className={`group flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-all ${
									pathname === `/dashboard/${repoId}/analysis`
										? "bg-accent"
										: "hover:bg-accent"
								}`}
								href={`/dashboard/${repoId}/analysis`}
							>
								<div
									className={`flex h-6 w-6 items-center justify-center rounded transition-colors ${
										pathname === `/dashboard/${repoId}/analysis`
											? "bg-amber-500/20 text-amber-500"
											: "bg-muted text-muted-foreground group-hover:text-foreground"
									}`}
								>
									<GitBranch className="h-3.5 w-3.5" />
								</div>
								<span
									className={`font-medium font-mono text-xs uppercase tracking-wider transition-colors ${
										pathname === `/dashboard/${repoId}/analysis`
											? "text-foreground"
											: "text-muted-foreground group-hover:text-foreground"
									}`}
								>
									Analysis
								</span>
							</Link>
						</>
					)}
				</div>

				<div className="flex items-center gap-4">
					{isDev && repoId && (
						<div className="flex items-center gap-2">
							<div className="mr-2 flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
								<span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 font-bold text-amber-500">
									DEV
								</span>
								<span className="text-muted-foreground">Debug:</span>
							</div>

							<Button
								className="h-7 border-border bg-secondary px-2.5 font-mono text-muted-foreground text-xs uppercase tracking-wider hover:bg-accent hover:text-accent-foreground"
								disabled={isPending}
								onClick={triggerAnalysis}
								size="sm"
								title="Re-run analysis for this repository"
								variant="outline"
							>
								<RefreshCw
									className={`mr-1.5 h-3 w-3 ${isPending ? "animate-spin" : ""}`}
								/>
								Analyze
							</Button>

							<Button
								className="h-7 border-border bg-secondary px-2.5 font-mono text-muted-foreground text-xs uppercase tracking-wider hover:bg-accent hover:text-accent-foreground"
								disabled={isPending}
								onClick={viewDependencyGraph}
								size="sm"
								title="View raw dependency graph JSON"
								variant="outline"
							>
								<FileJson className="mr-1.5 h-3 w-3" />
								Graph
							</Button>

							<Button
								className="h-7 border-border bg-secondary px-2.5 font-mono text-muted-foreground text-xs uppercase tracking-wider hover:bg-accent hover:text-accent-foreground"
								disabled={isPending}
								onClick={clearAnalysis}
								size="sm"
								title="Delete analysis results and reset status"
								variant="outline"
							>
								<Trash2 className="mr-1.5 h-3 w-3" />
								Clear
							</Button>

							<Button
								className="h-7 border-border bg-secondary px-2.5 font-mono text-muted-foreground text-xs uppercase tracking-wider hover:bg-accent hover:text-accent-foreground"
								disabled={isPending}
								onClick={resetDatabase}
								size="sm"
								title="Reset database to initial state (warning: deletes all data)"
								variant="outline"
							>
								<Database className="mr-1.5 h-3 w-3" />
								Reset
							</Button>

							<Button
								className="h-7 border-border bg-secondary px-2.5 font-mono text-muted-foreground text-xs uppercase tracking-wider hover:bg-accent hover:text-accent-foreground"
								disabled={isPending}
								onClick={resetStatus}
								size="sm"
								title="Reset repository status to pending"
								variant="outline"
							>
								<Database className="mr-1.5 h-3 w-3" />
								Status
							</Button>
							<Button
								className="h-7 border-border bg-secondary px-2.5 font-mono text-muted-foreground text-xs uppercase tracking-wider hover:bg-accent hover:text-accent-foreground"
								disabled={isPending}
								onClick={checkQueueStatus}
								size="sm"
								title="Check queue status (placeholder)"
								variant="outline"
							>
								<ListTodo className="mr-1.5 h-3 w-3" />
								Queue
							</Button>
						</div>
					)}

					<div className="flex items-center gap-2">
						<Button
							className="h-8 w-8 rounded-full border-border bg-secondary p-0 hover:bg-accent"
							onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
							size="icon"
							suppressHydrationWarning
							title="Toggle theme"
							variant="outline"
						>
							<Sun className="hidden h-4 w-4 text-amber-500 dark:block" />
							<Moon className="block h-4 w-4 text-foreground dark:hidden" />
						</Button>
					</div>
				</div>
			</div>
		</nav>
	);
}

export default Navigation;
