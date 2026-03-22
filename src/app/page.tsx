"use client";
import { useForm } from "@tanstack/react-form-nextjs";
import { redirect } from "next/navigation";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
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

	return (
		<main className="mx-auto max-w-[80ch]">
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				<form.Field name="githubUrl">
					{(field) => (
						<>
							<Label htmlFor={field.name}>Entre Github Url</Label>
							<Input
								id={field.name}
								name={field.name}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								value={field.state.value}
							/>
						</>
					)}
				</form.Field>
				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting]}
				>
					{([canSubmit, isSubmitting]) => (
						<>
							<Button disabled={!canSubmit} type="submit">
								{isSubmitting ? "Analyzing" : "Start Analysis"}
							</Button>
						</>
					)}
				</form.Subscribe>
			</form>
		</main>
	);
}
