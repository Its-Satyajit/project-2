"use client";

import {
	BarChart3,
	Database,
	FileJson,
	GitBranch,
	ListTodo,
	Menu,
	Moon,
	RefreshCw,
	Search,
	Sun,
	Trash2,
	X,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { useTheme } from "~/components/ThemeProvider";
import { Button } from "~/components/ui/button";
import { api } from "~/lib/eden";

const mainLinks = [
	{ href: "/", label: "Home" },
	{ href: "/insights", label: "Insights" },
	{ href: "/about", label: "About" },
] as const;

function Navigation() {
	const params = useParams();
	const pathname = usePathname();
	const repoId = params.repoId as string | undefined;
	const owner = params.owner as string | undefined;
	const repo = params.repo as string | undefined;
	const hasRepoParams = owner && repo;
	const isDev = process.env.NODE_ENV === "development";
	const { theme, setTheme } = useTheme();
	const [isPending, startTransition] = React.useTransition();
	const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

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
		if (!confirm("Are you sure you want to clear all analysis results?"))
			return;
		await handleAction("Clear analysis", async () => {
			await callDebugAction("clear-analysis");
		});
	};

	const resetStatus = async () => {
		if (!repoId) return;
		if (!confirm("Reset repository status to pending?")) return;
		await handleAction("Reset status", async () => {
			await callDebugAction("reset-status");
		});
	};

	const viewDependencyGraph = async () => {
		if (!repoId) return;
		await handleAction("View graph", async () => {
			const res = await api.debug.post({ repoId, action: "inspect-graph" });
			if (res.error) throw new Error("Failed to inspect graph");
			alert(`Dependency Graph Stats:\n${JSON.stringify(res.data, null, 2)}`);
		});
	};

	const checkQueueStatus = async () => {
		if (!repoId) return;
		await handleAction("Check queue", async () => {
			await callDebugAction("queue-status");
		});
	};

	const isActive = (href: string) => {
		if (href === "/") return pathname === "/";
		return pathname.startsWith(href);
	};

	return (
		<header className="fixed top-0 right-0 left-0 z-50 border-border border-b bg-background/95 backdrop-blur-sm">
			<div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
				{/* Left: Brand + Main Nav */}
				<div className="flex items-center gap-6">
					{/* Brand */}
					<Link
						className="group font-(family-name:--font-display) flex items-center gap-2 text-lg tracking-tight transition-colors hover:text-foreground"
						href="/"
					>
						<div className="flex h-6 w-6 items-center justify-center border border-foreground bg-foreground transition-colors group-hover:bg-transparent">
							<GitBranch className="h-3.5 w-3.5 text-background group-hover:text-foreground" />
						</div>
						<span>Analyze</span>
					</Link>

					{/* Desktop: Main Nav Links */}
					<nav className="hidden items-center gap-1 md:flex">
						{mainLinks.map((link) => (
							<Link
								className={`relative flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors ${
									isActive(link.href)
										? "text-foreground"
										: "text-muted-foreground hover:text-foreground"
								}`}
								href={link.href}
								key={link.href}
							>
								{link.label}
								{isActive(link.href) && (
									<motion.div
										className="absolute right-3 bottom-0 left-3 h-px bg-foreground"
										layoutId="nav-indicator"
										transition={{ duration: 0.2 }}
									/>
								)}
							</Link>
						))}
					</nav>
				</div>

				{/* Right: Actions */}
				<div className="flex items-center gap-3">
					{/* Dev Tools */}
					{isDev && repoId && (
						<div className="hidden items-center gap-1 lg:flex">
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
								<Database className="mr-1 h-2.5 w-2.5" />
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
							</Button>
						</div>
					)}

					{/* Theme Toggle */}
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

					{/* Mobile Menu Toggle */}
					<Button
						aria-label="Toggle menu"
						className="h-7 w-7 border-0 bg-transparent p-0 text-muted-foreground hover:text-foreground md:hidden"
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						size="icon"
						variant="ghost"
					>
						{mobileMenuOpen ? (
							<X className="h-4 w-4" />
						) : (
							<Menu className="h-4 w-4" />
						)}
					</Button>
				</div>
			</div>

			{/* Mobile Menu */}
			{mobileMenuOpen && (
				<motion.div
					animate={{ opacity: 1, height: "auto" }}
					className="border-border border-t bg-background md:hidden"
					initial={{ opacity: 0, height: 0 }}
				>
					<div className="px-6 py-4">
						<nav className="flex flex-col gap-1">
							{mainLinks.map((link) => (
								<Link
									className={`flex items-center gap-2 px-3 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
										isActive(link.href)
											? "bg-muted/50 text-foreground"
											: "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
									}`}
									href={link.href}
									key={link.href}
									onClick={() => setMobileMenuOpen(false)}
								>
									{link.label}
								</Link>
							))}
							{hasRepoParams && (
								<>
									<span className="my-2 border-border border-t" />
									<Link
										className="flex items-center gap-2 px-3 py-2 font-mono text-muted-foreground text-xs uppercase tracking-widest hover:text-foreground"
										href={`/${owner}/${repo}`}
										onClick={() => setMobileMenuOpen(false)}
									>
										{owner}/{repo} Dashboard
									</Link>
									<Link
										className="flex items-center gap-2 px-3 py-2 font-mono text-muted-foreground text-xs uppercase tracking-widest hover:text-foreground"
										href={`/${owner}/${repo}/analysis`}
										onClick={() => setMobileMenuOpen(false)}
									>
										Analysis
									</Link>
								</>
							)}
						</nav>
					</div>
				</motion.div>
			)}
		</header>
	);
}

export default Navigation;
