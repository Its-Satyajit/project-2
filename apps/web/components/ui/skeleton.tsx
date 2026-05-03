import { cn } from "~/lib/utils";

function Skeleton({ className, ref, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			ref={ref}
			className={cn("animate-pulse rounded-md bg-muted", className)}
			data-slot="skeleton"
			{...props}
		/>
	);
}

export { Skeleton };
