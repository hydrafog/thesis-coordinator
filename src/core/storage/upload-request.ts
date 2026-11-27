import { getMaxUploadBytes } from "@/core/config/app-config";
import { DomainError } from "@/core/errors/domain-error";

const MULTIPART_OVERHEAD_BYTES = 1_048_576;

export async function readUploadForm(request: Request): Promise<FormData> {
  const length = Number(request.headers.get("content-length"));
  if (!Number.isFinite(length) || length <= 0) {
    throw new DomainError(
      "validation_failed",
      "Uploads must declare their size.",
    );
  }
  if (length > getMaxUploadBytes() + MULTIPART_OVERHEAD_BYTES) {
    throw new DomainError(
      "upload_too_large",
      `Files larger than ${Math.floor(getMaxUploadBytes() / 1_048_576)} MB are not accepted.`,
    );
  }
  try {
    return await request.formData();
  } catch {
    throw new DomainError("validation_failed", "The upload is not valid.");
  }
}

export function formText(form: FormData, name: string): string | null {
  const value = form.get(name);
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function formFile(form: FormData, name: string): File | null {
  const value = form.get(name);
  return value instanceof File ? value : null;
}
