import type { FileTreeItem } from "../../lib/treeUtils";

export interface CommitData {
	sha: string;
	message: string;
	authorName: string;
	committedAt: Date | null;
}

export interface FileData {
	id: string;
	path: string;
	size: number;
	sha: string;
	isDirectory: boolean;
	linesCount: number;
	extension: string | null;
	depth: number;
}

export interface AnalysisData {
	totalFiles?: number;
	totalDirectories?: number;
	totalLines?: number;
	totalCodeFiles?: number;
	samplingCoverage?: {
		analyzedFiles: number;
		totalFiles: number;
		percentage: number;
	};
	commits: CommitData[];
	files: FileData[];
	fileTree: FileTreeItem[];
	fileTypeBreakdown: Record<string, number>;
	dependencyGraph?: {
		nodes: Array<{
			path: string;
			score?: number;
			fanIn?: number;
			fanOut?: number;
			loc?: number;
		}>;
		edges: Array<{
			source: string;
			target: string;
		}>;
		metadata?: {
			totalNodes: number;
			totalEdges: number;
			languageBreakdown: Record<string, number>;
			unresolvedImports?: number;
		};
	};
	hotSpotData?: Array<{
		path: string;
		score: number;
		fanIn: number;
		fanOut: number;
	}>;
}
