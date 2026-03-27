import {
	DeleteObjectCommand,
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import "dotenv/config";

async function testS3() {
	const accessKeyId = process.env.IDRIVE_E2_ACCESS_KEY;
	const secretAccessKey = process.env.IDRIVE_E2_SECRET_KEY;
	const bucketName = process.env.IDRIVE_E2_BUCKET_NAME;
	const region = process.env.IDRIVE_E2_REGION || "eu-central-2";
	const endpoint =
		process.env.IDRIVE_E2_ENDPOINT || `https://s3.${region}.idrivee2.com`;

	console.log("--- S3 Connectivity Test ---");
	console.log(`Region: ${region}`);
	console.log(`Endpoint: ${endpoint}`);
	console.log(`Bucket: ${bucketName}`);
	console.log(`Access Key: ${accessKeyId ? "SET" : "MISSING"}`);
	console.log(`Secret Key: ${secretAccessKey ? "SET" : "MISSING"}`);

	if (!accessKeyId || !secretAccessKey || !bucketName) {
		console.error("Error: Missing required environment variables.");
		process.exit(1);
	}

	const client = new S3Client({
		region,
		endpoint,
		credentials: {
			accessKeyId,
			secretAccessKey,
		},
	});

	const testKey = `test-connection-${Date.now()}.txt`;
	const testContent = "Hello from Git Insights Analyzer S3 Test!";

	try {
		console.log(`\n1. Attempting to upload: ${testKey}...`);
		await client.send(
			new PutObjectCommand({
				Bucket: bucketName,
				Key: testKey,
				Body: testContent,
				ContentType: "text/plain",
			}),
		);
		console.log("✅ Upload successful!");

		console.log(`\n2. Attempting to download: ${testKey}...`);
		const getResponse = await client.send(
			new GetObjectCommand({
				Bucket: bucketName,
				Key: testKey,
			}),
		);
		const downloadedContent = await getResponse.Body?.transformToString();

		if (downloadedContent === testContent) {
			console.log("✅ Download successful and content matches!");
		} else {
			console.error("❌ Downloaded content does not match!");
		}

		console.log(`\n3. Attempting to delete: ${testKey}...`);
		await client.send(
			new DeleteObjectCommand({
				Bucket: bucketName,
				Key: testKey,
			}),
		);
		console.log("✅ Delete successful!");

		console.log("\n✨ S3 Connection Test Passed! ✨");
	} catch (error: any) {
		console.error("\n❌ S3 Connection Test Failed!");
		console.error(`Error Code: ${error.name}`);
		console.error(`Error Message: ${error.message}`);
		if (error.$metadata) {
			console.error(`Request ID: ${error.$metadata.requestId}`);
		}
		process.exit(1);
	}
}

testS3();
