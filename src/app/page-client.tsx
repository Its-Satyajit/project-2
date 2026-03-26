"use client";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { useForm } from "@tanstack/react-form-nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, GitBranch, GitFork, Search, Star, Users, Zap } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/lib/eden";

const FEATURES = [
  {
    num: "01",
    title: "Structure",
    description: "Complete file tree with language breakdown and folder organization.",
  },
  {
    num: "02",
    title: "Dependencies",
    description: "Visualize import relationships between files to understand connections.",
  },
  {
    num: "03",
    title: "Hotspots",
    description:
      "Identify high-risk files based on complexity, dependencies, and change frequency.",
  },
  {
    num: "04",
    title: "Insights",
    description: "AI-powered summaries about your codebase structure and health.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 150,
      damping: 20,
    },
  },
};

export default function HomeClient() {
  const queryClient = useQueryClient();
  const form = useForm({
    defaultValues: {
      githubUrl: "",
    },

    onSubmit: async ({ value }) => {
      const res = await api.analyze.post({ githubUrl: value.githubUrl });
      const data = res.data as { repoId?: string } | null;
      if (res.error || !data?.repoId) {
        toast.error("Unable to analyze repository. Check the URL and try again.");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["top-repos"] });
      redirect(`/dashboard/${data.repoId}`);
    },
  });

  const { data: topRepos, isLoading: isLoadingRepos } = useQuery({
    queryKey: ["top-repos"],
    queryFn: async () => {
      const res = await api.repos.top.get({ query: { limit: 10 } });
      if (res.error) throw new Error("Failed to fetch top repositories");
      return res.data;
    },
  });

  return (
    <main className="blueprint-grid relative min-h-screen overflow-hidden bg-background">
      <motion.div
        animate="visible"
        className="relative mx-auto max-w-6xl px-6 pt-16 pb-8 md:pt-24 md:pb-12"
        initial="hidden"
        variants={containerVariants}
      >
        {/* Hero Section - Asymmetric Layout */}
        <motion.div className="mb-20" variants={itemVariants}>
          <div className="grid gap-12 lg:grid-cols-[1fr_400px] lg:items-end">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 border border-border px-3 py-1 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping bg-accent opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 bg-accent" />
                </span>
                <span>Repository Analysis</span>
              </div>
              <h1 className="font-(family-name:--font-display) text-6xl text-foreground tracking-tight md:text-7xl lg:text-[5.5rem]">
                Code
                <br />
                Intelligence
              </h1>
              <p className="mt-6 max-w-lg font-sans text-lg text-muted-foreground leading-relaxed">
                Deep structural analysis of any GitHub repository. Understand architecture,
                dependencies, and complexity at a glance.
              </p>
            </div>

            {/* Input Form - aligned to bottom */}
            <div className="lg:pb-2">
              <form
                className="relative"
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
              >
                <div className="flex items-center border border-foreground/20 bg-card/50">
                  <div className="flex items-center pr-2 pl-4 text-muted-foreground/50">
                    <Search className="h-4 w-4" />
                  </div>
                  <form.Field name="githubUrl">
                    {(field) => (
                      <div className="flex-1">
                        <Label className="sr-only" htmlFor={field.name}>
                          GitHub URL
                        </Label>
                        <Input
                          className="h-12 border-0 bg-transparent font-mono text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
                          id={field.name}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="github.com/owner/repo"
                          value={field.state.value}
                        />
                      </div>
                    )}
                  </form.Field>
                  <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                    {([canSubmit, isSubmitting]) => (
                      <Button
                        className="mr-1 h-9 bg-foreground px-5 font-mono text-background text-xs uppercase tracking-widest hover:bg-foreground/90"
                        disabled={!canSubmit}
                        type="submit"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <svg
                              aria-hidden="true"
                              className="h-3 w-3 animate-spin"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                fill="none"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                fill="currentColor"
                              />
                            </svg>
                            <span>Analyzing</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Zap className="h-3 w-3" />
                            <span>Analyze</span>
                          </span>
                        )}
                      </Button>
                    )}
                  </form.Subscribe>
                </div>
                <p className="mt-2 font-mono text-[10px] text-muted-foreground/50 uppercase tracking-wider">
                  Supported: github.com, gist.github.com
                </p>
              </form>
            </div>
          </div>
        </motion.div>

        {/* Accent Line */}
        <motion.div className="mb-16" variants={itemVariants}>
          <div className="line-rule-accent" />
        </motion.div>

        {/* Features - Horizontal list, not cards */}
        <motion.div className="mb-20" variants={itemVariants}>
          <div className="mb-8 flex items-center gap-3">
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
              Capabilities
            </span>
            <div className="line-rule flex-1" />
          </div>
          <div className="grid gap-0 md:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, i) => (
              <motion.div
                className="group relative border-border px-6 py-5 transition-colors hover:bg-secondary/50 md:border-r"
                key={feature.title}
                variants={itemVariants}
              >
                {FEATURES.length - 1 === i && <div className="hidden lg:block" />}
                <span className="font-(family-name:--font-display) mb-3 block text-4xl text-muted-foreground/30">
                  {feature.num}
                </span>
                <h3 className="mb-2 font-mono text-foreground text-xs uppercase tracking-wider">
                  {feature.title}
                </h3>
                <p className="font-sans text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Analyses - Editorial list style */}
        <motion.div variants={itemVariants}>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <span className="font-(family-name:--font-display) mb-2 block text-3xl text-foreground">
                Recent
              </span>
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                Previously analyzed repositories
              </span>
            </div>
            <span className="font-(family-name:--font-display) hidden text-[5rem] text-muted-foreground/10 leading-none md:block">
              {topRepos?.length ?? 0}
            </span>
          </div>

          {isLoadingRepos ? (
            <div className="space-y-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <div className="border-border border-b py-5" key={`skeleton-${i}`}>
                  <Skeleton className="mb-2 h-5 w-64" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ))}
            </div>
          ) : (
            <div className="border-border border-t">
              {topRepos?.map((repo, i) => (
                <motion.a
                  className="group relative flex items-baseline justify-between border-border border-b py-5 transition-colors hover:bg-secondary/20"
                  href={`/dashboard/${repo.id}`}
                  key={repo.id}
                  whileHover={{ x: 4 }}
                >
                  <div className="flex-1">
                    <div className="mb-1 flex items-baseline gap-3">
                      <span className="absolute top-5 left-[-2rem] font-mono text-muted-foreground/30 text-xs tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-(family-name:--font-display) text-foreground text-xl transition-colors group-hover:text-accent">
                        {repo.fullName}
                      </span>
                      {repo.primaryLanguage && (
                        <span className="flex items-center gap-1.5 border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                          <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                          {repo.primaryLanguage}
                        </span>
                      )}
                    </div>
                    {repo.description && (
                      <p className="ml-8 max-w-xl truncate font-sans text-muted-foreground text-sm">
                        {repo.description}
                      </p>
                    )}
                  </div>
                  <div className="ml-6 flex shrink-0 items-center gap-6">
                    <div className="flex items-center gap-1.5 font-mono text-muted-foreground text-xs tabular-nums">
                      <Star className="h-3 w-3" />
                      <span>{repo.stars?.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-muted-foreground text-xs tabular-nums">
                      <GitFork className="h-3 w-3" />
                      <span>{repo.forks?.toLocaleString()}</span>
                    </div>
                    {repo.contributorCount !== undefined && repo.contributorCount > 0 && (
                      <div className="hidden items-center gap-1.5 font-mono text-muted-foreground text-xs tabular-nums sm:flex">
                        <Users className="h-3 w-3" />
                        <span>{repo.contributorCount}</span>
                      </div>
                    )}
                    <ArrowRight className="h-4 w-4 text-muted-foreground/0 transition-all group-hover:translate-x-1 group-hover:text-accent" />
                  </div>
                </motion.a>
              ))}
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.footer
          className="mt-24 flex flex-col items-start justify-between gap-4 border-border border-t pt-8 md:flex-row md:items-center"
          variants={itemVariants}
        >
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
            <Link className="transition-colors hover:text-foreground" href="/legal">
              Legal
            </Link>
          </div>
          <div className="flex items-center gap-4 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
            <span>
              Status <span className="text-foreground">Online</span>
            </span>
            <span className="text-border">·</span>
            <span>
              Latency <span className="text-accent">12ms</span>
            </span>
          </div>
        </motion.footer>
      </motion.div>
    </main>
  );
}
