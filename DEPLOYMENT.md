# Deployment Guide

This project is optimized for deployment on **Vercel** with an external worker for analysis.

## 1. Web Deployment (Vercel)

### Environment Variables
Set the following variables in your Vercel project settings:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Pooling recommended) |
| `REDIS_HOST` | Redis host (Upstash recommended) |
| `REDIS_PORT` | Redis port |
| `REDIS_PASSWORD` | Redis password |
| `GITHUB_PAT` | GitHub Personal Access Token |
| `BETTER_AUTH_SECRET` | Secret for authentication |
| `BETTER_AUTH_URL` | Your deployment URL (e.g., `https://your-app.vercel.app`) |

### Build Settings
- **Framework Preset**: Next.js
- **Build Command**: `pnpm build`
- **Output Directory**: `.next`

---

## 2. Worker Deployment (External)

Because Vercel Serverless Functions have execution time limits (10s-90s), the background analysis worker must be hosted on a persistent platform like **Render**, **Railway**, or **DigitalOcean**.

### Steps:
1.  **Clone the repo** to your persistent provider.
2.  **Install dependencies**: `pnpm install`
3.  **Start the worker**: `pnpm start:worker`
    - Ensure the worker has access to the SAME `DATABASE_URL` and `REDIS` instance as the Vercel app.

### Config for Worker (Environment):
| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `REDIS_HOST` | (Same as Vercel) |
| `DATABASE_URL` | (Same as Vercel) |

---

## 3. WASM Support
The project uses `tree-sitter` WASM files for code analysis. These are bundled automatically in `src/server/logic/parsers/wasm/` to ensure they work in Vercel's serverless environment.

## 4. Rate Limiting
Rate limiting is handled via Redis. If Redis is unavailable or the circuit breaker trips, the system will fail-open (allow requests) to ensure availability.
