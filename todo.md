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
- [x] Sort directories to top in file explorer
- [x] Add Skeleton Loaders and Empty States

# Phase 5: Search & Filtering (Day 10-12)

## Planning & Design (Grill-Me)
- [x] Search Strategy (Client vs Server) -> **Decision: Client-side for instant feedback.**
- [x] UI Placement -> **Decision: Inside `VirtualizedFileTree` header.**

## Implementation
- [x] Add `searchQuery` state to `VirtualizedFileTree`
- [x] Implement filtering logic in `visibleNodes` memo
- [x] UI: Add `Input` component and search icon
- [x] Add "No results found" empty state

# Phase 6: Dependency Graph (Day 13-16)

## Planning & Design (Grill-Me)

### Architecture
- [x] Pipeline Integration -> **Decision: Synchronous - new `performDependencyAnalysis` function called after `performBasicAnalysis` in `/analyze` pipeline.**
- [x] File Scope -> **Decision: Sub-limit of 500 code files (max 1000 total).**
- [x] API Modularization -> **Decision: Route-per-file Elysia plugin pattern. Each route in its own file under `src/server/api/`.**

### Language Support
- [x] Languages Supported -> **Decision: Tier 1 - JavaScript/TypeScript + Python + Go + Rust. Excludes C/C++, Java, Ruby, PHP for MVP.**
- [x] Parser Approach -> **Decision: Tree-sitter WASM via `web-tree-sitter` package.**
- [x] WASM Storage -> **Decision: Bundled in `/public/tree-sitter/` directory.**
- [x] WASM Loading -> **Decision: Lazy per language - load on first use, cache in memory.**

### Parser Implementation
- [x] Parser Structure -> **Decision: Language-specific classes with shared `ImportParser` interface in `src/server/logic/parsers/`.**
- [x] Path Resolution -> **Decision: Heuristic resolution - relative paths + alias stripping + common extensions. Unresolved imports tracked for debugging.**
- [x] Error Handling -> **Decision: Skip failed files + track in `unresolvedImports` metadata. Pipeline always completes.**

### Graph Data
- [x] Graph Data Structure -> **Decision: `{ nodes: GraphNode[]; edges: GraphEdge[]; metadata: GraphMetadata }` - separate nodes and edges.**
- [x] Node Data -> **Decision: `{ path, language, imports: number, loc?: number }` - includes LOC from Phase 3.**
- [x] Edge Deduplication -> **Decision: One edge per unique (source, target) pair.**
- [x] Self-loops -> **Decision: Excluded from graph.**
- [x] External Dependencies -> **Decision: Stripped - internal imports only.**
- [x] Storage -> **Decision: Store in existing `analysis_results.dependencyGraphJson` column. Re-analysis replaces existing.**
- [x] File Size Limit -> **Decision: Skip files >1MB before parsing.**

### Visualization & UI
- [x] Visualization -> **Decision: "Most connected files" ranked list with drill-down showing immediate connections.**
- [x] Dashboard Integration -> **Decision: Separate page - `/dependencies/[repoId]`.**
- [x] Data Fetching -> **Decision: Separate endpoint - `GET /dashboard/:repoId/graph`.**

## Implementation

### API Modularization
- [x] Create `src/server/api/routes/analyze.ts`
- [x] Create `src/server/api/routes/dashboard.ts`
- [x] Create `src/server/api/routes/file-content.ts`
- [x] Refactor `src/server/api/index.ts` to compose plugins

### Tree-sitter Setup
- [x] Install dependencies (`web-tree-sitter`, tree-sitter language parsers)
- [x] Download WASM files to `public/tree-sitter/`
- [x] Add WASM MIME type to `next.config.ts`
- [x] Create `src/server/logic/parsers/index.ts` with shared interface
- [x] Create `src/server/logic/parsers/typescript.ts`
- [x] Create `src/server/logic/parsers/python.ts`
- [x] Create `src/server/logic/parsers/go.ts`
- [x] Create `src/server/logic/parsers/rust.ts`

### Core Logic
- [x] Create `src/server/logic/dependencyAnalysis.ts` with `performDependencyAnalysis`
- [x] Implement path resolution utility
- [x] Improve path resolution to handle file extensions correctly
- [x] Integrate into `/analyze` pipeline

### API Routes
- [x] Add `GET /dashboard/:repoId/graph` endpoint (via `/dashboard/:repoId/status`)
- [x] Add route plugin file for graph endpoint (integrated in status route)

