import { revalidatePath } from "next/cache";
import { requireUser } from "@/core/auth/guards";
import { DomainError } from "@/core/errors/domain-error";
import { errorResponse } from "@/core/errors/mapper";
import {
  formFile,
  formText,
  readUploadForm,
} from "@/core/storage/upload-request";
import { submitSupervisorReport } from "@/features/review/service/review-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const actor = await requireUser();
    const form = await readUploadForm(request);
    const file = formFile(form, "file");
    const thesisId = formText(form, "thesisId");
    if (!file || !thesisId) {
      throw new DomainError(
        "validation_failed",
        "A report file and thesis are required.",
      );
    }
    await submitSupervisorReport(
      actor,
      thesisId,
      formText(form, "summary"),
      file,
    );
    revalidatePath("/review");
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
