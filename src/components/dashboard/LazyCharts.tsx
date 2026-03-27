"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "~/components/ui/skeleton";

// Wrapper component that lazy loads recharts
export const LazyBarChart = dynamic(
	() => import("recharts").then((mod) => mod.BarChart),
	{ ssr: false, loading: () => <Skeleton className="h-[280px] w-full" /> },
);

export const LazyBar = dynamic(
	() => import("recharts").then((mod) => mod.Bar),
	{ ssr: false },
);

export const LazyPieChart = dynamic(
	() => import("recharts").then((mod) => mod.PieChart),
	{ ssr: false, loading: () => <Skeleton className="h-[280px] w-full" /> },
);

export const LazyPie = dynamic(
	() => import("recharts").then((mod) => mod.Pie),
	{ ssr: false },
);

export const LazyScatterChart = dynamic(
	() => import("recharts").then((mod) => mod.ScatterChart),
	{ ssr: false, loading: () => <Skeleton className="h-[420px] w-full" /> },
);

export const LazyScatter = dynamic(
	() => import("recharts").then((mod) => mod.Scatter),
	{ ssr: false },
);

export const LazyResponsiveContainer = dynamic(
	() => import("recharts").then((mod) => mod.ResponsiveContainer),
	{ ssr: false },
);

export const LazyXAxis = dynamic(
	() => import("recharts").then((mod) => mod.XAxis),
	{ ssr: false },
);

export const LazyYAxis = dynamic(
	() => import("recharts").then((mod) => mod.YAxis),
	{ ssr: false },
);

export const LazyZAxis = dynamic(
	() => import("recharts").then((mod) => mod.ZAxis),
	{ ssr: false },
);

export const LazyCartesianGrid = dynamic(
	() => import("recharts").then((mod) => mod.CartesianGrid),
	{ ssr: false },
);

export const LazyTooltip = dynamic(
	() => import("recharts").then((mod) => mod.Tooltip),
	{ ssr: false },
);

export const LazyCell = dynamic(
	() => import("recharts").then((mod) => mod.Cell),
	{ ssr: false },
);

export const LazyReferenceArea = dynamic(
	() => import("recharts").then((mod) => mod.ReferenceArea),
	{ ssr: false },
);

export const LazyReferenceLine = dynamic(
	() => import("recharts").then((mod) => mod.ReferenceLine),
	{ ssr: false },
);

export const LazyLabel = dynamic(
	() => import("recharts").then((mod) => mod.Label),
	{ ssr: false },
);