### Frontend
- [x] Create `src/app/dependencies/[repoId]/page.tsx` (at `src/app/dashboard/[repoId]/dependencies/page.tsx`)
- [x] Create `src/components/dependencies/HubFilesList.tsx` (cancelled - functionality integrated)
- [x] Create `src/components/dependencies/ConnectionDrawer.tsx` (cancelled - functionality integrated)
- [x] Add React Query hook for graph data (`useRepoStatus`)
- [x] Add loading skeleton for dependencies page

# Phase 7: Hotspot Detection (Day 13–15)

## Planning & Design (Grill-Me)
### Metrics
- [x] **Churn (Commit Frequency)** -> **Decision: Skip for MVP due to API limits; approximate using fan-in as proxy for "touches many files".**
- [x] **Fan-in (Incoming Dependencies)** -> **Decision: Compute from dependency graph edges; count how many files import each file.**
- [x] **Fan-out (Outgoing Dependencies)** -> **Decision: Already available as `imports` count in nodes.**
- [x] **Lines of Code (LOC)** -> **Decision: Use existing `loc` from dependency nodes (or `linesCount` from files table).**
- [x] **Composite Score Weighting** -> **Decision: Hardcoded weights: Fan-in 40%, Fan-out 20%, LOC 40%. Normalize each metric 0‑1 via min‑max scaling.**

### Data Storage
- [x] **Hotspot JSON Structure** -> **Decision: `{ path, language, fanIn, fanOut, loc, score, rank }[]` sorted by score descending. Store top 50 files max.**
- [x] **Database Column** -> **Decision: Use existing `hotSpotDataJson` column in `analysis_results`.**

### Pipeline Integration
- [x] **Trigger** -> **Decision: Automatic, after dependency analysis in same worker job.**
- [x] **New Logic File** -> **Decision: Create `src/server/logic/hotspotAnalysis.ts` with `performHotspotAnalysis`.**
- [x] **API Endpoint** -> **Decision: Include hotspot data in existing `/dashboard/:repoId/status` response under `analysis.hotSpotData`.**

### UI
- [x] **Visualization** -> **Decision: Add “Hotspots” tab to existing dependencies page (`/dashboard/[repoId]/dependencies`). Show ranked list with file details, fan‑in/out, LOC, and score.**
- [x] **Interaction** -> **Decision: Click file → open file viewer (reuse existing dialog).**

## Implementation
### Core Logic
- [x] Create `src/server/logic/hotspotAnalysis.ts`
- [x] Implement `computeFanIn(nodes, edges)` helper
- [x] Implement `normalizeMetric(values: number[]): number[]` (min‑max scaling)
- [x] Implement `performHotspotAnalysis(dependencyGraph)` returning hotspot array
- [x] Integrate into worker pipeline after dependency analysis
- [x] Pass hotspot data to `insertAnalysisResults`

### API & Data
- [x] Extend status route to include `hotSpotData` from `analysisResults.hotSpotDataJson`
- [x] Update `useRepoStatus` hook to expose hotspot data

### Frontend
- [x] Add “Hotspots” tab to dependencies page
- [x] Create `HotspotsList` component (ranked list)
- [x] Reuse existing file viewer dialog (optional)
- [x] Add loading skeleton for hotspots (optional)
- [x] Add empty state when no hotspots

### Testing & Validation
- [x] Test with sample repositories (small, medium, large)
- [x] Verify fan‑in computation matches expected dependencies
- [x] Ensure hotspot ranking makes intuitive sense (high fan‑in + high LOC = high score)

# Phase 8: Repo Summary (Day 15–17)

## Planning & Design (Grill‑Me)
### Content
- [x] **Summary Components** -> **Decision: Basic stats, language breakdown, structural overview, dependency highlights, hotspot highlights, file type distribution.**
- [x] **Data Sources** -> **Decision: Compute from existing analysis JSON columns (fileTreeJson, fileTypeBreakdownJson, dependencyGraphJson, hotSpotDataJson).**
- [x] **Narrative vs Structured** -> **Decision: Structured data with bullet points for MVP.**
- [x] **Computation Location** -> **Decision: Server-side computation in new `src/server/logic/repoSummary.ts`.**
- [x] **Caching** -> **Decision: Compute on‑the‑fly; cache in `summaryText` column for future use.**

