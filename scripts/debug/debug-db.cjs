#!/usr/bin/env node

/**
 * Debug script to access the database directly using raw SQL.
 * Usage: node debug-db.cjs [command]
 * Commands:
 *   repos          - List all repositories
 *   analysis <id>  - Show analysis results for repository id
 *   edges <id>     - Show edge count and sample edges
 *   status <id>    - Show repository status
 *   clear <id>     - Clear analysis results for repository
 *   reset <id>     - Reset repository status to pending
 *   sql <query>    - Execute arbitrary SQL (use with caution)
 */

require("dotenv").config();
const postgres = require("postgres");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	console.error("DATABASE_URL not found in environment");
	process.exit(1);
}

const client = postgres(connectionString);

async function main() {
	const command = process.argv[2] || "repos";
	const arg = process.argv[3];
	const arg2 = process.argv[4]; // for sql query

	try {
		switch (command) {
			case "repos":
				await listRepositories();
				break;
			case "analysis":
				if (!arg) {
					console.error("Usage: node debug-db.cjs analysis <repoId>");
					process.exit(1);
				}
				await showAnalysis(arg);
				break;
			case "edges":
				if (!arg) {
					console.error("Usage: node debug-db.cjs edges <repoId>");
					process.exit(1);
				}
				await showEdges(arg);
				break;
			case "status":
				if (!arg) {
					console.error("Usage: node debug-db.cjs status <repoId>");
					process.exit(1);
				}
				await showStatus(arg);
				break;
			case "clear":
				if (!arg) {
					console.error("Usage: node debug-db.cjs clear <repoId>");
					process.exit(1);
				}
				await clearAnalysis(arg);
				break;
			case "reset":
				if (!arg) {
					console.error("Usage: node debug-db.cjs reset <repoId>");
					process.exit(1);
				}
				await resetStatus(arg);
				break;
			case "sql":
				if (!arg) {
					console.error(
						'Usage: node debug-db.cjs sql "SELECT * FROM repositories"',
					);
					process.exit(1);
				}
				await executeSQL(arg);
				break;
			default:
				console.log(
					"Available commands: repos, analysis, edges, status, clear, reset, sql",
				);
		}
	} catch (error) {
		console.error("Error:", error);
	} finally {
		await client.end();
	}
}

async function listRepositories() {
	const repos =
		await client`SELECT id, owner, name, analysis_status, analysis_phase FROM repositories ORDER BY created_at DESC`;
	console.log("Repositories:");
	repos.forEach((repo) => {
		console.log(
			`  ${repo.id}: ${repo.owner}/${repo.name} - ${repo.analysis_status} (${repo.analysis_phase || "no phase"})`,
		);
	});
}

async function showAnalysis(repoId) {
	const analysis =
		await client`SELECT * FROM analysis_results WHERE repository_id = ${repoId}`;

	if (analysis.length === 0) {
		console.log("No analysis results found");
		return;
	}

	const result = analysis[0];
	console.log("Analysis results:");
	console.log(`  Total files: ${result.total_files}`);
	console.log(`  Total directories: ${result.total_directories}`);
	console.log(`  Total lines: ${result.total_lines}`);
	console.log(
		`  File type breakdown: ${JSON.stringify(result.file_type_breakdown_json)}`,
	);

	const graph = result.dependency_graph_json;
	if (graph) {
		console.log(`  Nodes: ${graph.metadata.totalNodes}`);
		console.log(`  Edges: ${graph.metadata.totalEdges}`);
		console.log(
			`  Language breakdown: ${JSON.stringify(graph.metadata.languageBreakdown)}`,
		);
		console.log(`  Unresolved imports: ${graph.metadata.unresolvedImports}`);
	}
}

async function showEdges(repoId) {
	const analysis =
		await client`SELECT dependency_graph_json FROM analysis_results WHERE repository_id = ${repoId}`;

	if (analysis.length === 0) {
		console.log("No analysis results found");
		return;
	}

	const graph = analysis[0].dependency_graph_json;
	if (!graph) {
		console.log("No dependency graph found");
		return;
	}

	console.log(`Total edges: ${graph.metadata.totalEdges}`);
	console.log(`Total nodes: ${graph.metadata.totalNodes}`);

	if (graph.edges && graph.edges.length > 0) {
		console.log("\nFirst 10 edges:");
		graph.edges.slice(0, 10).forEach((edge) => {
			console.log(`  ${edge.source} -> ${edge.target}`);
		});
	} else {
		console.log("No edges found in dependency graph");
	}

	if (graph.nodes && graph.nodes.length > 0) {
		console.log("\nTop 5 nodes by imports:");
		const sortedNodes = [...graph.nodes].sort((a, b) => b.imports - a.imports);
		sortedNodes.slice(0, 5).forEach((node) => {
			console.log(`  ${node.path} (${node.imports} imports)`);
		});
	}
}

async function showStatus(repoId) {
	const repos =
		await client`SELECT id, owner, name, analysis_status, analysis_phase, default_branch, primary_language FROM repositories WHERE id = ${repoId}`;

	if (repos.length === 0) {
		console.log("Repository not found");
		return;
	}

	const repo = repos[0];
	console.log("Repository status:");
	console.log(`  ID: ${repo.id}`);
	console.log(`  Owner/Name: ${repo.owner}/${repo.name}`);
	console.log(`  Status: ${repo.analysis_status}`);
	console.log(`  Phase: ${repo.analysis_phase || "null"}`);
	console.log(`  Default branch: ${repo.default_branch}`);
	console.log(`  Language: ${repo.primary_language}`);
}

async function clearAnalysis(repoId) {
	await client`DELETE FROM analysis_results WHERE repository_id = ${repoId}`;
	console.log(`Deleted analysis results for ${repoId}`);

	await client`UPDATE repositories SET analysis_status = 'pending', analysis_phase = NULL WHERE id = ${repoId}`;
	console.log(`Reset repository status to pending`);
}

async function resetStatus(repoId) {
	await client`UPDATE repositories SET analysis_status = 'pending', analysis_phase = NULL WHERE id = ${repoId}`;
	console.log(`Reset repository status to pending`);
}

async function executeSQL(query) {
	console.log(`Executing: ${query}`);
	const result = await client.unsafe(query);
	console.log("Result:", result);
}

main();
