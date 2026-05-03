# Project Overview

Git Insights Analyzer is a deep repository analyzer built on the T3 Stack that provides structural analysis, hotspot detection, and visual insights into GitHub repositories. The application performs AST-based dependency analysis using Tree-sitter parsers, detects code hotspots based on churn/LOC/dependency weights, and visualizes data through interactive D3 treemaps and charts.

**Key Features:**
- Modern dashboard with TanStack Query and virtualization for large repo trees
- Deep analysis with dependency graphs and hotspot detection
- Virtualized D3.js treemaps for file navigation
- Hybrid file viewing with Shiki syntax highlighting
- Async worker pipeline powered by Inngest
- S3 storage for AST blobs with PostgreSQL metadata

**Type of Application:** Full-stack web application (Next.js + Elysia API)

---

## My Contributions

## Summary

Satyajit is the primary author and sole contributor to the Git Insights Analyzer project, responsible for the complete design, implementation, and maintenance of this sophisticated codebase intelligence platform. Over 134 commits, they built the entire application from scratch, including the database architecture, parsing engine, background job system, and comprehensive UI dashboard.

## Key Responsibilities

- Full-stack development using Next.js, Elysia, and PostgreSQL/Drizzle
- Design and implementation of the Tree-sitter WASM parsing engine for multi-language code analysis
- Architecture for S3 blob storage to handle large AST data
- Background job processing with Inngest for repository analysis
- Building interactive data visualizations with D3.js and Recharts
- Setting up CI/CD workflows and dependency management with Renovate

## Major Contributions

### Feature Development

- **Core Analysis Engine**: Built the repository analysis feature with new DALs, logic modules, database schema, and GitHub file content retrieval. Implemented Tree-sitter WASM parsing for multiple languages (TypeScript, Python, Rust, Go).
- **Database Architecture**: Designed and implemented the complete database schema for users, repositories, and analysis data with Drizzle ORM. Added analysis_logs table with parsed_imports column for tracking analysis history.
- **S3 Storage Integration**: Implemented S3 client for storing large AST blobs separately from PostgreSQL to prevent database bloat, with MessagePack and Brotli compression.
- **Background Job System**: Migrated from BullMQ to Inngest for Vercel-compatible background processing, enabling repository cloning, AST parsing, and hotspot detection.
- **AI Integration**: Added AI-powered components including dependency tooltip, hotspot explainer using WebLLM, and interactive AI insights panel.
- **Search & Filtering**: Implemented repository search endpoint with debounce client, global stats query, and FlexSearch integration.
- **Rate Limiting**: Built Redis sliding-window rate limiter with circuit breaker implementation for API protection.

### Bug Fixes

- **Navigation Routing**: Fixed navigation to route back to owner repo page instead of dashboard.
- **Dependency Issues**: Restored better-auth dependency used by configuration.
- **UI Type Safety**: Added typings, safety checks, and minor cleanup across UI components.
- **Treemap Accessibility**: Improved treemap accessibility and resize handling.
- **Error Handling**: Added contributors loading error handling and normalized error responses.

### Refactoring & Code Quality

- **Modular Architecture**: Extracted S3 client and bucket to shared module for reuse across the application.
- **Code Cleanup**: Cleaned up dead code and unused dependencies across the codebase.
- **Type Normalization**: Normalized imports and added consistent type formatting for StarsForksScatter and other components.
- **Layout Improvements**: Tidied layout.tsx imports and adjusted spacing/padding throughout the UI.

### DevOps / Tooling

- **Renovate Configuration**: Set up comprehensive Renovate configuration with automerge rules, package matching, and scheduled PRs. Migrated config to renovate.json5 format.
- **CI Workflow**: Created workflow to automatically delete merged PR branches.
- **Testing Infrastructure**: Added unit tests for repositories, analysis logs, S3 DAL, and hotspot logic using Vitest.

### Other Contributions

- **UI/UX Enhancements**: Built comprehensive dashboard with contributors components, license breakdown, top repos, repository hero with status badges, and responsive design.
- **Documentation**: Updated README with sequence diagrams and architecture documentation, replaced flowchart with detailed steps.
- **Accessibility**: Added aria-labels to icon-only buttons and implemented technical SEO improvements.
- **Initial Implementation**: Created the entire application from initial commit, implementing foundational UI components and database setup.

---

## Technologies & Tools Used

- **Framework**: Next.js 16 (App Router), Elysia API server
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Better-Auth
- **Storage**: S3 (IDrive E2) with MessagePack/Brotli compression
- **Background Jobs**: Inngest
- **Parsing**: Tree-sitter WASM (TypeScript, Python, Rust, Go parsers)
- **Visualization**: D3.js, Recharts, Framer Motion (now Motion)
- **State Management**: TanStack Query, TanStack Virtual
- **UI**: Tailwind CSS, shadcn/ui
- **Testing**: Vitest, Playwright
- **Search**: FlexSearch

## Notable Work

1. **Complete Full-Stack Application**: Single-handedly built a sophisticated codebase analysis platform from initial commit through production-ready features.

2. **Tree-sitter WASM Integration**: Implemented multi-language code parsing using Tree-sitter WASM modules, enabling deep dependency analysis across TypeScript, Python, Rust, and Go codebases.

3. **Hybrid Storage Architecture**: Designed a cost-effective storage solution that offloads large AST blobs to S3 while keeping relational metadata in PostgreSQL, preventing database bloat.

4. **Real-time Visualization**: Created interactive D3 treemaps and charts with virtualization to handle large repository file trees efficiently.

5. **Background Processing Pipeline**: Built a robust async worker system using Inngest that handles repository cloning, AST parsing, and hotspot detection without blocking the main application.
