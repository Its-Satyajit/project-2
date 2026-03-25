import { describe, expect, it, vi } from "vitest";
import "dotenv/config";
import type { AnalysisData } from "../../types/analysis";
import { fetchAnalysisData, uploadAnalysisData } from "../s3";

// We need to ensure the real env vars are used, not the ones from vitest.setup.ts
vi.mock("~/env", async (importActual) => {
	const actual = await importActual<any>();
	return {
		...actual,
		env: {
			...actual.env,
			IDRIVE_E2_ACCESS_KEY: process.env.IDRIVE_E2_ACCESS_KEY,
			IDRIVE_E2_SECRET_KEY: process.env.IDRIVE_E2_SECRET_KEY,
			IDRIVE_E2_BUCKET_NAME: process.env.IDRIVE_E2_BUCKET_NAME,
			IDRIVE_E2_REGION: process.env.IDRIVE_E2_REGION,
			IDRIVE_E2_ENDPOINT: process.env.IDRIVE_E2_ENDPOINT,
		},
	};
});

describe("S3 Integration Test", () => {
	it("should upload and fetch data from the real S3 bucket", async () => {
		const repoId = `test-repo-${Date.now()}`;
		const testData: AnalysisData = {
			commits: [],
			files: [],
			fileTree: [],
			fileTypeBreakdown: { ts: 1 },
		};

		console.log(`Testing with bucket: ${process.env.IDRIVE_E2_BUCKET_NAME}`);
		console.log(`Endpoint: ${process.env.IDRIVE_E2_ENDPOINT}`);

		// 1. Upload
		const key = await uploadAnalysisData(repoId, testData);
		expect(key).toContain(`analysis/${repoId}`);
		console.log(`✅ Upload successful! Key: ${key}`);

		// 2. Fetch
		const fetchedData = await fetchAnalysisData(key);
		expect(fetchedData).toEqual(testData);
		console.log("✅ Download successful and content matches!");

		console.log("\n✨ S3 Connection Test Passed! ✨");
	}, 30000); // 30s timeout for network
});
