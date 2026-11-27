import { createHash, randomUUID } from "node:crypto";
import { DomainError } from "@/core/errors/domain-error";

export type UploadFormat = "pdf" | "zip";

interface FormatRule {
  extension: string;
  mimeTypes: string[];
  contentType: string;
  signatures: number[][];
}

const FORMAT_RULES: Record<UploadFormat, FormatRule> = {
  pdf: {
    extension: "pdf",
    mimeTypes: ["application/pdf"],
    contentType: "application/pdf",
    signatures: [[0x25, 0x50, 0x44, 0x46, 0x2d]],
  },
  zip: {
    extension: "zip",
    mimeTypes: ["application/zip", "application/x-zip-compressed"],
    contentType: "application/zip",
    signatures: [
      [0x50, 0x4b, 0x03, 0x04],
      [0x50, 0x4b, 0x05, 0x06],
    ],
  },
};

export const ALL_UPLOAD_FORMATS: UploadFormat[] = ["pdf", "zip"];

const MAX_FILE_NAME_LENGTH = 255;

export interface UploadCandidate {
  fileName: string;
  size: number;
  mimeType: string;
}

export interface UploadOptions {
  maxBytes: number;
  formats?: UploadFormat[];
}

function hasControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127;
  });
}

function formatForFileName(fileName: string): UploadFormat | null {
  const dot = fileName.lastIndexOf(".");
  if (dot <= 0) {
    return null;
  }
  const extension = fileName.slice(dot + 1).toLowerCase();
  return (
    ALL_UPLOAD_FORMATS.find(
      (format) => FORMAT_RULES[format].extension === extension,
    ) ?? null
  );
}

export function validateUpload(
  candidate: UploadCandidate,
  options: UploadOptions,
): UploadFormat {
  if (candidate.size > options.maxBytes) {
    throw new DomainError(
      "upload_too_large",
      `Files larger than ${Math.floor(options.maxBytes / 1_048_576)} MB are not accepted.`,
    );
  }
  if (candidate.size <= 0) {
    throw new DomainError("validation_failed", "The file is empty.");
  }
  const name = candidate.fileName;
  if (
    name.trim() === "" ||
    name.length > MAX_FILE_NAME_LENGTH ||
    name.includes("/") ||
    name.includes("\\") ||
    name.includes("..") ||
    hasControlCharacter(name)
  ) {
    throw new DomainError("invalid_filename", "The file name is not valid.");
  }
  const allowed = options.formats ?? ALL_UPLOAD_FORMATS;
  const format = formatForFileName(name);
  if (
    !format ||
    !allowed.includes(format) ||
    !FORMAT_RULES[format].mimeTypes.includes(candidate.mimeType.toLowerCase())
  ) {
    throw new DomainError(
      "unsupported_format",
      `Only ${allowed.map((entry) => entry.toUpperCase()).join(" or ")} files are accepted.`,
    );
  }
  return format;
}

export function assertContentMatchesFormat(
  bytes: Uint8Array,
  format: UploadFormat,
): void {
  const matches = FORMAT_RULES[format].signatures.some((signature) =>
    signature.every((value, index) => bytes[index] === value),
  );
  if (!matches) {
    throw new DomainError(
      "unsupported_format",
      "The file content does not match its format.",
    );
  }
}

export function contentTypeFor(format: UploadFormat): string {
  return FORMAT_RULES[format].contentType;
}

export function buildObjectKey(prefix: string, format: UploadFormat): string {
  return `${prefix}/${randomUUID()}.${FORMAT_RULES[format].extension}`;
}

export function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export interface StoredFileDescriptor {
  fileKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  checksum: string;
}
