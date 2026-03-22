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
- [x] Persistence (**Decision: Structured columns + JSON `fileTree` in `analysis_results`**)

## Implementation
- [x] Implement `getFileContent` in Octokit DAL
- [x] Create `analysis_results` DAL
- [x] Implement iterative `performBasicAnalysis` logic
- [x] Add Hybrid LOC counting (Top 10 extraction + heuristic)
- [x] Integrate analysis into `/analyze` endpoint
- [x] Verify results via script and manual API test

# Phase 4: Dashboard UI (Day 7-10)

## Planning & Design (Grill-Me)
- [x] Dashboard Data Flow (React Query vs Zustand) -> **Decision: React Query for fetching.**
- [x] Routing & Initial State -> **Decision: `/dashboard/[repoId]` triggers analysis if missing.**
- [x] Visualization Details (Pie vs Bar)
- [x] File Explorer Interaction (Tree vs Flat) -> **Decision: Nested Collapsible Tree.**

## Implementation
- [x] Setup `shadcn/charts` and dependencies
- [x] Implement `GET /api/dashboard/:repoId` (Optimized with JSON persistence)
- [x] Create Dashboard Layout with Sidebar (Using `CollapsibleFileTree`)
- [x] Build Stat Cards (Total Files, LOC, etc.)
- [x] Build File Type Chart (Donut/Bar)
- [x] Implement Virtualized File Explorer (`@tanstack/react-virtual`)
- [x] Add Skeleton Loaders and Empty States

# Phase 5: Search & Filtering (Day 10-12)

## Planning & Design (Guided Learning)
- [x] Search Strategy (Client vs Server) -> **Decision: Client-side for instant feedback.**
- [ ] UI Placement -> **Decision: Inside `VirtualizedFileTree` header.**

## Implementation
- [/] Add `searchQuery` state to `VirtualizedFileTree`
- [ ] Implement filtering logic in `visibleNodes` memo
- [ ] UI: Add `Input` component and search icon
- [ ] Add "No results found" empty state
