"use client";

import { ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

const navItems = [
	{ label: "Dashboard", path: "" },
	{ label: "Analysis", path: "/analysis" },
	{ label: "Files", path: "/files" },
] as const;

function Breadcrumbs() {
	const params = useParams();
	const pathname = usePathname();
	const owner = params.owner as string | undefined;
	const repo = params.repo as string | undefined;

	// Only show breadcrumbs when in repo context
	if (!owner || !repo) return null;

	const repoPath = `/${owner}/${repo}`;
	const currentPath = pathname || "";

	// Determine current section
	const currentNav = navItems.find((item) => {
		if (item.path === "") return currentPath === repoPath;
		return currentPath.startsWith(repoPath + item.path);
	});

	return (
		<motion.div
			animate={{ opacity: 1, height: "auto" }}
			className="fixed top-14 right-0 left-0 z-40 border-border border-b bg-background/95 backdrop-blur-sm"
			initial={{ opacity: 0, height: 0 }}
		>
			<div className="mx-auto flex h-9 max-w-7xl items-center gap-1 px-6">
				<Link
					className="font-mono text-muted-foreground text-xs transition-colors hover:text-foreground"
					href={repoPath}
				>
					{owner}
				</Link>
				<span className="text-border">/</span>
				<Link
					className="font-mono text-foreground text-xs transition-colors hover:text-accent"
					href={repoPath}
				>
					{repo}
				</Link>

				{currentNav && currentNav.path !== "" && (
					<>
						<ChevronRight className="mx-1 h-3 w-3 text-border" />
						<span className="font-mono text-muted-foreground text-xs">
							{currentNav.label}
						</span>
					</>
				)}

				{/* Section tabs */}
				<div className="ml-auto flex items-center gap-1">
					{navItems.map((item) => {
						const href = `${repoPath}${item.path}`;
						const isActive =
							item.path === ""
								? currentPath === repoPath
								: currentPath.startsWith(repoPath + item.path);

						return (
							<Link
								className={`px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
									isActive
										? "bg-foreground text-background"
										: "text-muted-foreground hover:text-foreground"
								}`}
								href={href}
								key={item.path}
							>
								{item.label}
							</Link>
						);
					})}
				</div>
			</div>
		</motion.div>
	);
}

export default Breadcrumbs;
