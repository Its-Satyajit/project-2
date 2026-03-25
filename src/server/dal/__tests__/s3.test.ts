import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock S3 Client
const { mockS3Send } = vi.hoisted(() => ({
	mockS3Send: vi.fn(),
}));

vi.mock("@aws-sdk/client-s3", () => {
	return {
		S3Client: vi.fn().mockImplementation(function (this: any) {
			this.send = mockS3Send;
		}),
		PutObjectCommand: vi.fn().mockImplementation(function (this: any, args: any) {
			Object.assign(this, args);
		}),
		GetObjectCommand: vi.fn().mockImplementation(function (this: any, args: any) {
			Object.assign(this, args);
		}),
	};
});

// Mock environment
vi.mock("../../env", () => ({
	env: {
		IDRIVE_E2_ACCESS_KEY: "test-access-key",
		IDRIVE_E2_SECRET_KEY: "test-secret-key",
		IDRIVE_E2_BUCKET_NAME: "test-bucket",
	},
}));

import type { AnalysisData } from "../../types/analysis";
import { fetchAnalysisData, uploadAnalysisData } from "../s3";

describe("S3 DAL", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("uploadAnalysisData", () => {
		it("should upload data to S3 and return a key", async () => {
			const mockData: AnalysisData = {
				commits: [],
				files: [],
				fileTree: [],
				fileTypeBreakdown: {},
			};

			mockS3Send.mockResolvedValueOnce({});

			const key = await uploadAnalysisData("repo-123", mockData);

			expect(key).toContain("analysis/repo-123/");
			expect(key).toContain(".json");
			expect(mockS3Send).toHaveBeenCalledWith(expect.any(Object));
		});
	});

	describe("fetchAnalysisData", () => {
		it("should fetch and parse data from S3", async () => {
			const mockData: AnalysisData = {
				commits: [],
				files: [],
				fileTree: [],
				fileTypeBreakdown: { ts: 10 },
			};

			const mockBody = {
				transformToString: vi.fn().mockResolvedValue(JSON.stringify(mockData)),
			};

			mockS3Send.mockResolvedValueOnce({ Body: mockBody });

			const result = await fetchAnalysisData("test-key.json");

			expect(result).toEqual(mockData);
			expect(mockS3Send).toHaveBeenCalledWith(expect.any(Object));
		});

		it("should throw error if Body is missing", async () => {
			mockS3Send.mockResolvedValueOnce({ Body: null });

			await expect(fetchAnalysisData("test-key.json")).rejects.toThrow(
				"No body in S3 response",
			);
		});
	});
});
