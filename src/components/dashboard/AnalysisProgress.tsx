"use client";

import { CheckCircle, Circle, Loader2, XCircle } from "lucide-react";
import React from "react";
import { type AnalysisStatus, useRepoStatus } from "~/hooks/useRepoStatus";

const PHASES = [
	{ key: "queued", label: "Queued" },
	{ key: "fetching", label: "Fetching repository data" },
	{ key: "basic-analysis", label: "Basic analysis" },
	{ key: "dependency-analysis", label: "Dependency analysis" },
	{ key: "complete", label: "Complete" },
];

const STATUS_ORDER = [
	"queued",
	"fetching",
	"basic-analysis",
	"dependency-analysis",
	"complete",
];

function getPhaseIndex(status: AnalysisStatus): number {
	const idx = STATUS_ORDER.indexOf(status);
	return idx === -1 ? 0 : idx;
}

const PhaseItem = React.memo(function PhaseItem({
	phase,
	isActive,
	isComplete,
	isFailed,
}: {
	phase: (typeof PHASES)[number];
	isActive: boolean;
	isComplete: boolean;
	isFailed: boolean;
}) {
	return (
		<div className="flex items-center gap-3">
			{isComplete ? (
				<CheckCircle className="h-5 w-5 text-accent" />
			) : isFailed ? (
				<XCircle className="h-5 w-5 text-destructive" />
			) : isActive ? (
				<Loader2 className="h-5 w-5 animate-spin text-primary" />
			) : (
				<Circle className="h-5 w-5 text-foreground/20" />
			)}
			<span
				className={`text-sm ${
					isActive
						? "font-medium text-foreground"
						: isComplete
							? "text-accent"
							: "text-muted-foreground"
				}`}
			>
				{phase.label}
			</span>
		</div>
	);
});

export const AnalysisProgress = React.memo(function AnalysisProgress({
	repoId,
}: {
	repoId: string;
}) {
	const { data: status, isLoading, error } = useRepoStatus(repoId);

	if (isLoading) {
		return (
			<div className="flex items-center gap-2 text-muted-foreground">
				<Loader2 className="h-4 w-4 animate-spin" />
				<span className="text-sm">Checking analysis status...</span>
			</div>
		);
	}

	if (error || !status) {
		return (
			<div className="flex items-center gap-2 text-destructive">
				<XCircle className="h-4 w-4" />
				<span className="text-sm">
					Unable to check analysis status. Please refresh.
				</span>
			</div>
		);
	}

	if (status.status === "failed") {
		return (
			<div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
				<div className="flex items-center gap-2 text-destructive">
					<XCircle className="h-5 w-5" />
					<span className="font-medium">Analysis Failed</span>
				</div>
				<p className="mt-1 text-destructive/80 text-sm">{status.phase}</p>
			</div>
		);
	}

	if (status.status === "complete") {
		return (
			<div className="rounded-lg border border-accent/20 bg-accent/5 p-6 text-center">
				<div className="flex flex-col items-center gap-3 text-accent">
					<CheckCircle className="h-8 w-8" />
					<div className="flex flex-col gap-1">
						<span className="font-mono font-bold text-sm tracking-tight uppercase">
							ANALYSIS_COMPLETE
						</span>
						<p className="font-mono text-accent/60 text-xs">
							System synchronized with latest repository state
						</p>
					</div>
				</div>
			</div>
		);
	}

	const currentPhaseIndex = getPhaseIndex(status.status);

	return (
		<div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
			<div className="flex items-center gap-2 text-primary">
				<Loader2 className="h-5 w-5 animate-spin" />
				<span className="font-medium">Analyzing Repository</span>
			</div>
			<p className="mt-1 text-primary/80 text-sm">{status.phase}</p>
			<div className="mt-4 space-y-2">
				{PHASES.slice(0, -1).map((phase, idx) => (
					<PhaseItem
						isActive={idx === currentPhaseIndex}
						isComplete={idx < currentPhaseIndex}
						isFailed={false}
						key={phase.key}
						phase={phase}
					/>
				))}
			</div>
		</div>
	);
});
