import { Readable } from "node:stream";
import { getSessionUser } from "@/core/auth/session";
import { DomainError } from "@/core/errors/domain-error";
import { errorResponse } from "@/core/errors/mapper";
import { getObject } from "@/core/storage/minio";
import { verifyDownloadGrant } from "@/core/storage/signed-url";
import { findFileAccessContext } from "@/features/submissions/data/file-access-repository";
import {
  authorizeFileAccess,
  contentDispositionFor,
} from "@/features/submissions/domain/file-access";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new DomainError("unauthenticated", "Sign in to continue.");
    }

    const { key: segments } = await params;
    const key = segments.join("/");
    const query = new URL(request.url).searchParams;
    const granted =
      query.get("u") === user.id &&
      verifyDownloadGrant({
        key,
        userId: user.id,
        expires: Number(query.get("exp")),
        signature: query.get("sig") ?? "",
      });
    if (!granted) {
      throw new DomainError("forbidden", "This download link is not valid.");
    }

    const context = await findFileAccessContext(key);
    if (!context) {
      throw new DomainError("not_found", "File not found.");
    }
    authorizeFileAccess(context, user);

    const stream = await getObject(key);
    return new Response(Readable.toWeb(stream) as unknown as ReadableStream, {
      headers: {
        "content-type": context.mimeType,
        "content-disposition": contentDispositionFor(context.fileName),
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
