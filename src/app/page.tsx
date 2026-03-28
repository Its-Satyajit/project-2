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
import Script from "next/script";
import { SearchForm } from "~/components/home/SearchForm";
import { getGlobalStats } from "~/server/dal/repositories";

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
			"We parse every file using Tree-sitter AST for precise syntax trees.",
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
		title: "File Structure",
		description:
			"Interactive file tree with language breakdown and directory organization.",
		stats: ["Tree navigation", "Language stats", "File types"],
	},
	{
		icon: Network,
		title: "Dependency Graph",
		description:
			"AST-powered import detection for accurate dependency mapping.",
		stats: ["100+ languages", "Circular detection", "Module analysis"],
	},
	{
		icon: Target,
		title: "Hotspot Detection",
		description:
			"Identify high-risk files based on complexity and change frequency.",
		stats: ["Risk scoring", "Churn analysis", "Refactoring targets"],
	},
	{
		icon: BarChart3,
		title: "Visual Analytics",
		description:
			"Rich charts showing code composition and language distribution.",
		stats: ["LOC charts", "Interactive plots", "Data exploration"],
	},
	{
		icon: GitBranch,
		title: "Contributors",
		description: "See contribution patterns and activity over time.",
		stats: ["Top rankings", "Activity timeline", "Code ownership"],
	},
	{
		icon: Code2,
		title: "Code Preview",
		description: "Syntax highlighting powered by Shiki for 100+ languages.",
		stats: ["Multi-language", "Private repos", "Quick navigation"],
	},
	{
		icon: Zap,
		title: "AI Insights",
		description: "Intelligent summaries about architecture and code quality.",
		stats: ["Architecture", "Patterns", "Recommendations"],
	},
	{
		icon: Shield,
		title: "Privacy First",
		description: "No source code storage. On-demand fetching only.",
		stats: ["No storage", "GDPR compliant", "Secure fetching"],
	},
];

