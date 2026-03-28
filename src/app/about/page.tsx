import { SiGithub } from "@icons-pack/react-simple-icons";
import { ArrowRight, Code2, GitBranch, Heart, Shield, Zap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About - Git Insights Analyzer",
  description:
    "Learn about Git Insights Analyzer - an open-source tool for deep repository analysis, dependency visualization, and code hotspot detection. Built with Next.js, Tree-sitter, and AI.",
  keywords: [
    "about git insights analyzer",
    "open source code analyzer",
    "github repository tool",
    "code analysis open source",
  ],
};

const techStack = [
  {
    name: "Next.js",
    description: "React framework with App Router and Server Components",
  },
  {
    name: "Tree-sitter",
    description: "Precise AST parsing for accurate dependency detection",
  },
  {
    name: "Drizzle ORM",
    description: "Type-safe database operations with PostgreSQL",
  },
  {
    name: "Inngest",
    description: "Background job processing for async analysis",
  },
  { name: "Elysia", description: "High-performance TypeScript API framework" },
  {
    name: "TanStack Query",
    description: "Server state management and caching",
  },
  { name: "D3.js", description: "Data visualization for interactive charts" },
  { name: "Tailwind CSS", description: "Utility-first CSS framework" },
];

export default function AboutPage() {
  return (
    <main className="blueprint-grid relative min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-border border-b">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-4 inline-flex items-center gap-2 border border-border px-3 py-1 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
            <Heart className="h-3 w-3" />
            <span>Open Source</span>
          </div>
          <h1 className="font-(family-name:--font-display) text-5xl text-foreground tracking-tight md:text-6xl">
            About Git
            <br />
            Insights Analyzer
          </h1>
          <p className="mt-6 max-w-2xl font-sans text-lg text-muted-foreground leading-relaxed">
            A deep repository analyzer built to help developers understand their codebases better.
            Visualize architecture, identify hotspots, and get AI-powered insights - all while
            keeping your code private.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="border-border border-b">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <h2 className="font-(family-name:--font-display) mb-8 text-3xl text-foreground">
            Our Mission
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <p className="mb-4 font-sans text-muted-foreground leading-relaxed">
                Modern codebases grow complex quickly. Developers need better tools to understand
                dependencies, identify risks, and make informed decisions about refactoring and
                architecture.
              </p>
              <p className="font-sans text-muted-foreground leading-relaxed">
                Git Insights Analyzer combines static analysis, dependency graphing, and AI to give
                you actionable insights about your code - without storing your source code on our
                servers.
              </p>
            </div>
            <div className="border border-border bg-secondary/30 p-6">
              <h3 className="font-(family-name:--font-display) mb-4 text-foreground text-xl">
                Core Principles
              </h3>
              <ul className="space-y-3">
                {[
                  "Privacy-first: Your code never leaves your browser",
                  "Open source: Transparent, community-driven development",
                  "Developer experience: Fast, intuitive, and powerful",
                  "Deep analysis: AST-level understanding of codebases",
                ].map((principle) => (
                  <li
                    className="flex items-start gap-3 font-mono text-muted-foreground text-xs"
                    key={principle}
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-accent" />
                    {principle}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-border border-b">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <h2 className="font-(family-name:--font-display) mb-8 text-3xl text-foreground">
            How It Works
          </h2>
          <div className="space-y-8">
            {[
              {
                icon: GitBranch,
                title: "Repository Acquisition",
                description:
                  "We shallow-clone your repository (depth=1) to avoid GitHub API rate limits. This gives us direct filesystem access for accurate analysis.",
              },
              {
                icon: Code2,
                title: "AST Parsing with Tree-sitter",
                description:
                  "Tree-sitter generates precise Syntax Trees for every file, enabling accurate import/dependency detection across 100+ programming languages.",
              },
              {
                icon: Zap,
                title: "Background Processing",
                description:
                  "Inngest workers handle the heavy lifting: parsing, hotspot calculation, and compression. Results are streamed to S3 for efficient storage.",
              },
              {
                icon: Shield,
                title: "Secure Delivery",
                description:
                  "Analysis results are delivered to your browser. File contents are fetched on-demand from GitHub - never stored on our servers.",
              },
            ].map((item, i) => (
              <div className="flex gap-6" key={item.title}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-secondary font-mono text-muted-foreground text-sm">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-(family-name:--font-display) mb-2 text-foreground text-xl">
                    {item.title}
                  </h3>
                  <p className="font-sans text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="border-border border-b">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <h2 className="font-(family-name:--font-display) mb-8 text-3xl text-foreground">
            Tech Stack
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {techStack.map((tech) => (
              <div
                className="border border-border bg-card p-4 transition-colors hover:bg-secondary/30"
                key={tech.name}
              >
                <h3 className="mb-1 font-mono text-foreground text-sm">{tech.name}</h3>
                <p className="font-sans text-muted-foreground text-xs">{tech.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Source Section */}
      <section className="border-border border-b bg-secondary/30">
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">
          <h2 className="font-(family-name:--font-display) mb-4 text-3xl text-foreground">
            Open Source
          </h2>
          <p className="mx-auto mb-8 max-w-xl font-sans text-muted-foreground">
            Git Insights Analyzer is fully open source. Contributions, issues, and feature requests
            are welcome.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              className="inline-flex items-center gap-2 bg-foreground px-6 py-3 font-mono text-background text-sm uppercase tracking-wider hover:bg-foreground/90"
              href="https://github.com/Its-Satyajit/git-insights-analyzer"
              rel="noopener noreferrer"
              target="_blank"
            >
              <SiGithub className="h-4 w-4" />
              View on GitHub
            </a>
            <a
              className="inline-flex items-center gap-2 border border-foreground px-6 py-3 font-mono text-foreground text-sm uppercase tracking-wider hover:bg-secondary"
              href="https://github.com/Its-Satyajit/git-insights-analyzer/issues"
              rel="noopener noreferrer"
              target="_blank"
            >
              Report an Issue
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">
          <h2 className="font-(family-name:--font-display) mb-4 text-3xl text-foreground">
            Ready to analyze your repository?
          </h2>
          <p className="mb-8 font-sans text-muted-foreground">
            Free for public repositories. No account required.
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
