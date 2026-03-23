"use client";

import {
	Database,
	FileJson,
	FileText,
	GitBranch,
	Home,
	LayoutDashboard,
	ListTodo,
	RefreshCw,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { api } from "~/lib/eden";

export function Navigation() {
	const params = useParams();
	const pathname = usePathname();
	const [repoId, setRepoId] = useState<string | undefined>(undefined);
	const isDev = process.env.NODE_ENV === "development";

	useEffect(() => {
		setRepoId(params.repoId as string | undefined);
	}, [params.repoId]);

	const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

	const handleAction = async (
		action: string,
		callback: () => Promise<void>,
	) => {
		setIsLoading((prev) => ({ ...prev, [action]: true }));
		try {
			await callback();
			toast.success(`${action} completed`);
		} catch (error) {
			toast.error(
				`${action} failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		} finally {
			setIsLoading((prev) => ({ ...prev, [action]: false }));
		}
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
			const res = await api.dashboard({ repoId }).status.get();
			if (res.data && typeof res.data === "object" && "analysis" in res.data) {
				const analysis = (res.data as any).analysis;
				if (analysis?.dependencyGraph) {
					console.log("Dependency Graph:", analysis.dependencyGraph);
					alert(
						`Dependency Graph:\n${JSON.stringify(analysis.dependencyGraph, null, 2)}`,
					);
				} else {
					throw new Error("No dependency graph found");
				}
			} else {
				throw new Error("Could not fetch analysis data");
			}
		});
	};

	const checkQueueStatus = async () => {
		if (!repoId) return;
		await handleAction("Check queue", async () => {
			await callDebugAction("queue-status");
		});
	};

	return (
		<nav className="border-b bg-background px-4 py-2">
			<div className="mx-auto flex max-w-6xl items-center justify-between">
				<div className="flex items-center gap-4">
					<Link
						className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
						href="/"
					>
						<Home className="h-4 w-4" />
						<span className="font-medium text-sm">Home</span>
					</Link>

					{repoId && (
						<>
							<span className="text-muted-foreground">/</span>
							<Link
								className={`flex items-center gap-2 font-medium text-sm hover:text-foreground ${
									pathname === `/dashboard/${repoId}`
										? "text-foreground"
										: "text-muted-foreground"
								}`}
								href={`/dashboard/${repoId}`}
							>
								<LayoutDashboard className="h-4 w-4" />
								Dashboard
							</Link>

							<span className="text-muted-foreground">/</span>
							<Link
								className={`flex items-center gap-2 font-medium text-sm hover:text-foreground ${
									pathname === `/dashboard/${repoId}/dependencies`
										? "text-foreground"
										: "text-muted-foreground"
								}`}
								href={`/dashboard/${repoId}/dependencies`}
							>
								<GitBranch className="h-4 w-4" />
								Dependencies
							</Link>

							<span className="text-muted-foreground">/</span>
							<Link
								className={`flex items-center gap-2 font-medium text-sm hover:text-foreground ${
									pathname === `/dashboard/${repoId}/summary`
										? "text-foreground"
										: "text-muted-foreground"
								}`}
								href={`/dashboard/${repoId}/summary`}
							>
								<FileText className="h-4 w-4" />
								Summary
							</Link>
						</>
					)}
				</div>

				{isDev && repoId && (
					<div className="flex items-center gap-2">
						<div className="mr-2 flex items-center gap-1.5 text-muted-foreground text-xs">
							<span className="rounded bg-yellow-500 px-1 py-0.5 font-bold text-[10px] text-black">
								DEV
							</span>
							Debug:
						</div>

						<Button
							disabled={isLoading["Trigger analysis"]}
							onClick={triggerAnalysis}
							size="sm"
							title="Re-run analysis for this repository"
							variant="outline"
						>
							<RefreshCw
								className={`mr-1 h-3 w-3 ${isLoading["Trigger analysis"] ? "animate-spin" : ""}`}
							/>
							Analyze
						</Button>

						<Button
							disabled={isLoading["View graph"]}
							onClick={viewDependencyGraph}
							size="sm"
							title="View raw dependency graph JSON"
							variant="outline"
						>
							<FileJson className="mr-1 h-3 w-3" />
							Graph
						</Button>

						<Button
							disabled={isLoading["Clear analysis"]}
							onClick={clearAnalysis}
							size="sm"
							title="Delete analysis results and reset status"
							variant="outline"
						>
							<Trash2 className="mr-1 h-3 w-3" />
							Clear
						</Button>

						<Button
							disabled={isLoading["Reset status"]}
							onClick={resetStatus}
							size="sm"
							title="Reset repository status to pending"
							variant="outline"
						>
							<Database className="mr-1 h-3 w-3" />
							Reset
						</Button>

						<Button
							disabled={isLoading["Check queue"]}
							onClick={checkQueueStatus}
							size="sm"
							title="Check queue status (placeholder)"
							variant="outline"
						>
							<ListTodo className="mr-1 h-3 w-3" />
							Queue
						</Button>
					</div>
				)}
			</div>
		</nav>
	);
}

export default Navigation;
