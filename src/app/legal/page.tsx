import { ArrowLeft, Database, FileCode, Scale, Shield } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import "~/styles/legal.css";

export const metadata: Metadata = {
	title: "Legal - Privacy, Data Handling & Licensing",
	description:
		"Legal information about Git Insights Analyzer. Learn about our privacy policy, data handling practices, and licensing terms.",
};

const legalSections = [
	{
		icon: Database,
		title: "Data Storage",
		content: [
			"We do not store any repository source code or file contents on our servers. All file content is fetched directly from GitHub on-demand and displayed temporarily in your browser session only.",
			"The following public metadata is cached in our database for performance and display purposes:",
		],
		listItems: [
			"Repository name and description",
			"Star and fork counts",
			"Primary programming language",
			"Contributor count",
		],
	},
	{
		icon: Scale,
		title: "Licensing",
		content: [
			"This tool does not relicense, redistribute, or modify any source code. All copyrights and license terms remain with their respective owners and original authors.",
			"When viewing repository contents, you are subject to the original repository's license terms. We display license information when available from the GitHub API.",
		],
	},
	{
		icon: FileCode,
		title: "How It Works",
		content: ["When you analyze a repository, we:"],
		orderedList: [
			"Fetch the repository structure via the GitHub API",
			"Clone a shallow copy (depth=1) temporarily for dependency analysis",
			"Store only the analysis results and metadata",
			"Delete the temporary clone after analysis completes",
		],
		footerNote:
			"File contents are never stored — they are fetched live from GitHub when you click on a file in the viewer.",
	},
	{
		icon: Shield,
		title: "Privacy",
		content: [
			"We do not collect personal information beyond what is required for authentication via GitHub OAuth. We do not track your browsing activity or sell data to third parties.",
		],
		contactBox: true,
	},
];

export default function LegalPage() {
	return (
		<main className="blueprint-grid min-h-screen bg-background">
			<div className="mx-auto max-w-3xl animate-fade-in px-6 py-16">
				{/* Back link */}
				<div className="mb-8">
					<Link
						className="group inline-flex items-center gap-2 font-mono text-muted-foreground text-xs uppercase tracking-widest transition-colors hover:text-foreground"
						href="/"
					>
						<ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
						Back
					</Link>
				</div>

				{/* Title */}
				<div className="mb-16">
					<h1 className="font-(family-name:--font-display) text-5xl text-foreground tracking-tight">
						Legal
					</h1>
					<p className="mt-3 font-mono text-muted-foreground text-xs uppercase tracking-widest">
						Privacy, data handling, and licensing
					</p>
				</div>

				{/* Content sections */}
				<div className="space-y-16">
					{legalSections.map((section) => (
						<section key={section.title}>
							<div className="mb-4 flex items-center gap-3">
								<div className="flex h-8 w-8 items-center justify-center bg-secondary">
									<section.icon className="h-4 w-4 text-muted-foreground" />
								</div>
								<h2 className="font-(family-name:--font-display) text-2xl text-foreground">
									{section.title}
								</h2>
							</div>
							<div className="border-border border-l pl-11">
								{section.content.map((paragraph) => (
									<p
										className="mb-4 font-sans text-muted-foreground text-sm leading-relaxed"
										key={paragraph.slice(0, 50)}
									>
										{paragraph}
									</p>
								))}

								{section.listItems && (
									<ul className="mt-4 space-y-2">
										{section.listItems.map((item) => (
											<li
												className="flex items-center gap-2 font-mono text-muted-foreground text-xs"
												key={item}
											>
												<span className="h-1 w-1 bg-accent" />
												{item}
											</li>
										))}
									</ul>
								)}

								{section.orderedList && (
									<ol className="space-y-3">
										{section.orderedList.map((step, i) => (
											<li
												className="flex items-start gap-3 font-mono text-muted-foreground text-xs"
												key={step}
											>
												<span className="flex h-5 w-5 shrink-0 items-center justify-center border border-border text-[10px] text-muted-foreground">
													{i + 1}
												</span>
												<span className="pt-0.5">{step}</span>
											</li>
										))}
									</ol>
								)}

								{section.footerNote && (
									<p className="mt-4 font-sans text-muted-foreground text-sm leading-relaxed">
										{section.footerNote}
									</p>
								)}

								{section.contactBox && (
									<div className="mt-6 border border-border bg-card p-4">
										<p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
											Contact
										</p>
										<p className="mt-2 font-sans text-muted-foreground text-sm">
											For questions about data handling or to request deletion
											of cached data, open an issue on{" "}
											<a
												className="text-foreground underline underline-offset-2 hover:text-accent"
												href="https://github.com/Its-Satyajit/git-insights-analyzer/issues"
												rel="noopener noreferrer"
												target="_blank"
											>
												GitHub
											</a>
											.
										</p>
									</div>
								)}
							</div>
						</section>
					))}
				</div>

				{/* Footer */}
				<div className="mt-20 border-border border-t pt-8">
					<p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
						Last updated March 2026
					</p>
				</div>
			</div>
		</main>
	);
}
