import { revalidatePath } from "next/cache";
import { requireUser } from "@/core/auth/guards";
import { DomainError } from "@/core/errors/domain-error";
import { errorResponse } from "@/core/errors/mapper";
import {
  formFile,
  formText,
  readUploadForm,
} from "@/core/storage/upload-request";
import { uploadSubmissionVersion } from "@/features/submissions/service/submission-service";

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
        "A file and thesis are required.",
      );
    }
    const result = await uploadSubmissionVersion({
      actor,
      thesisId,
      submissionId: formText(form, "submissionId"),
      title: formText(form, "title") ?? "",
      notes: formText(form, "notes"),
      milestoneId: formText(form, "milestoneId"),
      file,
    });
    revalidatePath("/supervision");
    revalidatePath("/review");
    return Response.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
