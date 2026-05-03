"use client";

import { SiGithub } from "@icons-pack/react-simple-icons";
import { GitBranch } from "lucide-react";
import Link from "next/link";

const footerLinks = {
	product: [
		{ href: "/", label: "Home" },
		{ href: "/insights", label: "Insights" },
		{ href: "/about", label: "About" },
	],
	resources: [
		{ href: "/legal", label: "Legal" },
		{ href: "/legal#privacy", label: "Privacy" },
		{ href: "/legal#terms", label: "Terms" },
	],
};

function Footer() {
	const currentYear = new Date().getFullYear();

	return (
		<footer className="border-border border-t bg-background">
			<div className="mx-auto max-w-7xl px-6 py-12">
				<div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:gap-12">
					{/* Brand Column */}
					<div className="md:col-span-2">
						<Link
							className="group font-(family-name:--font-display) mb-4 inline-flex items-center gap-2 text-xl tracking-tight"
							href="/"
						>
							<div className="flex h-7 w-7 items-center justify-center border border-foreground bg-foreground transition-colors group-hover:bg-transparent">
								<GitBranch className="h-4 w-4 text-background group-hover:text-foreground" />
							</div>
							<span>Analyze</span>
						</Link>
						<p className="max-w-sm font-sans text-muted-foreground text-sm leading-relaxed">
							A precise repository analyzer for the modern developer. Visualize
							architecture, identify hotspots, and understand your codebase with
							editorial clarity.
						</p>

						{/* Built by + Source */}
						<div className="mt-6 flex items-center gap-4 font-mono text-muted-foreground text-xs">
							<span>
								Built by{" "}
								<a
									className="text-foreground transition-colors hover:text-accent"
									href="https://github.com/Its-Satyajit"
									rel="noopener noreferrer"
									target="_blank"
								>
									Its-Satyajit
								</a>
							</span>
							<span className="text-border">·</span>
							<a
								className="flex items-center gap-1.5 transition-colors hover:text-foreground"
								href="https://github.com/Its-Satyajit/git-insights-analyzer"
								rel="noopener noreferrer"
								target="_blank"
							>
								<SiGithub className="h-3 w-3" />
								<span>Source</span>
							</a>
						</div>
					</div>

					{/* Product Links */}
					<div>
						<h3 className="mb-4 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
							Product
						</h3>
						<ul className="space-y-2.5">
							{footerLinks.product.map((link) => (
								<li key={link.href}>
									<Link
										className="font-sans text-muted-foreground text-sm transition-colors hover:text-foreground"
										href={link.href}
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* Resources Links */}
					<div>
						<h3 className="mb-4 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
							Resources
						</h3>
						<ul className="space-y-2.5">
							{footerLinks.resources.map((link) => (
								<li key={link.href}>
									<Link
										className="font-sans text-muted-foreground text-sm transition-colors hover:text-foreground"
										href={link.href}
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>
				</div>

				{/* Bottom Bar */}
				<div className="mt-12 flex flex-col items-center justify-between gap-4 border-border border-t pt-6 sm:flex-row">
					<p className="font-mono text-muted-foreground text-xs">
						© {currentYear} Analyze. All rights reserved.
					</p>
					<div className="flex items-center gap-6 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
						<span>
							Status <span className="text-foreground">Online</span>
						</span>
						<span className="text-border">·</span>
						<span>
							Latency <span className="text-accent">12ms</span>
						</span>
					</div>
				</div>
			</div>
		</footer>
	);
}

export default Footer;
