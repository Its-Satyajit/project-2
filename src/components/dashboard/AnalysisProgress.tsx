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
				<CheckCircle className="h-5 w-5 text-emerald-400" />
			) : isFailed ? (
				<XCircle className="h-5 w-5 text-red-400" />
			) : isActive ? (
				<Loader2 className="h-5 w-5 animate-spin text-blue-400" />
			) : (
				<Circle className="h-5 w-5 text-white/20" />
			)}
			<span
				className={`text-sm ${
					isActive
						? "font-medium text-white"
						: isComplete
							? "text-emerald-400"
							: "text-white/40"
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
			<div className="flex items-center gap-2 text-red-500">
				<XCircle className="h-4 w-4" />
				<span className="text-sm">
					Unable to check analysis status. Please refresh.
				</span>
			</div>
		);
	}

	if (status.status === "failed") {
		return (
			<div className="rounded-lg border border-red-500/20 bg-red-500/[0.05] p-4">
				<div className="flex items-center gap-2 text-red-400">
					<XCircle className="h-5 w-5" />
					<span className="font-medium">Analysis Failed</span>
				</div>
				<p className="mt-1 text-red-400/80 text-sm">{status.phase}</p>
			</div>
		);
	}

	if (status.status === "complete") {
		return (
			<div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
				<div className="flex items-center gap-2 text-emerald-400">
					<CheckCircle className="h-5 w-5" />
					<span className="font-medium">Analysis Complete</span>
				</div>
				{status.analysis && (
					<div className="mt-2 grid grid-cols-3 gap-4 text-sm">
						<div>
							<span className="text-white/40">Files</span>
							<p className="font-medium text-white">
								{status.analysis.totalFiles?.toLocaleString()}
							</p>
						</div>
						<div>
							<span className="text-white/40">Directories</span>
							<p className="font-medium text-white">
								{status.analysis.totalDirectories?.toLocaleString()}
							</p>
						</div>
						<div>
							<span className="text-white/40">Lines</span>
							<p className="font-medium text-white">
								{status.analysis.totalLines?.toLocaleString()}
							</p>
						</div>
					</div>
				)}
			</div>
		);
	}

	const currentPhaseIndex = getPhaseIndex(status.status);

	return (
		<div className="rounded-lg border border-blue-500/20 bg-blue-500/[0.05] p-4">
			<div className="flex items-center gap-2 text-blue-400">
				<Loader2 className="h-5 w-5 animate-spin" />
				<span className="font-medium">Analyzing Repository</span>
			</div>
			<p className="mt-1 text-blue-400/80 text-sm">{status.phase}</p>
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
