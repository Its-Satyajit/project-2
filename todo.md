# Phase 2: GitHub Integration

## Planning & Design (Grill-Me)
- [x] Determine Data Fetching Architecture (Sync vs Async) & Repository Limits -> **Decision: Synchronous + Hard Limits (max 1000 files). Background jobs will be added later.**
- [x] Choose GitHub API Protocol (REST vs GraphQL) & Auth Strategy -> **Decision: REST API (Octokit) with flexible Auth (server PAT by default, user PAT or GitHub OAuth later).**
- [x] Define Database Schema (repositories, files, commits) -> **Decision: Option A: Link `files` and `commits` directly to `repositories` via `repoId`. No join table for now.**
- [x] Plan Error Handling Strategy (rate limits, 404s, private repos) -> **Decision: Standard HTTP Status Codes (404, 429, 413) with frontend toast notifications.**

## Implementation (Day 3-5)
- [x] Setup GitHub API client (Octokit / fetch)
- [x] Update DB Schema (Drizzle ORM)
- [x] Implement Metadata fetching
- [x] Implement File Tree fetching
- [x] Implement Commit fetching
- [x] Handle API Errors appropriately

# Phase 3: Basic Analysis (Day 5-7)

## Planning & Design (Grill-Me)
- [x] Define Analysis Trigger (**Decision: Synchronous in `/analyze` API**)
- [x] Dataset Scope (**Decision: Full tree for counts, top 1000 for details**)
- [x] LOC Strategy (**Decision: Hybrid - Top 10 files exact, others heuristic**)
- [x] Persistence (**Decision: Structured columns in `analysis_results`**)

## Implementation
- [ ] Implement `getFileContent` in Octokit DAL
- [ ] Create `analysis_results` DAL
- [ ] Implement iterative `performBasicAnalysis` logic
- [ ] Add Hybrid LOC counting (Top 10 extraction + heuristic)
- [ ] Integrate analysis into `/analyze` endpoint
- [ ] Verify results via script and manual API test
