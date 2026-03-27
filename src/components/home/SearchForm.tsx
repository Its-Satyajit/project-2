"use client";

import { SiGithub } from "@icons-pack/react-simple-icons";
import { useForm } from "@tanstack/react-form-nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Zap } from "lucide-react";
import { redirect } from "next/navigation";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { api } from "~/lib/eden";

export function SearchForm() {
	const queryClient = useQueryClient();

	const form = useForm({
		defaultValues: {
			githubUrl: "",
		},
		onSubmit: async ({ value }) => {
			const res = await api.analyze.post({ githubUrl: value.githubUrl });
			const data = res.data as {
				repoId?: string;
				owner?: string;
				name?: string;
			} | null;
			if (res.error || !data?.repoId) {
				toast.error(
					"Unable to analyze repository. Check the URL and try again.",
				);
				return;
			}
			queryClient.invalidateQueries({ queryKey: ["top-repos"] });
			// Use owner/name for SEO-friendly URLs
			if (data.owner && data.name) {
				redirect(`/${data.owner}/${data.name}`);
			}
			redirect(`/dashboard/${data.repoId}`);
		},
	});

	return (
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
					<form.Subscribe
						selector={(state) => [state.canSubmit, state.isSubmitting]}
					>
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
	);
}
