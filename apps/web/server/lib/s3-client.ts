import { S3Client } from "@aws-sdk/client-s3";
import { env } from "~/env";

export const s3Client = new S3Client({
	region: env.IDRIVE_E2_REGION,
	endpoint: env.IDRIVE_E2_ENDPOINT.startsWith("http")
		? env.IDRIVE_E2_ENDPOINT
		: `https://${env.IDRIVE_E2_ENDPOINT}`,
	credentials: {
		accessKeyId: env.IDRIVE_E2_ACCESS_KEY,
		secretAccessKey: env.IDRIVE_E2_SECRET_KEY,
	},
	forcePathStyle: true,
});

export const BUCKET_NAME = env.IDRIVE_E2_BUCKET_NAME;
