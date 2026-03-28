import { SiGithub } from "@icons-pack/react-simple-icons";
import {
	ArrowRight,
	Code2,
	FileCode,
	GitBranch,
	GitFork,
	Network,
	Search,
	Star,
	Users,
	Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { Suspense } from "react";
import { RecentAnalyses } from "~/components/home/RecentAnalyses";
import { SearchForm } from "~/components/home/SearchForm";
import { Skeleton } from "~/components/ui/skeleton";

export const metadata: Metadata = {
	title: "Free GitHub Repository Analyzer - Code Intelligence & Hotspots",
	description:
		"Free GitHub repo analyzer. Deep structural analysis - explore file structure, visualize dependencies, find code hotspots, and get AI-powered architecture insights.",
	openGraph: {
		title: "Free GitHub Repository Analyzer - Code Intelligence",
		description:
			"Analyze any GitHub repository. Explore structure, analyze dependencies, find hotspots.",
	},
	keywords: [
		"github analyzer",
		"code analysis",
		"repository insights",
		"dependency graph",
		"code hotspots",
		"static analysis",
		"codebase analyzer",
		"github repo analyzer",
	],
};

const FAQ_DATA = {
	"@context": "https://schema.org",
	"@type": "FAQPage",
	mainEntity: [
		{
			"@type": "Question",
			name: "What is Git Insights Analyzer?",
			acceptedAnswer: {
				"@type": "Answer",
				text: "Git Insights Analyzer is a free, open-source tool that performs deep structural analysis of GitHub repositories. It visualizes file structures, maps dependency graphs, identifies code hotspots, and provides AI-powered insights about your codebase architecture.",
			},
		},
		{
			"@type": "Question",
			name: "Is my code stored on your servers?",
			acceptedAnswer: {
				"@type": "Answer",
				text: "No. We never store your source code. Repository contents are fetched directly from GitHub on-demand and displayed temporarily in your browser only. We only cache public metadata like repository names, star counts, and contributor information.",
			},
		},
		{
			"@type": "Question",
			name: "How does the dependency analysis work?",
			acceptedAnswer: {
				"@type": "Answer",
				text: "We use Tree-sitter AST parsing to generate precise Syntax Trees for every file in your repository. This enables accurate detection of imports, exports, and dependencies across 100+ programming languages without relying on regex patterns.",
			},
		},
		{
			"@type": "Question",
			name: "What are code hotspots?",
			acceptedAnswer: {
				"@type": "Answer",
				text: "Code hotspots are files identified as high-risk based on a combination of complexity metrics, dependency weights, and change frequency from git history. These are the files that typically benefit most from refactoring or additional attention.",
			},
		},
		{
			"@type": "Question",
			name: "Does it work with private repositories?",
			acceptedAnswer: {
				"@type": "Answer",
				text: "Yes. Git Insights Analyzer supports private repositories through GitHub OAuth authentication. Your repository contents remain private and are fetched securely on-demand.",
			},
		},
	],
};

const STEPS = [
	{
		num: "01",
		title: "Paste Repository URL",
		description: "Enter any public GitHub repository URL to begin analysis.",
		icon: Search,
	},
	{
		num: "02",
		title: "Parse Structure",
		description:
			"We clone the repo and parse every file using Tree-sitter AST.",
		icon: Code2,
	},
	{
		num: "03",
		title: "Map Dependencies",
		description:
			"Build a complete dependency graph showing import relationships.",
		icon: Network,
	},
	{
		num: "04",
		title: "Get Insights",
		description:
			"View hotspots, file types, language breakdown, and architecture.",
		icon: Zap,
	},
];

export default function Home() {
	return (
		<main className="blueprint-grid relative min-h-screen overflow-hidden bg-background">
			<div className="relative mx-auto max-w-6xl px-6 pt-16 pb-8 md:pt-24 md:pb-12">
				{/* ===================== */}
				{/* SECTION 1: Hero + Search */}
				{/* ===================== */}
				<div className="mb-16">
					<div className="grid gap-12 lg:grid-cols-[1fr_400px] lg:items-end">
						<div>
							<div className="mb-6 inline-flex items-center gap-2 border border-border px-3 py-1 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
								<span className="relative flex h-1.5 w-1.5">
									<span className="absolute inline-flex h-full w-full animate-ping bg-accent opacity-75" />
									<span className="relative inline-flex h-1.5 w-1.5 bg-accent" />
								</span>
								<span>Free GitHub Repository Analyzer</span>
							</div>
							<h1 className="font-(family-name:--font-display) text-6xl text-foreground tracking-tight md:text-7xl lg:text-[5.5rem]">
								Repository
								<br />
								Code Intelligence
							</h1>
							<p className="mt-6 max-w-lg font-sans text-lg text-muted-foreground leading-relaxed">
								Free GitHub repository analyzer. Deep structural analysis -
								visualize file structure, map dependencies, find code hotspots,
								and get AI-powered architecture insights.
							</p>
						</div>

						{/* Input Form - Client Island */}
						<Suspense
							fallback={
								<div className="lg:pb-2">
									<div className="flex items-center border border-foreground/20 bg-card/50">
										<Skeleton className="h-12 flex-1" />
									</div>
								</div>
							}
						>
							<SearchForm />
						</Suspense>
					</div>
				</div>

				{/* Accent Line */}
				<div className="mb-16">
					<div className="line-rule-accent" />
				</div>

				{/* ===================== */}
				{/* SECTION 2: How It Works */}
				{/* ===================== */}
				<div className="mb-16">
					<div className="mb-8 flex items-center gap-3">
						<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
							How It Works
						</span>
						<div className="line-rule flex-1" />
					</div>
					<div className="grid gap-0 md:grid-cols-2 lg:grid-cols-4">
						{STEPS.map((step, i) => (
							<div
								className="group relative border-border border-r p-6 last:border-r-0"
								key={step.num}
							>
								<div className="mb-4 flex items-center gap-3">
									<div className="flex h-8 w-8 items-center justify-center border border-border bg-secondary">
										<step.icon className="h-4 w-4 text-foreground" />
									</div>
									<span className="font-mono text-muted-foreground text-xs">
										Step {step.num}
									</span>
								</div>
								<h3 className="font-(family-name:--font-display) mb-2 text-foreground text-lg">
									{step.title}
								</h3>
								<p className="font-sans text-muted-foreground text-sm leading-relaxed">
									{step.description}
								</p>
								{i < STEPS.length - 1 && (
									<ArrowRight className="absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 text-border lg:hidden" />
								)}
							</div>
						))}
					</div>
				</div>

				{/* ===================== */}
				{/* SECTION 3: Features */}
				{/* ===================== */}
				<div className="mb-16">
					<div className="mb-8 flex items-center gap-3">
						<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
							What You Get
						</span>
						<div className="line-rule flex-1" />
					</div>
					<div className="grid gap-0 md:grid-cols-2 lg:grid-cols-4">
						<div className="border-border border-r border-b p-6">
							<FileCode className="mb-4 h-5 w-5 text-primary" />
							<h3 className="mb-2 font-mono text-foreground text-xs uppercase tracking-wider">
								File Structure
							</h3>
							<p className="font-sans text-muted-foreground text-sm leading-relaxed">
								Complete file tree with language breakdown, line counts, and
								folder organization.
							</p>
						</div>
						<div className="border-border border-r border-b p-6">
							<GitBranch className="mb-4 h-5 w-5 text-accent" />
							<h3 className="mb-2 font-mono text-foreground text-xs uppercase tracking-wider">
								Dependency Graph
							</h3>
							<p className="font-sans text-muted-foreground text-sm leading-relaxed">
								Visualize import relationships between files. Understand
								dependencies and coupling.
							</p>
						</div>
						<div className="border-border border-r border-b p-6">
							<Zap className="mb-4 h-5 w-5 text-amber-400" />
							<h3 className="mb-2 font-mono text-foreground text-xs uppercase tracking-wider">
								Code Hotspots
							</h3>
							<p className="font-sans text-muted-foreground text-sm leading-relaxed">
								Identify high-risk files based on complexity, dependencies, and
								change frequency.
							</p>
						</div>
						<div className="border-border border-b p-6">
							<Star className="mb-4 h-5 w-5 text-blue-400" />
							<h3 className="mb-2 font-mono text-foreground text-xs uppercase tracking-wider">
								Metadata Insights
							</h3>
							<p className="font-sans text-muted-foreground text-sm leading-relaxed">
								Stars, forks, contributors, license, and recent commit history
								at a glance.
							</p>
						</div>
					</div>
				</div>

				{/* ===================== */}
				{/* SECTION 4: Recent Analyses */}
				{/* ===================== */}
				<div className="mb-16">
					<Suspense
						fallback={
							<div>
								<div className="mb-8 flex items-end justify-between">
									<div>
										<span className="font-(family-name:--font-display) mb-2 block text-3xl text-foreground">
											Recent
										</span>
										<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
											Previously analyzed repositories
										</span>
									</div>
								</div>
								<div className="space-y-0">
									{[1, 2, 3, 4].map((n) => (
										<div
											className="border-border border-b py-5"
											key={`skeleton-${n}`}
										>
											<Skeleton className="mb-2 h-5 w-64" />
											<Skeleton className="h-3 w-32" />
										</div>
									))}
								</div>
							</div>
						}
					>
						<RecentAnalyses />
					</Suspense>
				</div>

				{/* ===================== */}
				{/* SECTION 5: FAQ */}
				{/* ===================== */}
				<div className="mb-16">
					<div className="mb-8 flex items-center gap-3">
						<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
							FAQ
						</span>
						<div className="line-rule flex-1" />
					</div>
					<div className="grid gap-0 md:grid-cols-2">
						{[
							{
								q: "How do I analyze a GitHub repository?",
								a: "Simply paste any GitHub repository URL into the search box. Our analyzer will parse the repo structure, build dependency graphs, and identify hotspots.",
							},
							{
								q: "What is a code hotspot?",
								a: "A code hotspot is a file identified as high-risk based on complexity metrics, dependency weights, and change frequency. These files typically need the most attention during refactoring.",
							},
							{
								q: "Does this work with private repositories?",
								a: "Yes! Connect your GitHub account via OAuth to analyze private repositories. Your code remains secure - we only fetch content on-demand.",
							},
							{
								q: "How does dependency analysis work?",
								a: "We use Tree-sitter AST parsing to generate precise syntax trees for every file, enabling accurate import/dependency detection across 100+ languages.",
							},
						].map((faq) => (
							<div
								className="faq-card border-border border-b p-6 md:border-r-[1px]"
								key={faq.q}
							>
								<h3 className="font-(family-name:--font-display) mb-2 text-foreground text-lg">
									{faq.q}
								</h3>
								<p className="font-sans text-muted-foreground text-sm leading-relaxed">
									{faq.a}
								</p>
							</div>
						))}
					</div>
				</div>

				{/* ===================== */}
				{/* CTA Banner */}
				{/* ===================== */}
				<div className="mb-16 border border-border bg-card/50 p-8 text-center">
					<h2 className="font-(family-name:--font-display) mb-2 text-2xl text-foreground">
						Ready to analyze your codebase?
					</h2>
					<p className="mb-6 font-sans text-muted-foreground text-sm">
						Paste a GitHub URL above to get started. Free, no signup required.
					</p>
					<div className="flex items-center justify-center gap-4">
						<a
							className="flex items-center gap-2 border border-foreground bg-foreground px-6 py-2.5 font-mono text-background text-xs uppercase tracking-wider transition-colors hover:bg-foreground/90"
							href="/"
						>
							<Search className="h-3 w-3" />
							<span>Analyze Repository</span>
						</a>
						<a
							className="flex items-center gap-2 border border-border px-6 py-2.5 font-mono text-foreground text-xs uppercase tracking-wider transition-colors hover:bg-secondary"
							href="https://github.com/Its-Satyajit/git-insights-analyzer"
							rel="noopener noreferrer"
							target="_blank"
						>
							<SiGithub className="h-3 w-3" />
							<span>View Source</span>
						</a>
					</div>
				</div>

				{/* ===================== */}
				{/* Footer */}
				{/* ===================== */}
				<footer className="flex flex-col items-start justify-between gap-4 border-border border-t pt-8 md:flex-row md:items-center">
					<div className="flex items-center gap-6">
						<span className="font-(family-name:--font-display) text-foreground text-lg">
							Analyze
						</span>
						<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
							v1.0.0
						</span>
					</div>
					<div className="flex items-center gap-6 font-mono text-muted-foreground text-xs">
						<a
							className="flex items-center gap-1.5 transition-colors hover:text-foreground"
							href="https://github.com/Its-Satyajit/git-insights-analyzer"
							rel="noopener noreferrer"
							target="_blank"
						>
							<SiGithub className="h-3 w-3" />
							<span>Source</span>
						</a>
						<span className="text-border">·</span>
						<span>
							Built by{" "}
							<a
								className="text-foreground transition-colors hover:text-accent"
								href="https://github.com/Its-Satyajit"
								rel="noopener noreferrer"
								target="_blank"
							>
								Satyajit
							</a>
						</span>
						<span className="text-border">·</span>
						<Link
							className="transition-colors hover:text-foreground"
							href="/legal"
						>
							Legal
						</Link>
					</div>
					<div className="flex items-center gap-6 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
						<span>
							Status <span className="text-foreground">Online</span>
						</span>
						<span className="text-border">·</span>
						<span>
							Latency <span className="text-accent">12ms</span>
						</span>
					</div>
				</footer>
			</div>

			{/* FAQ Schema for SEO */}
			<Script
				dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_DATA) }}
				id="faq-schema"
				type="application/ld+json"
			/>
		</main>
	);
}
