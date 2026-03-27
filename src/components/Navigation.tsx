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
import { motion } from "motion/react";
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
		<nav className="fixed top-0 right-0 left-0 z-50 border-border border-b bg-background/95 backdrop-blur-sm">
			<div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
				<div className="flex items-center gap-1">
					<Link
						className={`group flex items-center gap-2 px-2 py-1 font-mono text-xs uppercase tracking-widest transition-colors ${
							pathname === "/"
								? "text-foreground"
								: "text-muted-foreground hover:text-foreground"
						}`}
						href="/"
					>
						<span className="font-medium">Analyze</span>
						{pathname === "/" && (
							<motion.div
								className="ml-1 h-1 w-1 bg-accent"
								layoutId="nav-indicator"
							/>
						)}
					</Link>

					{repoId && (
						<>
							<span className="mx-2 text-border">/</span>
							<Link
								className={`group flex items-center gap-2 px-2 py-1 font-mono text-xs uppercase tracking-widest transition-colors ${
									pathname === `/dashboard/${repoId}`
										? "text-foreground"
										: "text-muted-foreground hover:text-foreground"
								}`}
								href={`/dashboard/${repoId}`}
							>
								<span>Dashboard</span>
								{pathname === `/dashboard/${repoId}` && (
									<motion.div
										className="ml-1 h-1 w-1 bg-accent"
										layoutId="nav-indicator"
									/>
								)}
							</Link>

							<span className="mx-2 text-border">/</span>
							<Link
								className={`group flex items-center gap-2 px-2 py-1 font-mono text-xs uppercase tracking-widest transition-colors ${
									pathname === `/dashboard/${repoId}/analysis`
										? "text-foreground"
										: "text-muted-foreground hover:text-foreground"
								}`}
								href={`/dashboard/${repoId}/analysis`}
							>
								<span>Analysis</span>
								{pathname === `/dashboard/${repoId}/analysis` && (
									<motion.div
										className="ml-1 h-1 w-1 bg-accent"
										layoutId="nav-indicator"
									/>
								)}
							</Link>
						</>
					)}
				</div>

				<div className="flex items-center gap-4">
					{isDev && repoId && (
						<div className="flex items-center gap-1">
							<span className="mr-2 font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
								Dev
							</span>

							<Button
								aria-label="Re-run analysis"
								className="h-6 border-0 bg-transparent px-2 font-mono text-[10px] text-muted-foreground uppercase tracking-wider hover:text-accent"
								disabled={isPending}
								onClick={triggerAnalysis}
								size="sm"
								title="Re-run analysis"
								variant="ghost"
							>
								<RefreshCw
									className={`mr-1 h-2.5 w-2.5 ${isPending ? "animate-spin" : ""}`}
								/>
								<span className="hidden lg:inline">Analyze</span>
							</Button>

							<Button
								aria-label="View graph"
								className="h-6 border-0 bg-transparent px-2 font-mono text-[10px] text-muted-foreground uppercase tracking-wider hover:text-accent"
								disabled={isPending}
								onClick={viewDependencyGraph}
								size="sm"
								title="View graph"
								variant="ghost"
							>
								<FileJson className="mr-1 h-2.5 w-2.5" />
								<span className="hidden lg:inline">Graph</span>
							</Button>

							<Button
								aria-label="Clear analysis"
								className="h-6 border-0 bg-transparent px-2 font-mono text-[10px] text-muted-foreground uppercase tracking-wider hover:text-accent"
								disabled={isPending}
								onClick={clearAnalysis}
								size="sm"
								title="Clear analysis"
								variant="ghost"
							>
								<Trash2 className="mr-1 h-2.5 w-2.5" />
								<span className="hidden lg:inline">Clear</span>
							</Button>

							<Button
								aria-label="Reset database"
								className="h-6 border-0 bg-transparent px-2 font-mono text-[10px] text-muted-foreground uppercase tracking-wider hover:text-accent"
								disabled={isPending}
								onClick={resetDatabase}
								size="sm"
								title="Reset database"
								variant="ghost"
							>
								<Database className="mr-1 h-2.5 w-2.5" />
								<span className="hidden lg:inline">Reset</span>
							</Button>

							<Button
								aria-label="Reset status"
								className="h-6 border-0 bg-transparent px-2 font-mono text-[10px] text-muted-foreground uppercase tracking-wider hover:text-accent"
								disabled={isPending}
								onClick={resetStatus}
								size="sm"
								title="Reset status"
								variant="ghost"
							>
								<span className="hidden lg:inline">Status</span>
							</Button>
							<Button
								aria-label="Check queue"
								className="h-6 border-0 bg-transparent px-2 font-mono text-[10px] text-muted-foreground uppercase tracking-wider hover:text-accent"
								disabled={isPending}
								onClick={checkQueueStatus}
								size="sm"
								title="Check queue"
								variant="ghost"
							>
								<ListTodo className="mr-1 h-2.5 w-2.5" />
								<span className="hidden lg:inline">Queue</span>
							</Button>
						</div>
					)}

					<div className="flex items-center">
						<Button
							aria-label="Toggle theme"
							className="h-7 w-7 border-0 bg-transparent p-0 text-muted-foreground hover:text-foreground"
							onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
							size="icon"
							suppressHydrationWarning
							title="Toggle theme"
							variant="ghost"
						>
							<Sun className="hidden h-3.5 w-3.5 dark:block" />
							<Moon className="block h-3.5 w-3.5 dark:hidden" />
						</Button>
					</div>
				</div>
			</div>
		</nav>
	);
}

export default Navigation;
