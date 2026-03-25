import {
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { env } from "../../env";
import type { AnalysisData } from "../types/analysis";

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

export async function uploadAnalysisData(
	repoId: string,
	data: AnalysisData,
): Promise<string> {
	const key = `analysis/${repoId}/${Date.now()}.json`;

	const command = new PutObjectCommand({
		Bucket: BUCKET_NAME,
		Key: key,
		Body: JSON.stringify(data),
		ContentType: "application/json",
	});

	await s3Client.send(command);
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

	const str = await response.Body.transformToString();
	return JSON.parse(str);
}
