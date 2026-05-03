import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Set env vars before any module imports
process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
process.env.GITHUB_PAT = "test-token";
process.env.DATABASE_URL = "postgres://test:test@localhost:5432/test";
process.env.REDIS_URL = "redis://localhost:6379";
// @ts-expect-error NODE_ENV is read-only but we need to set it for tests
process.env.NODE_ENV = "test";
process.env.BETTER_AUTH_SECRET = "test-secret";
process.env.REDIS_HOST = "localhost";
process.env.REDIS_PORT = "6379";
process.env.IDRIVE_E2_ACCESS_KEY = "test-access-key";
process.env.IDRIVE_E2_SECRET_KEY = "test-secret-key";
process.env.IDRIVE_E2_BUCKET_NAME = "test-bucket";
process.env.IDRIVE_E2_REGION = "eu-central-2";
process.env.IDRIVE_E2_ENDPOINT = "https://s3.eu-central-2.idrivee2.com";

vi.mock("~/env", () => ({
	env: {
		NEXT_PUBLIC_BASE_URL: "http://localhost:3000",
		GITHUB_PAT: "test-token",
		DATABASE_URL: "postgres://test:test@localhost:5432/test",
		REDIS_URL: "redis://localhost:6379",
		NODE_ENV: "test",
		BETTER_AUTH_SECRET: "test-secret",
		REDIS_HOST: "localhost",
		REDIS_PORT: "6379",
		IDRIVE_E2_ACCESS_KEY: "test-access-key",
		IDRIVE_E2_SECRET_KEY: "test-secret-key",
		IDRIVE_E2_BUCKET_NAME: "test-bucket",
		IDRIVE_E2_REGION: "eu-central-2",
		IDRIVE_E2_ENDPOINT: "https://s3.eu-central-2.idrivee2.com",
	},
}));

afterEach(() => {
	cleanup();
});
