import { requireUser } from "@/core/auth/guards";
import { DomainError } from "@/core/errors/domain-error";
import { errorResponse } from "@/core/errors/mapper";
import {
  formFile,
  formText,
  readUploadForm,
} from "@/core/storage/upload-request";
import { sendMessage } from "@/features/messaging/service/messaging-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const actor = await requireUser();
    const form = await readUploadForm(request);
    const conversationId = formText(form, "conversationId");
    if (!conversationId) {
      throw new DomainError("validation_failed", "A conversation is required.");
    }
    const file = formFile(form, "file");
    const message = await sendMessage({
      actor,
      conversationId,
      content: String(form.get("content") ?? ""),
      file: file && file.size > 0 ? file : null,
    });
    return Response.json({ message }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
