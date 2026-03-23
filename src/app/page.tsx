"use client";
import { useForm } from "@tanstack/react-form-nextjs";
import { useQuery } from "@tanstack/react-query";
import { GitFork, Star } from "lucide-react";
import { redirect } from "next/navigation";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/lib/eden";

export default function Home() {
	const form = useForm({
		defaultValues: {
			githubUrl: "",
		},

		onSubmit: async ({ value }) => {
			const res = await api.analyze.post({ githubUrl: value.githubUrl });
			if (res.error || !res?.data?.repoId) {
				toast.error("Failed to analyze repository");
				return;
			}
			redirect(`/dashboard/${res.data.repoId}`);
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
		<main className="mx-auto max-w-4xl p-6">
			<div className="mb-12">
				<h1 className="mb-4 font-bold text-3xl">Repository Analyzer</h1>
				<p className="mb-6 text-muted-foreground">
					Analyze any GitHub repository to get insights about its structure,
					dependencies, and hotspots.
				</p>
				<form
					className="flex gap-4"
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
					<form.Field name="githubUrl">
						{(field) => (
							<div className="flex-1">
								<Label className="sr-only" htmlFor={field.name}>
									GitHub URL
								</Label>
								<Input
									className="w-full"
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="https://github.com/owner/repo"
									value={field.state.value}
								/>
							</div>
						)}
					</form.Field>
					<form.Subscribe
						selector={(state) => [state.canSubmit, state.isSubmitting]}
					>
						{([canSubmit, isSubmitting]) => (
							<Button className="shrink-0" disabled={!canSubmit} type="submit">
								{isSubmitting ? "Analyzing..." : "Analyze"}
							</Button>
						)}
					</form.Subscribe>
				</form>
			</div>

			<div>
				<h2 className="mb-4 font-bold text-2xl">Top Repositories by Stars</h2>
				{isLoadingRepos ? (
					<div className="grid gap-4 md:grid-cols-2">
						{Array.from({ length: 4 }).map((_, i) => (
							<Card key={i}>
								<CardHeader>
									<Skeleton className="h-5 w-3/4" />
									<Skeleton className="mt-2 h-4 w-1/2" />
								</CardHeader>
								<CardContent>
									<Skeleton className="h-4 w-full" />
									<Skeleton className="mt-2 h-4 w-2/3" />
								</CardContent>
							</Card>
						))}
					</div>
				) : (
					<div className="grid gap-4 md:grid-cols-2">
						{topRepos?.map((repo) => (
							<Card
								className="transition-colors hover:bg-accent/50"
								key={repo.id}
							>
								<CardHeader className="pb-2">
									<div className="flex items-start justify-between">
										<div>
											<CardTitle className="text-lg">
												<a
													className="hover:underline"
													href={`/dashboard/${repo.id}`}
												>
													{repo.fullName}
												</a>
											</CardTitle>
											{repo.description && (
												<p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
													{repo.description}
												</p>
											)}
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<div className="flex items-center gap-4 text-sm">
										<div className="flex items-center gap-1">
											<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
											<span>{repo.stars?.toLocaleString()}</span>
										</div>
										<div className="flex items-center gap-1">
											<GitFork className="h-4 w-4" />
											<span>{repo.forks?.toLocaleString()}</span>
										</div>
										{repo.primaryLanguage && (
											<span className="rounded-full bg-muted px-2 py-0.5 text-xs">
												{repo.primaryLanguage}
											</span>
										)}
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>
		</main>
	);
}
