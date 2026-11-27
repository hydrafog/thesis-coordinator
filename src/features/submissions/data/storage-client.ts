import { putObject, removeObject } from "@/core/storage/minio";
import { errorContext, logger } from "@/core/logging/logger";
import {
  assertContentMatchesFormat,
  buildObjectKey,
  contentTypeFor,
  sha256Hex,
  type StoredFileDescriptor,
  type UploadFormat,
} from "../domain/attachment";

export interface StoreFileInput {
  prefix: string;
  fileName: string;
  format: UploadFormat;
  bytes: Buffer;
}

export async function storeFile(
  input: StoreFileInput,
): Promise<StoredFileDescriptor> {
  assertContentMatchesFormat(input.bytes, input.format);
  const fileKey = buildObjectKey(input.prefix, input.format);
  const mimeType = contentTypeFor(input.format);
  await putObject(fileKey, input.bytes, mimeType);
  return {
    fileKey,
    fileName: input.fileName,
    fileSize: input.bytes.length,
    mimeType,
    checksum: sha256Hex(input.bytes),
  };
}

export async function discardFile(fileKey: string): Promise<void> {
  try {
    await removeObject(fileKey);
  } catch (error) {
    logger.warn("orphaned object cleanup failed", {
      fileKey,
      ...errorContext(error),
    });
  }
}
