import type { Readable } from "node:stream";
import { Client } from "minio";
import { getStorageConfig } from "@/core/config/app-config";

let cached: { client: Client; bucket: string; region: string } | null = null;
let bucketReady: Promise<void> | null = null;

function connection() {
  if (cached) {
    return cached;
  }
  const config = getStorageConfig();
  const endpoint = new URL(config.endpoint);
  const useSSL = endpoint.protocol === "https:";
  const client = new Client({
    endPoint: endpoint.hostname,
    port: endpoint.port ? Number(endpoint.port) : useSSL ? 443 : 80,
    useSSL,
    accessKey: config.accessKey,
    secretKey: config.secretKey,
    region: config.region,
  });
  cached = { client, bucket: config.bucket, region: config.region };
  return cached;
}

async function ensureBucket(): Promise<void> {
  const { client, bucket, region } = connection();
  bucketReady ??= client
    .bucketExists(bucket)
    .then(async (exists) => {
      if (!exists) {
        await client.makeBucket(bucket, region);
      }
    })
    .catch((error: unknown) => {
      bucketReady = null;
      throw error;
    });
  await bucketReady;
}

export async function putObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await ensureBucket();
  const { client, bucket } = connection();
  await client.putObject(bucket, key, body, body.length, {
    "Content-Type": contentType,
  });
}

export async function getObject(key: string): Promise<Readable> {
  const { client, bucket } = connection();
  return client.getObject(bucket, key);
}

export async function getObjectBuffer(key: string): Promise<Buffer> {
  const stream = await getObject(key);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function removeObject(key: string): Promise<void> {
  const { client, bucket } = connection();
  await client.removeObject(bucket, key);
}