function formatNumber(num: number): string {
	if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M+`;
	if (num >= 1000) return `${(num / 1000).toFixed(0)}K+`;
	return num.toString();
}

export default async function Home() {
	const stats = await getGlobalStats();

	return (
		<main className="blueprint-grid relative min-h-screen overflow-hidden bg-background">
			{/* ===================== */}
			{/* DECORATIVE: Top Accent Bar */}
			{/* ===================== */}
			<div className="fixed top-0 right-0 left-0 z-40 h-1 bg-gradient-to-r from-accent via-accent/80 to-accent" />

			<div className="relative mx-auto max-w-7xl px-6 pt-24 pb-16 md:pt-32">
				{/* ===================== */}
				{/* SECTION 1: Hero */}
				{/* ===================== */}
				<div className="mb-24 md:mb-32">
					<div className="mx-auto max-w-4xl text-center">
						{/* Eyebrow */}
						<div className="mb-6 inline-flex items-center gap-3 border border-border/60 bg-card/40 px-4 py-2 backdrop-blur-sm">
							<span className="relative flex h-2 w-2">
								<span className="absolute inline-flex h-full w-full animate-ping bg-accent opacity-75" />
								<span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
							</span>
							<span className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
								Free GitHub Analyzer
							</span>
						</div>

						{/* Headline - Dramatic Typography */}
						<h1 className="font-(family-name:--font-display) mb-8 text-5xl text-foreground leading-[0.95] md:text-7xl lg:text-[5.5rem]">
							<span className="block">Repository</span>
							<span className="block text-accent">Intelligence</span>
						</h1>

						{/* Subheadline */}
						<p className="mx-auto mb-12 max-w-2xl font-sans text-lg text-muted-foreground leading-relaxed md:text-xl">
							Deep structural analysis for any GitHub repository. Visualize file
							structures, map dependencies, find code hotspots, and uncover
							architecture patterns.
						</p>

						{/* Search Form - Prominent */}
						<div className="mx-auto max-w-2xl">
							<SearchForm />
						</div>
					</div>

					{/* Decorative measurement lines */}
					<div className="mt-16 flex justify-center">
						<div className="flex items-center gap-8">
							<div className="h-px w-16 bg-border" />
							<span className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-widest">
								No signup required
							</span>
							<div className="h-px w-16 bg-border" />
						</div>
					</div>
				</div>

				{/* ===================== */}
				{/* SECTION 2: How It Works - Horizontal Flow */}
				{/* ===================== */}
				<div className="mb-24">
					<div className="mb-10 flex items-center gap-4">
						<span className="shrink-0 font-mono text-[11px] text-accent uppercase tracking-[0.2em]">
							How It Works
						</span>
						<div className="h-px flex-1 bg-border" />
					</div>

					<div className="relative grid grid-cols-1 gap-0 md:grid-cols-4">
						{/* Connector line for desktop */}
						<div
							className="absolute top-8 left-[12.5%] hidden h-px w-[75%] md:block"
							style={{
								background:
									"repeating-linear-gradient(90deg, var(--color-border) 0, var(--color-border) 8px, transparent 8px, transparent 16px)",
							}}
						/>

						{STEPS.map((step, i) => (
							<div
								className="group relative border-border border-r border-b p-6 md:border-r md:border-b-0 md:last:border-r-0"
								key={step.num}
							>
								{/* Step number - Large decorative */}
								<div className="font-(family-name:--font-display) mb-5 text-4xl text-border/40 md:text-5xl">
									{step.num}
								</div>

								{/* Icon */}
								<div className="mb-4 flex h-10 w-10 items-center justify-center border border-accent/30 bg-accent/5">
									<step.icon className="h-5 w-5 text-accent" />
								</div>

								<h3 className="font-(family-name:--font-display) mb-2 text-foreground text-xl">
									{step.title}
								</h3>
								<p className="font-sans text-muted-foreground text-sm leading-relaxed">
									{step.description}
								</p>

								{/* Arrow connector for mobile */}
								{i < STEPS.length - 1 && (
									<ArrowRight className="absolute right-4 bottom-4 h-4 w-4 text-border md:hidden" />
								)}
							</div>
						))}
					</div>
				</div>

				{/* ===================== */}
				{/* SECTION 3: Features - Grid with Accents */}
				{/* ===================== */}
				<div className="mb-24">
					<div className="mb-10 flex items-center gap-4">
						<span className="shrink-0 font-mono text-[11px] text-accent uppercase tracking-[0.2em]">
							Capabilities
						</span>
						<div className="h-px flex-1 bg-border" />
					</div>

					<div className="grid grid-cols-1 gap-0 border border-border md:grid-cols-2 lg:grid-cols-4">
						{FEATURES.map((feature, i) => (
							<div
								className="group border-border border-r border-b p-6 transition-all hover:bg-accent/[0.03] md:last:border-r-0 lg:nth-2:border-r-0"
								key={feature.title}
							>
								{/* Icon with accent background */}
								<div className="mb-4 flex h-12 w-12 items-center justify-center border border-border bg-card">
									<feature.icon className="h-6 w-6 text-accent" />
								</div>

								<h3 className="font-(family-name:--font-display) mb-2 text-foreground text-lg">
									{feature.title}
								</h3>
								<p className="mb-4 font-sans text-muted-foreground text-sm leading-relaxed">
									{feature.description}
								</p>

								{/* Stats tags */}
								<div className="flex flex-wrap gap-1.5">
									{feature.stats.map((stat) => (
										<span
											className="border border-border/60 bg-muted/30 px-2 py-0.5 font-mono text-[9px] text-muted-foreground uppercase tracking-wider"
											key={stat}
										>
											{stat}
										</span>
									))}
								</div>
							</div>
						))}
					</div>
				</div>

				{/* ===================== */}
				{/* SECTION 4: Stats / Social Proof */}
				{/* ===================== */}
				<div className="mb-24 border-border border-y bg-card/30 py-12">
					<div className="grid grid-cols-2 gap-8 md:grid-cols-4">
						{[
							{
								label: "Repositories Analyzed",
								value: formatNumber(stats.repositoriesAnalyzed),
							},
							{ label: "Languages Supported", value: "100+" },
							{ label: "Files Parsed", value: formatNumber(stats.totalFiles) },
							{ label: "Lines of Code", value: formatNumber(stats.totalLines) },
						].map((stat) => (
							<div className="text-center" key={stat.label}>
								<div className="font-(family-name:--font-display) mb-1 text-4xl text-accent md:text-5xl">
									{stat.value}
								</div>
								<div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
									{stat.label}
								</div>
							</div>
						))}
					</div>
				</div>

				{/* ===================== */}
				{/* SECTION 5: FAQ */}
				{/* ===================== */}
				<div className="mb-16">
					<div className="mb-10 flex items-center gap-4">
						<span className="shrink-0 font-mono text-[11px] text-accent uppercase tracking-[0.2em]">
							Frequently Asked
						</span>
						<div className="h-px flex-1 bg-border" />
					</div>

					<div className="grid grid-cols-1 gap-0 border border-border md:grid-cols-2">
						{[
							{
								q: "How do I analyze a repository?",
								a: "Paste any GitHub URL into the search box. We'll parse the structure, build dependency graphs, and identify hotspots automatically.",
							},
							{
								q: "What is a code hotspot?",
								a: "Files identified as high-risk based on complexity, dependency weights, and change frequency. These need the most attention during refactoring.",
							},
							{
								q: "Does it work with private repos?",
								a: "Yes. Connect your GitHub account to analyze private repositories. Your code remains secure with on-demand fetching.",
							},
							{
								q: "How does dependency analysis work?",
								a: "We use Tree-sitter AST parsing for precise syntax trees, enabling accurate import detection across 100+ programming languages.",
							},
						].map((faq, i) => (
							<div
								className="group border-border border-b p-6 md:border-r-[1px] md:nth-2:border-r-0 md:border-b-0 lg:nth-2:border-r lg:nth-last-child(-n+2):border-b-0"
								key={faq.q}
							>
								<h3 className="font-(family-name:--font-display) mb-3 text-foreground text-lg">
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
				{/* SECTION 6: CTA */}
				{/* ===================== */}
				<div className="mb-16 border border-accent/30 bg-accent/[0.02] p-8 md:p-12">
					<div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
						<div className="text-center md:text-left">
							<h2 className="font-(family-name:--font-display) mb-2 text-2xl text-foreground md:text-3xl">
								Ready to understand your codebase?
							</h2>
							<p className="font-sans text-muted-foreground">
								Paste a GitHub URL above to begin. Free, instant, no signup.
							</p>
						</div>

						<div className="flex shrink-0 flex-col gap-3 sm:flex-row">
							<a
								className="flex items-center justify-center gap-2 border border-accent bg-accent px-8 py-3 font-mono text-sm text-white uppercase tracking-wider transition-all hover:bg-accent/90 hover:shadow-accent/20 hover:shadow-lg"
								href="/"
							>
								<Zap className="h-4 w-4" />
								<span>Analyze Now</span>
							</a>
							<a
								className="flex items-center justify-center gap-2 border border-border bg-card px-8 py-3 font-mono text-foreground text-sm uppercase tracking-wider transition-all hover:bg-secondary"
								href="https://github.com/Its-Satyajit/git-insights-analyzer"
								rel="noopener noreferrer"
								target="_blank"
							>
								<SiGithub className="h-4 w-4" />
								<span>Source</span>
							</a>
						</div>
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
