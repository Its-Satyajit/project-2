import { SiGithub } from "@icons-pack/react-simple-icons";
import {
	ArrowRight,
	BarChart3,
	Code2,
	FileCode,
	FolderTree,
	GitBranch,
	GitFork,
	Network,
	Search,
	Shield,
	Star,
	Target,
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

const FEATURES = [
	{
		icon: FolderTree,
		title: "Complete File Structure",
		description:
			"Visualize your entire repository structure with an interactive file tree. See language breakdown, folder organization, and file counts at a glance.",
		benefits: [
			"Interactive file tree navigation",
			"Language distribution analysis",
			"Directory structure overview",
			"File type categorization",
		],
	},
	{
		icon: Network,
		title: "Dependency Graph",
		description:
			"Understand how files connect through imports and exports. Powered by Tree-sitter AST parsing for accurate dependency mapping.",
		benefits: [
			"AST-powered import detection",
			"Visual dependency relationships",
			"Circular dependency detection",
			"Module isolation analysis",
		],
	},
	{
		icon: Target,
		title: "Hotspot Detection",
		description:
			"Identify high-risk files based on complexity, dependency weights, and change frequency. Focus refactoring efforts where they matter most.",
		benefits: [
			"Risk score calculation",
			"Churn analysis from git history",
			"Complexity metrics",
			"Prioritized refactoring targets",
		],
	},
	{
		icon: BarChart3,
		title: "Visual Analytics",
		description:
			"Rich charts and visualizations help you understand your codebase composition, language distribution, and code metrics at a glance.",
		benefits: [
			"Lines of code by language",
			"File distribution charts",
			"Dependency scatter plots",
			"Interactive data exploration",
		],
	},
	{
		icon: GitBranch,
		title: "Contributor Insights",
		description:
			"See who contributes to your repository, their contribution patterns, and activity over time. Understand team dynamics and code ownership.",
		benefits: [
			"Top contributor ranking",
			"Contribution timeline",
			"Code ownership mapping",
			"Activity patterns",
		],
	},
	{
		icon: Code2,
		title: "Code Preview",
		description:
			"View file contents with syntax highlighting powered by Shiki. Supports both public and private repositories securely.",
		benefits: [
			"Syntax highlighting for 100+ languages",
			"Secure private repo access",
			"Quick file navigation",
			"Line-by-line viewing",
		],
	},
	{
		icon: Zap,
		title: "AI-Powered Insights",
		description:
			"Get intelligent summaries about your codebase structure, architecture patterns, and potential improvements powered by AI.",
		benefits: [
			"Architecture summaries",
			"Code quality suggestions",
			"Pattern recognition",
			"Improvement recommendations",
		],
	},
	{
		icon: Shield,
		title: "Privacy-First Design",
		description:
			"We never store your source code. Repository contents are fetched on-demand and displayed temporarily in your browser only.",
		benefits: [
			"No code storage",
			"On-demand fetching",
			"Temporary browser cache only",
			"GDPR compliant",
		],
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
							Deep Code Intelligence
						</span>
						<div className="line-rule flex-1" />
					</div>
					<div className="grid gap-0 md:grid-cols-2">
						{FEATURES.map((feature, i) => (
							<div
								className="group border-border border-r border-b p-8 transition-colors hover:bg-secondary/30"
								key={feature.title}
							>
								<div className="mb-4 flex h-10 w-10 items-center justify-center border border-border bg-secondary">
									<feature.icon className="h-5 w-5 text-muted-foreground" />
								</div>
								<h3 className="font-(family-name:--font-display) mb-2 text-foreground text-xl">
									{feature.title}
								</h3>
								<p className="mb-4 font-sans text-muted-foreground text-sm leading-relaxed">
									{feature.description}
								</p>
								<ul className="space-y-2">
									{feature.benefits.map((benefit) => (
										<li
											className="flex items-center gap-2 font-mono text-muted-foreground text-xs"
											key={benefit}
										>
											<span className="h-1 w-1 bg-accent" />
											{benefit}
										</li>
									))}
								</ul>
							</div>
						))}
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
