import { eq } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { db } from "../db";
import { analysisResults, repositories } from "../db/schema";

export const debugRoute = new Elysia().post(
	"/debug",
	async ({ body, set }) => {
		const { repoId, action } = body;

		if (!repoId) {
			set.status = 400;
			return { error: "Missing repoId" };
		}

		try {
			switch (action) {
				case "clear-analysis": {
					// Delete analysis results for this repository
					await db
						.delete(analysisResults)
						.where(eq(analysisResults.repositoryId, repoId));

					// Reset repository status to pending
					await db
						.update(repositories)
						.set({
							analysisStatus: "pending",
							analysisPhase: null,
						})
						.where(eq(repositories.id, repoId));

					return {
						success: true,
						message: "Analysis cleared and status reset",
					};
				}
				case "reset-status": {
					// Reset repository status to pending
					await db
						.update(repositories)
						.set({
							analysisStatus: "pending",
							analysisPhase: null,
						})
						.where(eq(repositories.id, repoId));

					return { success: true, message: "Status reset to pending" };
				}
				case "queue-status": {
					// Check queue status
					const { analysisQueue } = await import("../queue/index");
					const waiting = await analysisQueue.getWaitingCount();
					const active = await analysisQueue.getActiveCount();
					const completed = await analysisQueue.getCompletedCount();
					const failed = await analysisQueue.getFailedCount();

					// Get job IDs
					const jobs = await analysisQueue.getJobs();

					return {
						waiting,
						active,
						completed,
						failed,
						recentJobIds: jobs.slice(0, 5).map((j: any) => j.id),
					};
				}
				case "trigger-analysis": {
					// Manually trigger a new analysis job for this repo
					const repo = await db
						.select()
						.from(repositories)
						.where(eq(repositories.id, repoId))
						.limit(1);

					if (!repo[0]) {
						return { error: "Repository not found" };
					}

					const r = repo[0];
					const { addAnalysisJob } = await import("../queue/worker");

					// Parse owner/repo from full_name
					const parts = (r.fullName ?? "").split("/");
					const owner = parts[0] ?? "";
					const repoName = parts[1] ?? "";

					await addAnalysisJob({
						repoId: r.id,
						owner,
						repo: repoName,
						branch: r.defaultBranch ?? "main",
						githubUrl: r.url ?? "",
					});

					return { success: true, message: "Analysis job triggered" };
				}
				case "run-analysis": {
					// Run analysis directly without queue (for testing)
					const repo = await db
						.select()
						.from(repositories)
						.where(eq(repositories.id, repoId))
						.limit(1);

					if (!repo[0]) {
						return { error: "Repository not found" };
					}

					const r = repo[0];
					const parts = (r.fullName ?? "").split("/");
					const owner = parts[0] ?? "";
					const repoName = parts[1] ?? "";

					try {
						// Import and run analysis directly
						const { runAnalysisDirect } = await import("../queue/worker");
						const result = await runAnalysisDirect({
							repoId: r.id,
							owner,
							repo: repoName,
							branch: r.defaultBranch ?? "main",
							githubUrl: r.url ?? "",
						});

						return { success: true, result };
					} catch (err) {
						return {
							error: err instanceof Error ? err.message : "Analysis failed",
						};
					}
				}
				case "debug-analysis": {
					// Run analysis with detailed debug output - simplified version
					const repo = await db
						.select()
						.from(repositories)
						.where(eq(repositories.id, repoId))
						.limit(1);

					if (!repo[0]) {
						return { error: "Repository not found" };
					}

					const r = repo[0];
					const parts = (r.fullName ?? "").split("/");
					const owner = parts[0] ?? "";
					const repoName = parts[1] ?? "";

					try {
						// Import the analysis functions directly
						const { getRepoTree, getFileContentFromRaw } = await import(
							"../octokit"
						);
						const { performDependencyAnalysis, detectLanguage } = await import(
							"../logic/dependencyAnalysis"
						);
						const { resolveImport } = await import(
							"../logic/parsers/pathResolver"
						);
						const { getExtension } = await import("~/lib/getExtension");

						// Hardcoded CODE_EXTENSIONS for now
						const CODE_EXTENSIONS = [
							"ts",
							"tsx",
							"js",
							"jsx",
							"mjs",
							"cjs",
							"vue",
							"svelte",
							"py",
							"rs",
							"go",
							"java",
							"cpp",
							"c",
							"h",
							"hpp",
							"rb",
							"php",
							"swift",
							"kt",
							"scala",
							"cs",
						];

						// Get file tree
						const repoTree = await getRepoTree({
							owner,
							repo: repoName,
							branch: r.defaultBranch ?? "main",
						});

						const codeFiles = repoTree
							.filter(
								(f) =>
									f.type === "blob" &&
									f.size !== undefined &&
									f.size > 0 &&
									f.size <= 100000 &&
									CODE_EXTENSIONS.includes(getExtension(f.path) || ""),
							)
							.slice(0, 100);

						// Get file contents
						const filesContent = [];
						for (const file of codeFiles.slice(0, 30)) {
							const content = await getFileContentFromRaw({
								owner,
								repo: repoName,
								branch: r.defaultBranch ?? "main",
								path: file.path,
							});
							if (content) {
								filesContent.push({
									path: file.path,
									content,
									language: detectLanguage(file.path) || "typescript",
								});
							}
						}

						// Get first file's imports as sample
						const sampleImports: any[] = [];
						if (filesContent.length > 0) {
							const { parseTypescript } = await import(
								"../logic/parsers/typescript"
							);
							const firstFile = filesContent[0]!;
							const parsed = await parseTypescript(
								firstFile.content,
								firstFile.path,
							);

							// Try resolving each import
							for (const imp of parsed.imports.slice(0, 5)) {
								const resolved = resolveImport(imp.source, firstFile.path);
								sampleImports.push({
									source: imp.source,
									isExternal: resolved.isExternal,
									resolved: resolved.resolved,
								});
							}
						}

						// Run dependency analysis
						const result = await performDependencyAnalysis(filesContent);

						return {
							analysis: {
								filesProcessed: filesContent.length,
								nodesCreated: result.graph.nodes.length,
								edgesCreated: result.graph.edges.length,
								sampleNodes: result.graph.nodes
									.slice(0, 5)
									.map((n) => ({ path: n.path, imports: n.imports })),
								sampleEdges: result.graph.edges.slice(0, 10),
								importDebug: sampleImports,
							},
						};
					} catch (err) {
						return {
							error: err instanceof Error ? err.message : "Analysis failed",
							stack: err instanceof Error ? err.stack : null,
						};
					}
				}
				case "inspect-graph": {
					// Inspect the stored dependency graph
					const results = await db
						.select({
							dependencyGraphJson: analysisResults.dependencyGraphJson,
						})
						.from(analysisResults)
						.where(eq(analysisResults.repositoryId, repoId))
						.limit(1);

					if (results.length === 0) {
						return { error: "No analysis results found" };
					}

					const result = results[0];
					if (!result) {
						return { error: "No analysis results found" };
					}

					const graph = result.dependencyGraphJson as {
						nodes: Array<{ id: string; path: string; imports: number }>;
						edges: Array<{ source: string; target: string }>;
						metadata: {
							totalNodes: number;
							totalEdges: number;
						};
					} | null;

					if (!graph) {
						return { error: "No dependency graph stored" };
					}

					// Count non-zero fan-out
					const nodesWithImports = graph.nodes.filter((n) => n.imports > 0);

					// Sample edges
					const sampleEdges = graph.edges.slice(0, 10);

					// Sample node paths - check if they match what we're looking for
					const sampleNodePaths = graph.nodes.slice(0, 10).map((n) => n.path);

					// Check if edges might be created with different path format
					const allPaths = graph.nodes.map((n) => n.path);

					return {
						metadata: graph.metadata,
						totalNodes: graph.nodes.length,
						totalEdges: graph.edges.length,
						nodesWithImports: nodesWithImports.length,
						sampleEdges,
						sampleNodePaths,
						allPathsSample: allPaths.slice(0, 20),
					};
				}
				case "check-parsed-imports": {
					// Check what the parser actually returns
					const results = await db
						.select({
							dependencyGraphJson: analysisResults.dependencyGraphJson,
						})
						.from(analysisResults)
						.where(eq(analysisResults.repositoryId, repoId))
						.limit(1);

					if (!results[0]?.dependencyGraphJson) {
						return { error: "No graph found" };
					}

					const graph = results[0].dependencyGraphJson as any;

					// Return first 3 nodes with their import counts
					return {
						sampleNodes: graph.nodes.slice(0, 5).map((n: any) => ({
							path: n.path,
							imports: n.imports,
							loc: n.loc,
						})),
					};
				}
				default:
					set.status = 400;
					return { error: "Invalid action" };
			}
		} catch (error) {
			console.error("Debug action failed:", error);
			set.status = 500;
			return { error: "Internal server error" };
		}
	},
	{
		body: t.Object({
			repoId: t.String(),
			action: t.String(),
		}),
	},
);
