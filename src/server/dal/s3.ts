import {
	DeleteObjectsCommand,
	GetObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { env } from "../../env";
import type { AnalysisData } from "../types/analysis";
import { packAnalysisData, unpackAnalysisData } from "./serialization";

const s3Client = new S3Client({
	region: env.IDRIVE_E2_REGION,
	endpoint: env.IDRIVE_E2_ENDPOINT.startsWith("http")
		? env.IDRIVE_E2_ENDPOINT
		: `https://${env.IDRIVE_E2_ENDPOINT}`,
	credentials: {
		accessKeyId: env.IDRIVE_E2_ACCESS_KEY,
		secretAccessKey: env.IDRIVE_E2_SECRET_KEY,
	},
});

const BUCKET_NAME = env.IDRIVE_E2_BUCKET_NAME;

/**
 * Uploads analysis data with MessagePack + Brotli compression.
 * Automatically cleans up old snapshots beyond the retention limit.
 */
export async function uploadAnalysisData(
	repoId: string,
	data: AnalysisData,
): Promise<string> {
	const prefix = env.NODE_ENV === "development" ? "dev/analysis" : "analysis";
	const key = `${prefix}/${repoId}/${Date.now()}.bin`; // Using .bin since it's now compressed binary

	const packed = packAnalysisData(data);

	const command = new PutObjectCommand({
		Bucket: BUCKET_NAME,
		Key: key,
		Body: packed,
		ContentType: "application/octet-stream", // Binary content
		Metadata: {
			compressed: "true",
			version: "2",
		},
	});

	await s3Client.send(command);

	// Cleanup old snapshots in the background (fire and forget)
	cleanupOldSnapshots(repoId).catch((err) =>
		console.error("Failed to cleanup old snapshots:", err),
	);

	return key;
}

export async function fetchAnalysisData(key: string): Promise<AnalysisData> {
	const command = new GetObjectCommand({
		Bucket: BUCKET_NAME,
		Key: key,
	});

	const response = await s3Client.send(command);
	if (!response.Body) {
		throw new Error("No body in S3 response");
	}

	const buffer = Buffer.from(await response.Body.transformToByteArray());
	return unpackAnalysisData(buffer);
}

/**
 * Keeps only the 3 most recent analysis snapshots for a repository.
 */
async function cleanupOldSnapshots(repoId: string, keepCount = 3) {
	const folder = env.NODE_ENV === "development" ? "dev/analysis" : "analysis";
	const prefix = `${folder}/${repoId}/`;

	const listCommand = new ListObjectsV2Command({
		Bucket: BUCKET_NAME,
		Prefix: prefix,
	});

	const listResponse = await s3Client.send(listCommand);

	if (!listResponse.Contents || listResponse.Contents.length <= keepCount) {
		return;
	}

	// Sort by Key (contains timestamp) or LastModified, newest first
	const sorted = listResponse.Contents.sort((a, b) => {
		const timeA = a.LastModified?.getTime() || 0;
		const timeB = b.LastModified?.getTime() || 0;
		return timeB - timeA;
	});

	const toDelete = sorted.slice(keepCount);

	if (toDelete.length === 0) return;

	const deleteCommand = new DeleteObjectsCommand({
		Bucket: BUCKET_NAME,
		Delete: {
			Objects: toDelete.map((obj) => ({ Key: obj.Key })),
			Quiet: true,
		},
	});

	await s3Client.send(deleteCommand);
}