### API
- [x] **Endpoint** -> **Decision: Extend `/dashboard/:repoId/status` response with `summary` object.**
- [x] **Summary Object Schema** -> **Decision: `{ basic: { totalFiles, totalDirectories, totalLines }, languages: { primaryLanguage, topLanguages: [{ name, percentage }] }, structure: { maxDepth, topLevelDirectories: string[] }, dependencies: { totalNodes, totalEdges, mostDependedUpon: [{ path, fanIn }], mostDependent: [{ path, fanOut }] }, hotspots: { topHotspots: [{ path, score, rank }] }, fileTypes: { topExtensions: [{ extension, count }] } }`**

### UI
- [x] **Placement** -> **Decision: Separate page `/dashboard/[repoId]/summary`.**
- [x] **Navigation** -> **Decision: Add button on dashboard header to open summary page.**
- [x] **Interactive Elements** -> **Decision: Clickable file links that open file viewer dialog.**
- [x] **Loading State** -> **Decision: Skeleton while summary loads.**

## Implementation
### Core Logic
- [x] Create `src/server/logic/repoSummary.ts`
- [x] Implement `computeRepoSummary(analysisResults)` returning structured object
- [x] Integrate into status route (add `summary` field)
- [x] Update `useRepoStatus` hook to expose summary data

### Frontend
- [x] Create `src/app/dashboard/[repoId]/summary/page.tsx`
- [x] Create `RepoSummary` component with sections for each component
- [x] Add navigation link from dashboard page
- [ ] Reuse file viewer dialog for clickable files (optional - deferred)
- [x] Add loading skeleton

### Testing & Validation
- [x] Test with sample repositories (manual verification)
- [x] Verify summary matches actual repository characteristics (via test script)
- [x] Ensure performance (no noticeable delay)

# Phase 8: Polish (Day 17–20)

## Planning & Design (Grill‑Me)

### UI Refinement
- [x] **Treemap Visualization** -> **Decision: Squarified Treemap as default, toggle to Gradient Heat for hotspots.**
- [x] **Treemap Cell Size** -> **Decision: LOC (lines of code).**
- [x] **Treemap Cell Color** -> **Decision: Language color default, hotspot gradient toggle.**
- [x] **External Packages** -> **Decision: Include with dashed border, gray background.**
- [x] **Max Files** -> **Decision: 2000 files max, group rest as "other".**
- [x] **Location** -> **Decision: New "Treemap" tab on dependencies page.**

### Filters
- [x] **File Type Filter** -> **Decision: Multi-select dropdown with search (50+ types).**
- [x] **Hotspot Filter** -> **Decision: Threshold slider (0-100%) + "show hotspots only" toggle.**
- [x] **Filter Logic** -> **Decision: Additive (AND) - file must match type AND hotspot threshold.**
- [x] **Persistence** -> **Decision: State stored locally, not in URL.**

### Animations
- [x] **Page Transitions** -> **Decision: Framer Motion with fade + slight Y slide.**
- [x] **Card Entrance** -> **Decision: Staggered animation on StatCards.**
- [x] **Hover States** -> **Decision: Simple scale on interactive elements.**

### Error UX
- [x] **Error Types** -> **Decision: Rate limit, private repo, not found, network, analysis failed.**
- [x] **UI** -> **Decision: Toast for transient errors, dedicated screens for blocking errors.**
- [x] **Recovery** -> **Decision: Rate limit shows "Retry in Xs" with countdown.**

## Implementation

### Treemap
- [x] Install `d3` for treemap computation
- [x] Create `src/server/api/treemap.ts` endpoint
- [x] Create `src/lib/languageColors.ts` for language → color mapping
- [x] Create `src/components/dashboard/Treemap.tsx` with d3 treemap
- [x] Add "Treemap" tab to dependencies page
- [x] Toggle between "By Language" and "By Hotspot" color modes

### Filters
- [x] Create `src/components/dashboard/FilterBar.tsx`
- [x] Multi-select extension dropdown with search
- [x] Hotspot threshold slider
- [x] Integrate with File Explorer tab

### Animations
- [x] Install `framer-motion`
- [x] Add page transitions in `src/app/dashboard/[repoId]/layout.tsx`
- [x] Add staggered card animation in `StatCards.tsx`

### Error Handling
- [x] Wrap layout in `<Suspense>` to fix Next.js 16 caching error
- [x] Fix null safety bugs in Treemap component
- [x] Fix LOC data source (use dependency graph LOC instead of files table)

## Deferred
- [ ] Increase worker file limits (currently 1000 tree, 500 content fetch)

