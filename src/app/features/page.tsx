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
	Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import "~/styles/features.css";

export const metadata: Metadata = {
	title: "Features - GitHub Repository Analysis Tool",
	description:
		"Explore Git Insights Analyzer features: dependency graph visualization, hotspot detection, code structure analysis, contributor insights, and AI-powered codebase summaries.",
	keywords: [
		"repository analyzer features",
		"code analysis tools",
		"dependency visualization",
		"hotspot detection",
		"github code insights",
	],
};

const features = [
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
			"Understand how files connect through imports and exports. Powered by Tree-sitter AST parsing for accurate dependency mapping across your codebase.",
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

export default function FeaturesPage() {
	return (
		<main className="blueprint-grid relative min-h-screen bg-background">
			{/* Hero Section */}
			<section className="border-border border-b">
				<div className="mx-auto max-w-6xl px-6 py-20">
					<div className="mb-4 inline-flex items-center gap-2 border border-border px-3 py-1 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
						<span>Features</span>
					</div>
					<h1 className="font-(family-name:--font-display) text-5xl text-foreground tracking-tight md:text-6xl lg:text-7xl">
						Deep Code
						<br />
						Intelligence
					</h1>
					<p className="mt-6 max-w-2xl font-sans text-lg text-muted-foreground leading-relaxed">
						Everything you need to understand, analyze, and improve your
						codebase. From structural analysis to AI-powered insights.
					</p>
					<div className="mt-8 flex flex-wrap gap-4">
						<Link
							className="inline-flex items-center gap-2 bg-foreground px-6 py-3 font-mono text-background text-sm uppercase tracking-wider hover:bg-foreground/90"
							href="/"
						>
							<Zap className="h-4 w-4" />
							Start Analyzing
						</Link>
						<Link
							className="inline-flex items-center gap-2 border border-foreground px-6 py-3 font-mono text-foreground text-sm uppercase tracking-wider hover:bg-secondary"
							href="https://github.com/Its-Satyajit/git-insights-analyzer"
							rel="noopener noreferrer"
							target="_blank"
						>
							<GitBranch className="h-4 w-4" />
							View on GitHub
						</Link>
					</div>
				</div>
			</section>

			{/* Features Grid */}
			<section className="mx-auto max-w-6xl px-6 py-20">
				<div className="mb-12">
					<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
						Capabilities
					</span>
					<h2 className="font-(family-name:--font-display) mt-2 text-3xl text-foreground">
						Everything you need to understand your codebase
					</h2>
				</div>

				<div className="grid gap-0 md:grid-cols-2 lg:grid-cols-2">
					{features.map((feature, i) => (
						<div
							className="border-border border-r border-b p-8 transition-colors hover:bg-secondary/30"
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
			</section>

			{/* How It Works Section */}
			<section className="border-border border-t">
				<div className="mx-auto max-w-6xl px-6 py-20">
					<div className="mb-12 text-center">
						<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
							How It Works
						</span>
						<h2 className="font-(family-name:--font-display) mt-2 text-3xl text-foreground">
							Three simple steps to code intelligence
						</h2>
					</div>

					<div className="grid gap-8 md:grid-cols-3">
						{[
							{
								step: "01",
								title: "Enter Repository URL",
								description:
									"Paste any GitHub repository URL. Works with both public and private repositories.",
							},
							{
								step: "02",
								title: "Deep Analysis",
								description:
									"Tree-sitter AST parsing extracts dependencies, hotspots, and structure. Powered by async background workers.",
							},
							{
								step: "03",
								title: "Explore Insights",
								description:
									"Interactive dashboard with file trees, dependency graphs, hotspots, and AI-powered summaries.",
							},
						].map((item) => (
							<div className="text-center" key={item.step}>
								<div className="mb-4 inline-flex h-12 w-12 items-center justify-center border border-border font-mono text-muted-foreground text-xl">
									{item.step}
								</div>
								<h3 className="font-(family-name:--font-display) mb-2 text-foreground text-xl">
									{item.title}
								</h3>
								<p className="font-sans text-muted-foreground text-sm leading-relaxed">
									{item.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="border-border border-t bg-secondary/30">
				<div className="mx-auto max-w-6xl px-6 py-20 text-center">
					<h2 className="font-(family-name:--font-display) mb-4 text-3xl text-foreground">
						Ready to analyze your codebase?
					</h2>
					<p className="mb-8 font-sans text-muted-foreground">
						Get started for free. No account required for public repositories.
					</p>
					<Link
						className="inline-flex items-center gap-2 bg-foreground px-8 py-4 font-mono text-background text-sm uppercase tracking-wider hover:bg-foreground/90"
						href="/"
					>
						Start Free Analysis
						<ArrowRight className="h-4 w-4" />
					</Link>
				</div>
			</section>
		</main>
	);
}
